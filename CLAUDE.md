# Car-Rental Deploy Bundle — Claude Notes

## What this repo is

A pure deploy bundle. The application code lives in three sibling repos:

- `../SE_CarRental/` — Spring Boot 4 / Java 17 / Maven / Postgres 17 (backend API)
- `../SE_CurrencyConverter/` — Python 3.12 / Spyne SOAP service
- `../frontend-car-rental/` — React 19 / Vite / TypeScript

This bundle ties them together for a **single Linux VM on Azure** deployment via `docker compose` + Caddy (auto-HTTPS).

## Hard rules

- **Do NOT modify code in `SE_CarRental/` or `SE_CurrencyConverter/`** unless the user explicitly asks. Both have multiple contributors (notably `fgeroe` on SE_CarRental). Healthchecks, env wiring, etc. are done at the compose layer here, not by editing those repos' Dockerfiles or source.
- **Frontend (`frontend-car-rental/`) is in scope** — single-author repo. Editing Dockerfile, nginx.conf, or `src/api/client.ts` is OK.
- The **shared SOAP API key** lives in `.env` as `CURRENCY_API_KEY` and is wired into both Spring (`CURRENCY_CONVERTER_API_KEY`) and Python (`CURRENCY_API_KEY`) by `docker-compose.yml`. They MUST match — never let them drift.

## How the stack wires up

```
Caddy :80/:443  ──/api/*──▶ api:8080  (Spring)  ──SOAP──▶ currency:8000 (Python)
                ──/actuator/*▶ api:8080                          │
                ──/*────────▶ frontend:80 (nginx, static React)  │
                                                                 ▼
                                                       postgres:5432
```

All inter-container calls use Docker DNS (`api`, `currency`, `postgres`) — no localhost, no host networking.

## Deployment workflow

1. **Local test:** `cp .env.example .env`, set `PUBLIC_HOSTNAME=:80` and `VITE_API_BASE_URL=http://localhost`, then `docker compose up --build`. Open `http://localhost`.
2. **VM provision (one-time):** `./scripts/provision-vm.sh` (or follow README). Hands back a `*.cloudapp.azure.com` DNS name.
3. **Bootstrap on VM:** ssh in, clone all 4 repos side-by-side, `cp .env.example .env` with real secrets, run `./deploy.sh`.
4. **Re-deploy:** `./deploy.sh` (re-pulls all 4 repos, rebuilds, restarts).
5. **Auto-deploy on push:** GitHub Actions workflow at `.github/workflows/deploy.yml` ssh's to the VM and runs `./deploy.sh`. Only triggers on pushes to **this** repo by default — to also trigger on pushes to the service repos, add the same workflow file to each one (the user owns that change).

## Phase 2 (deferred)

The plan's Phase 2 — strip fallback secrets in `SE_CarRental/src/main/resources/application.yml` (`JWT_SECRET`, `POSTGRES_PASSWORD`, `CURRENCY_CONVERTER_API_KEY` defaults) and add a CORS bean to `SecurityConfig.java` — was **deferred** because the user does not want backend code touched. If/when revisited, the changes are:
- application.yml: drop the `:default-value` part after each of those three env-var refs.
- SecurityConfig.java: add a `CorsConfigurationSource` bean reading `APP_CORS_ALLOWED_ORIGINS` (comma-separated).

Until then, the fallback values in `application.yml` are what runs if the env var is unset — relying on `.env` being set correctly is the only guard.

## Memory

The full plan that produced this bundle: `/Users/lindritprekaj/.claude/plans/kind-watching-giraffe.md`.
