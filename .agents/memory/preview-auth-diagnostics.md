---
name: Preview authentication diagnostics
description: Distinguish local screenshot Google-origin errors from actual HTTPS preview authentication.
---

Diagnose Google sign-in using the actual HTTPS development preview origin before changing OAuth configuration. An origin error in a localhost screenshot does not establish that the user's preview origin is rejected.

**Why:** A local screenshot reported Google's disallowed-origin error, while a fresh browser at the actual HTTPS development origin rendered the Google button successfully.

**How to apply:** Verify connectivity and the unauthenticated login screen separately from successful sign-in. Browser checks using mocked authentication verify dashboard behavior, not the real sign-in journey. Do not bypass authentication to make preview work.

For “couldn't reach this app,” compare the exact reported URL with the platform's public preview URL before changing networking or authentication.

**Why:** A healthy main preview did not reproduce the user's failure because their link appended the internal server port to the public HTTPS domain. Inactive mappings were also present, but were not the confirmed cause.

**How to apply:** Use the main public development URL without appending a local server port, preserving the requested path and fragment. A successful probe of a different URL does not verify the failing one. Do not keep restarting a healthy server.