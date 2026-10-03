---
name: BOPs cost source access
description: Owner-only source configuration and manual refresh for Cost Center BOPs.
---

Cost Center BOPs Google Sheet configuration and manual refresh must be available only to the existing app owner, not everyone with general access or a broadly assigned admin role.

**Why:** The user explicitly requested those controls be visible only to their own account.

**How to apply:** Use the existing authoritative owner identity. Enforce the restriction in both the interface and source-changing server endpoints. Keep this cost source distinct from BOPs revenue and the general SG&A sheet.