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

# Caddy uses a static image and a bind-mounted Caddyfile, so `up -d --build`
# never recreates it and a Caddyfile edit on disk doesn't reach the running
# process. Reload explicitly so route changes (e.g. /api/locations) take effect
# on every deploy. Tolerated to fail (e.g. first-ever deploy when Caddy isn't up
# yet) — `docker compose up -d` above will have started it cleanly.
docker compose exec -T caddy caddy reload \
  --config /etc/caddy/Caddyfile \
  --adapter caddyfile || true

docker image prune -f
docker compose ps
