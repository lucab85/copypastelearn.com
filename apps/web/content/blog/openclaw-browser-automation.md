---
title: "OpenClaw Browser Automation"
description: "Use OpenClaw's browser tool for web automation — scraping, testing, form filling, and monitoring. No Selenium or Puppeteer setup needed."
date: "2026-02-12"
author: "Luca Berton"
category: "OpenClaw"
tags: ["OpenClaw", "Browser Automation", "Web Scraping"]
---

An agent that can only call APIs is blind to most of the web. Plenty of the sites and tools you actually deal with day to day — a vendor's admin console, an internal dashboard, a SaaS billing page — don't expose an API at all, and even the ones that do usually don't cover the specific workflow you need, like something behind a login wall or a layout you need to visually confirm. Browser control closes that gap: instead of asking whether an endpoint exists for the task, the agent opens a page, reads what's rendered, and clicks or types exactly where a human would. That's the difference this post covers — not what OpenClaw is in general, but what changes once it can drive a real browser.

## Prerequisites

You'll need OpenClaw installed and running — see [10 Things to Do After Installing OpenClaw](/blog/10-things-after-installing-openclaw) if you haven't set up the basics yet. For the built-in browser tool, there's nothing else to install; Playwright ships with OpenClaw. For the Chrome Extension Relay covered further down, you'll additionally need Google Chrome (or a Chromium-based browser it supports) and the OpenClaw Browser Relay extension installed from the browser's extension store.

## Built-In Browser Control

OpenClaw includes a browser automation tool powered by Playwright. No additional setup — it's ready to use.

This is a separate, sandboxed browser instance that OpenClaw launches and controls directly — it isn't your everyday Chrome window. That separation is deliberate: the agent gets a clean, isolated environment to navigate in, with no risk of it touching tabs, cookies, or sessions from the browser you use for work. For scraping, testing against a fresh session, or anything that doesn't require you to already be logged in somewhere, this built-in browser is normally what you want. When you do need the agent to see a page the way you see it — already authenticated, with your cookies and session state — that's what the Chrome Extension Relay, described below, is for.

## Basic Operations

Each action below maps to one call the agent makes against the browser tool. Together they cover the full loop an agent needs: load a page, read what's on it, and act on it.

### Open a Page

```
browser(action: "open", targetUrl: "https://example.com")
```

### Take a Screenshot

```
browser(action: "screenshot")
```

### Get Page Content

```
browser(action: "snapshot")
```

Returns an accessible tree of the page — headings, links, buttons, text content. This is the primary way the agent "reads" a page: rather than parsing raw HTML or a screenshot pixel by pixel, it gets a structured list of the interactive and textual elements, each tagged with a short reference like `e12`. That reference is what you'll use in the next two actions.

### Click Elements

```
browser(action: "act", request: {
  kind: "click", ref: "e12"
})
```

### Fill Forms

```
browser(action: "act", request: {
  kind: "fill", ref: "e15", text: "hello&#64;example.com"
})
```

Both `click` and `fill` operate on the `ref` values returned by the most recent snapshot, not on CSS selectors or XPath. That matters in practice: a site's markup can change its classes and IDs on every deploy, but the accessible tree — the roles and labels a screen reader would see — tends to stay stable. If a page updates after an action (a modal closes, a new section loads), take a fresh snapshot before issuing the next `click` or `fill`, since old refs can point at elements that no longer exist.

## Use Cases

Each of these is a phrasing you could give the agent directly; it decides which browser actions to chain together to get there.

### Price Monitoring

"Check the price of this product every day and alert me if it drops below €50."

Walked through step by step, this is: `open` the product page on a schedule, `snapshot` to read the current price element, compare it against the threshold you gave it, and only message you when the condition is met. Because the check runs against the live page instead of a cached API response, it holds up on sites that don't publish pricing data anywhere else — which is most of them.

### Content Research

"Open these 5 URLs and summarize the key points from each article."

### Form Automation

"Fill out the weekly status report form with this week's updates."

### Visual Testing

"Take a screenshot of our landing page and compare it to last week's version."

### Data Extraction

"Go to this page and extract all the course titles and prices into a table."

## Chrome Extension Relay

The OpenClaw process running on your machine (or server) has no direct line into a Chrome window you already have open — it can't reach into that process, read its cookies, or dispatch clicks to it. Playwright's built-in browser works around that by launching its own instance, but that instance starts with a blank session: no login, no history, nothing. If the task needs a page where you're already signed in, that gap is a real problem.

The relay extension solves it by acting as a bridge. It runs inside your actual Chrome, and once you share a tab with it, it forwards the agent's commands (open, click, fill, read) into that tab and sends back what the page contains. The agent still can't rummage through your whole browser — it only sees and acts on the tab you've explicitly shared — but for that tab, it's now working with your real, already-authenticated session instead of a fresh one.

For accessing your actual browser session:

1. Install the OpenClaw Browser Relay extension
2. Click the toolbar icon on the tab you want to share
3. Your agent can now see and interact with that tab

This is useful for:
- Pages behind authentication
- Complex web apps
- Debugging in real-time

## Profiles

OpenClaw supports two browser profiles:

- **`openclaw`** — isolated browser managed by OpenClaw
- **`chrome`** — relay to your actual Chrome browser via extension

The split exists to keep two different kinds of browsing from bleeding into each other. The `openclaw` profile is disposable: it has its own cookie jar and session state, so a scraping run or an automated test can't accidentally pick up your logged-in accounts, and nothing it does — cookies set, local storage written, history created — carries over into your personal browsing. The `chrome` profile is the opposite by design: it deliberately shares your session so the agent can act as you on a site you're already authenticated with. Picking the right one is really a question of whether the task needs your identity or should be kept away from it. Default to `openclaw` unless the task specifically requires being logged in as you, and don't relay a tab you wouldn't want an automated process reading and clicking around in.

## Safety Considerations

Once an agent can click around a real, logged-in browser tab, it can also trigger anything a click on that page can trigger — including actions that don't have an undo. A misread button label, a stale `ref` pointing at the wrong element after a page update, or a snapshot that missed a confirmation dialog can result in a form getting submitted, a subscription getting cancelled, or an email getting sent before you'd have approved it. Unlike scraping a public page, this class of mistake isn't recoverable by just re-running the task.

Treat any action with real-world side effects — payments, deletions, sending messages, changing account settings — as something that needs a checkpoint, not something to hand off end to end. In practice that means phrasing instructions so the agent stops and reports back before the irreversible step ("find the cancellation button and tell me what it says" rather than "cancel my subscription"), and reviewing what it read from the page before it acts on stale or ambiguous elements. This matters more with the `chrome` relay profile than with `openclaw`, precisely because the relay is operating with your actual credentials and can reach anything that session can reach.

## Tips

**Use snapshots over screenshots.** A snapshot is text — an accessible tree of headings, links, and buttons — while a screenshot is an image the model has to visually interpret. Text is both cheaper to process and more precise for locating a specific element, so reach for `screenshot` only when you actually need visual confirmation, like checking a layout or comparing a rendered design.

**Reference elements by `ref`, not by guessing at selectors.** Refs come from the accessible tree, which tracks a page's semantic structure rather than its CSS classes or generated IDs. Sites change their markup on every deploy far more often than they change their semantics, so ref-based targeting keeps working when a selector-based approach would silently break.

**Wait for the page to settle before acting on it.** A `click` or `fill` issued immediately after `open` can land on a page that hasn't finished loading — the element you want might not exist yet, or might exist at a different position once the layout shifts. A short delay, or a snapshot check confirming the expected content is present, avoids acting on an incomplete page.

**Handle popups before they block you.** Cookie consent banners and modal dialogs are common enough that they should be an expected step, not an edge case — if a click seems to silently fail, check the latest snapshot for an overlay sitting on top of the element you're targeting.

**Be respectful of the sites you automate.** Some sites prohibit scraping in their terms of service, and hammering a page with automated requests can look indistinguishable from abuse to the site's infrastructure. Keep request rates reasonable and don't automate around a site that has explicitly said not to.

---

**Ready to go deeper?** Check out our hands-on course: [OpenClaw Agent](/courses/openclaw-agent) — practical exercises you can follow along on your own machine.

## Related guide

Related reading: [the Ansible intelligent assistant and MCP server](https://lucaberton.com/blog/ansible-automation-intelligent-assistant-mcp-server-byok-rag-2026/) covers this in real-world detail.

