---
name: Browser testing on Nix
description: Why browser regression runners may need the supported Replit Chromium rather than a downloaded binary.
---

A successful Playwright browser download does not guarantee that its binary can
run in Replit’s Nix environment. Prefer the supported system Chromium when it is
available, while keeping ordinary Playwright defaults for other environments.

**Why:** The downloaded Chromium failed to launch with a missing
`libglib-2.0.so.0`, while Replit’s supported Chromium successfully exercised the
same dashboard fixtures. This was a test-runtime problem, not an app or
authentication failure.

**How to apply:** Diagnose browser launch failures before changing application
code or OAuth settings. Keep executable selection portable and explicit, and
keep screenshots and traces in ignored generated-output directories.
