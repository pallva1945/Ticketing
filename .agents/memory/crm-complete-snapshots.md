---
name: Complete CRM snapshots
description: Why CRM pagination must retain one coherent dataset and reject incomplete loads.
---

Retain full-snapshot loading while the dataset fits a safe memory budget; never silently truncate or replace a complete cache with a partial refresh.

**Why:** CRM search and season/capacity filters currently depend on full local detail. Switching only the data reader to partial detail would make those views disagree with complete server totals.

**How to apply:** Pagination must read one query-job snapshot, not separately queried offsets on a changing source. If growth requires server-side detail pagination, move all dependent filtering/search behavior together rather than exposing partial rows as the complete dataset.