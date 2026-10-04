---
name: Preview hot-reload verification
description: Shared translation edits can briefly fail during hot reload even when a fresh page load works.
---

Distinguish hot-reload failures from failures on a fresh page load when verifying frontend changes.

**Why:** Repeated edits to shared translations triggered broad Fast Refresh invalidation, duplicate-root warnings, and transient React `removeChild` errors. The automatic full-page reload then restored the app and its cached data. These observations do not establish a persistent application or production failure.

**How to apply:** If these errors appear immediately after a shared-provider edit, check whether the subsequent full reload recovers before diagnosing a backend, authentication, or data problem. Do not suppress errors or assume recovery without evidence.