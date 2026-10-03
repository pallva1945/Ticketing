---
name: Preview authentication diagnostics
description: Distinguish local screenshot Google-origin errors from actual HTTPS preview authentication.
---

Diagnose Google sign-in using the actual HTTPS development preview origin before changing OAuth configuration. An origin error in a localhost screenshot does not establish that the user's preview origin is rejected.

**Why:** A local screenshot reported Google's disallowed-origin error, while a fresh browser at the actual HTTPS development origin rendered the Google button successfully.

**How to apply:** Verify connectivity and the unauthenticated login screen separately from successful sign-in. Browser checks using mocked authentication verify dashboard behavior, not the real sign-in journey. Do not bypass authentication to make preview work.