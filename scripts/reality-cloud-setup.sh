#!/usr/bin/env bash
set -euo pipefail

# Run as the Codex cloud environment setup script from the repository root.
# No keys are needed for the deterministic mission. Browser binaries are used
# only for automated visual QA; no GPU is assumed.
node --version
npm ci
npx puppeteer browsers install chrome --install-deps
npm run doctor
