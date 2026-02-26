---
title: "OpenClaw Browser Automation: Web Scraping and Testing"
description: "Use OpenClaw's browser tool for web automation — scraping, testing, form filling, and monitoring. No Selenium or Puppeteer setup needed."
date: "2026-02-12"
author: "Luca Berton"
tags: ["OpenClaw", "Browser Automation", "Web Scraping"]
---

## Built-In Browser Control

OpenClaw includes a browser automation tool powered by Playwright. No additional setup — it's ready to use.

## Basic Operations

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

Returns an accessible tree of the page — headings, links, buttons, text content.

### Click Elements

```
browser(action: "act", request: {
  kind: "click", ref: "e12"
})
```

### Fill Forms

```
browser(action: "act", request: {
  kind: "fill", ref: "e15", text: "hello@example.com"
})
```

## Use Cases

### Price Monitoring

"Check the price of this product every day and alert me if it drops below €50."

### Content Research

"Open these 5 URLs and summarize the key points from each article."

### Form Automation

"Fill out the weekly status report form with this week's updates."

### Visual Testing

"Take a screenshot of our landing page and compare it to last week's version."

### Data Extraction

"Go to this page and extract all the course titles and prices into a table."

## Chrome Extension Relay

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

## Tips

1. **Use snapshots over screenshots** — text is cheaper than images
2. **Reference elements by ref** — more reliable than CSS selectors
3. **Wait for page load** — add small delays after navigation
4. **Handle popups** — cookie banners and modals may block elements
5. **Be respectful** — don't scrape sites that prohibit it
