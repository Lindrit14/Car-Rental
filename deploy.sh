#!/usr/bin/env bash
# Pulls the latest commit on the monorepo, then rebuilds and restarts the stack.
# Idempotent — safe to run as often as you like.

set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -d "${DEPLOY_DIR}/.git" ]]; then
  echo "→ git pull  ${DEPLOY_DIR}"
  git -C "${DEPLOY_DIR}" pull --ff-only
else
  echo "⚠ ${DEPLOY_DIR} is not a git checkout — skipping pull"
fi

cd "${DEPLOY_DIR}"
docker compose up -d --build
docker image prune -f
docker compose ps
