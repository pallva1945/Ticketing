---
name: Season rollover without fabricated figures
description: How to handle default-season changes when a dashboard has only prior-season figures
---

When the portal's default season advances, select the new season in season-aware views without replacing historical figures or reusing prior-year totals as current-year data. If a view only has historical data, show a clear no-data state for the new season while keeping historical seasons accessible.

**Why:** Some cost analysis is manually populated for past seasons only. Moving its selection forward without new source figures would otherwise either crash the view or present outdated numbers as current.

**How to apply:** Before rolling a season forward, distinguish season-specific records and historical comparisons from default filters and current-season labels. Change defaults and current-season computations; leave source data and event-specific classifications untouched unless new data is supplied.