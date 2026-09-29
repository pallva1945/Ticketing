#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Refresh dependencies from the committed lockfile; database tables are
# initialized idempotently by the server when the workflow restarts.
npm ci --no-audit --no-fund
npm run build