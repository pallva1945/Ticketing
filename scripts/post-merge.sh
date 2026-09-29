#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Update only what changed. A clean install deletes the working dependency
# tree before downloading and can leave the preview broken if a package is blocked.
# Database tables are initialized idempotently when the server restarts.
npm install --no-audit --no-fund --prefer-offline
npm run build