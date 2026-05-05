---
title: "INP Core Web Vitals Guide 2026"
slug: "inp-core-web-vitals-guide"
date: "2026-03-29"
category: "Development"
tags: ["INP", "Core Web Vitals", "Performance", "Web Development", "SEO"]
excerpt: "Master Interaction to Next Paint (INP). Understand the Core Web Vital metric that replaced FID, how to measure it, and how to fix poor scores."
description: "Master Interaction to Next Paint (INP), the Core Web Vital that replaced FID. How to measure, diagnose, and fix poor INP scores."
author: "Luca Berton"
---

Interaction to Next Paint (INP) is the Core Web Vital that measures how fast your website responds to user interactions. It replaced First Input Delay (FID) in March 2024 as Google's responsiveness metric.

## What is INP?

INP measures the time from when a user interacts with your page (click, tap, or keypress) to when the browser paints the next visual update. It captures the **full interaction lifecycle**:

```
User clicks button
  → Event handlers run (JavaScript)
    → Browser recalculates styles
      → Browser performs layout
        → Browser paints the update
          = INP measurement
```

**INP thresholds:**

| Score | Rating | User Experience |
|---|---|---|
| ≤ 200ms | Good ✅ | Feels instant |
| 200–500ms | Needs Improvement ⚠️ | Noticeable delay |
| > 500ms | Poor ❌ | Feels broken |

## INP vs FID: What Changed?

| Aspect | FID (Old) | INP (Current) |
|---|---|---|
| What it measures | Input delay only | Full interaction to paint |
| Which interactions | First interaction only | All interactions |
| Score used | Single value | 75th percentile of all |
| Captures long tasks | Partially | Fully |
| Real user impact | Low correlation | High correlation |

FID only measured the delay before your event handler ran — it ignored how long the handler took and how long the browser took to paint. INP captures the entire pipeline.

## How to Measure INP

### Chrome DevTools

1. Open DevTools → Performance tab
2. Enable "Web Vitals" lane
3. Interact with the page
4. Look for INP markers in the timeline

### PageSpeed Insights

Visit [pagespeed.web.dev](https://pagespeed.web.dev) and enter your URL. The "Core Web Vitals Assessment" section shows real-user INP data from the Chrome User Experience Report (CrUX).

### JavaScript API

```javascript
// Using web-vitals library
import { onINP } from 'web-vitals';

onINP((metric) => {
  console.log('INP:', metric.value, 'ms');
  console.log('Element:', metric.attribution.interactionTarget);
  console.log('Type:', metric.attribution.interactionType);

  // Send to analytics
  sendToAnalytics({
    name: 'INP',
    value: metric.value,
    target: metric.attribution.interactionTarget,
  });
});
```

### Lighthouse

```bash
npx lighthouse https://your-site.com --only-categories=performance
```

Note: Lighthouse measures lab INP (simulated). Real-user data from CrUX is more reliable.

## Common INP Problems and Fixes

### 1. Long JavaScript Tasks

**Problem**: Event handlers that take > 50ms block the main thread.

```javascript
// Bad — blocks main thread
button.addEventListener('click', () => {
  const result = heavyComputation(data); // 300ms
  updateUI(result);
});
```

**Fix**: Break up long tasks with `scheduler.yield()` or `setTimeout`:

```javascript
// Good — yields to browser between chunks
button.addEventListener('click', async () => {
  showLoadingState();
  await scheduler.yield(); // Let browser paint loading state

  const result = heavyComputation(data);
  await scheduler.yield(); // Yield again before DOM update

  updateUI(result);
});
```

### 2. Layout Thrashing

**Problem**: Reading and writing DOM properties in a loop forces synchronous layout.

```javascript
// Bad — forces layout on every iteration
items.forEach(item => {
  const height = item.offsetHeight; // Read → forces layout
  item.style.height = height * 2 + 'px'; // Write → invalidates layout
});
```

**Fix**: Batch reads and writes:

```javascript
// Good — read all, then write all
const heights = items.map(item => item.offsetHeight);
items.forEach((item, i) => {
  item.style.height = heights[i] * 2 + 'px';
});
```

### 3. Third-Party Scripts

**Problem**: Analytics, chat widgets, and ad scripts compete for main thread time.

**Fix**: Load non-critical scripts with `async` or `defer`, and use `requestIdleCallback`:

```html
<!-- Defer non-critical scripts -->
<script src="analytics.js" defer></script>

<!-- Or load dynamically after interaction -->
<script>
  document.addEventListener('click', () => {
    import('./heavy-widget.js');
  }, { once: true });
</script>
```

### 4. Large DOM Size

**Problem**: Pages with 1,000+ DOM nodes are slow to update.

**Fix**: Virtualize long lists and lazy-load off-screen content:

```javascript
// Use virtual scrolling for long lists
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });
  // Only renders visible items
}
```

### 5. React Re-renders

**Problem**: Unnecessary component re-renders during interactions.

**Fix**: Memoize expensive components and use `useTransition`:

```javascript
import { useTransition, memo } from 'react';

const ExpensiveList = memo(({ items }) => (
  items.map(item => <ListItem key={item.id} {...item} />)
));

function SearchPage() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSearch(e) {
    const value = e.target.value;
    setQuery(value); // Urgent: update input immediately

    startTransition(() => {
      filterResults(value); // Non-urgent: can be deferred
    });
  }
}
```

## INP Debugging Checklist

1. **Identify the worst interaction** — use `web-vitals` attribution to find which element and event type
2. **Profile in DevTools** — Performance tab → record → interact → find long tasks
3. **Check for layout thrashing** — purple "Layout" bars in the flame chart
4. **Audit third-party scripts** — block them one by one to measure impact
5. **Measure DOM size** — `document.querySelectorAll('*').length` (aim for < 1,500)
6. **Test on real devices** — lab data on fast laptops hides real-world issues

## INP and SEO

Google uses Core Web Vitals (including INP) as a ranking signal. Poor INP can:

- Lower your search rankings
- Trigger "Page experience" warnings in Search Console
- Reduce user engagement (slow sites lose visitors)

A good INP score helps both SEO and user retention.

## What's Next?

Building fast, responsive web applications requires solid fundamentals. Our **Node.js REST APIs** course teaches you to build performant backends, and our **Docker Fundamentals** course covers optimized deployment. First lessons are free.
-e 
---

**Ready to go deeper?** Explore our [hands-on DevOps courses](/courses) — practical labs covering Docker, Ansible, Terraform, and more.

