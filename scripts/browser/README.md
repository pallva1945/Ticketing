# XShop history interface regression tests

Run `npm run check:xshop-history-ui` after installing the Playwright Chromium
browser (`npx playwright install chromium`). The suite starts Vite if needed, or
reuses the preview on port 5000. Set `HISTORY_UI_BASE_URL` to an already running
development server to skip server startup.

On Replit the runner automatically uses `/repl/tools/bin/chromium` with its Nix
runtime libraries; a downloaded Chromium can fail there with missing shared
libraries. Elsewhere it defaults to Playwright's installed Chromium. Set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use another compatible browser executable.

These tests load the real dashboard, AuthProvider, language controls, snapshot
notice and history component. Authentication and API responses are intercepted
in the browser with synthetic fixtures; every `/api/` request is intercepted,
and Firebase persistence traffic is blocked. They neither create real accounts
nor access live shop data or private storage.

Coverage includes admin/full/merchandising-only authorization, restricted users
making zero history requests, English and Italian diagnostics, every fixed failure
reason, unfinished attempts, zero/null/nonzero recognized counts, storage
warnings, language switching, closed-panel polling cleanup, and clearing history
after 401/403 or failed periodic auth verification.

This verifies signed-in **UI behavior with simulated sessions**, not real
Google/password sign-in, server-side access control, production behavior, or
shared private-storage downloads. Server authorization and persistence remain
covered by `scripts/check-xshop-history.test.mjs`; real storage verification is a
separate deliverable. Failure traces and screenshots stay under the ignored
`generated-artifacts/history-ui/` directory.
