---
name: Dashboard cold-start independence
description: Slow full-provider downloads must not block already available commercial dashboards.
---

Core dashboard data must become usable independently of unrelated, slower provider downloads.

**Why:** A fresh-browser GameDay comparison test stayed empty because initial loading waited for the full Shopify download even though Ticketing and GameDay endpoints were already responding. Cached browser sessions concealed the problem.

**How to apply:** For dashboard-loading changes, inspect both uncached browser startup and provider latency. Do not add a heavy download to a shared initialization barrier merely because it appears fast with warm caches.