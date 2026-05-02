# Car-Rental — Deploy Bundle

Single Linux VM deployment for the three Car-Rental services (Spring Boot API, Python SOAP currency converter, React frontend) plus Postgres, fronted by Caddy with automatic HTTPS.

## What's in here

| File | Purpose |
|---|---|
| `docker-compose.yml` | 5-container stack: caddy + frontend + api + currency + postgres |
| `Caddyfile` | Reverse-proxy config: `/api/*` and `/actuator/*` → api, everything else → frontend SPA |
| `.env.example` | Template for `.env` (which is git-ignored — never commit secrets) |
| `deploy.sh` | `git pull` each service repo, then `docker compose up -d --build` |

## Required directory layout

The compose file expects the four repos cloned side-by-side. Default paths:

```
~/  (or /srv)
├── Car-Rental-deploy/        ← this repo
├── SE_CarRental/             ← Spring Boot api
├── SE_CurrencyConverter/     ← Python SOAP currency service
└── frontend-car-rental/      ← React + Vite SPA
```

If your layout differs, set `FRONTEND_PATH`, `API_PATH`, `CURRENCY_PATH` in `.env`.

---

## Local test (before touching Azure)

Verifies the compose file works end-to-end on your laptop.

```bash
cd ~/projects/Car-Rental-deploy
cp .env.example .env

# For local HTTP-only test (no cert), set:
#   PUBLIC_HOSTNAME=:80
#   VITE_API_BASE_URL=http://localhost
# in .env, then:

docker compose up --build
```

Open `http://localhost` in a browser → React SPA loads, register a user, browse cars.

Tail logs: `docker compose logs -f`

Tear down: `docker compose down` (volumes preserved). Add `-v` to nuke the database volume too.

---

## Provisioning the Azure VM (one-time)

```bash
az login
./scripts/provision-vm.sh
```

This creates the resource group, the VM (with `cloud-init.yml` installing Docker on first boot), opens ports 22/80/443, promotes the public IP to Static, and gives it a free `*.cloudapp.azure.com` DNS name. The script prints the resulting FQDN at the end.

Customize via env vars before running:
```bash
RG=rg-carrental LOCATION=westeurope VM_SIZE=Standard_B2s ./scripts/provision-vm.sh
```

Re-runs are idempotent — `az vm show` skips creation if the VM exists.

### First-time bootstrap on the VM

```bash
ssh azureuser@carrental-CHANGEME.westeurope.cloudapp.azure.com

git clone https://github.com/<you>/Car-Rental-deploy.git
git clone https://github.com/<you>/SE_CarRental.git
git clone https://github.com/<you>/frontend-car-rental.git
git clone https://github.com/<you>/SE_CurrencyConverter.git

cd Car-Rental-deploy
cp .env.example .env
nano .env          # fill in real secrets
chmod 600 .env

./deploy.sh
docker compose logs -f
```

First boot of Spring is slow (~45 s). Caddy fetches the Let's Encrypt cert on first HTTPS request — also takes ~30 s.

---

## Day-to-day

| Task | Command |
|---|---|
| Re-deploy after a `git push` | `./deploy.sh` |
| Tail one service's logs | `docker compose logs -f api` |
| Restart one service | `docker compose restart api` |
| Open a Postgres shell | `docker compose exec postgres psql -U carrental` |
| Pause the stack | `docker compose stop` |
| Restart the stack | `docker compose start` |

### Backups

`scripts/backup.sh` does a `pg_dump`, gzips it into `backups/`, and prunes anything older than 7 days. Run it manually any time, or schedule it via cron on the VM (edit with `crontab -e`):

```
0 3 * * * /home/azureuser/Car-Rental-deploy/scripts/backup.sh >> /home/azureuser/Car-Rental-deploy/backups/backup.log 2>&1
```

Restore:

```bash
gunzip -c backups/carrental-2026-04-28T030000Z.sql.gz | docker compose exec -T postgres psql -U carrental carrental
```

### Cost control

Stop billing for compute when you're not demoing — the disk and DNS name persist, only ~$2/mo runs.

```bash
az vm deallocate -g rg-carrental -n vm-carrental   # stop billing
az vm start      -g rg-carrental -n vm-carrental   # bring back
```

---

## Rollback

```bash
ssh azureuser@<vm>
cd ~/SE_CarRental
git log --oneline -10            # find a known-good sha
git checkout <sha>
cd ~/Car-Rental-deploy
docker compose up -d --build api
```

Roll forward by switching back to `main`.

---

## CI/CD (optional)

`.github/workflows/deploy.yml` is included — once you push this repo to GitHub and add three secrets (`VM_HOST`, `VM_USER`, `VM_SSH_KEY`), every push to `main` triggers an SSH deploy. See `.github/workflows/README.md` for the one-time setup and how to wire the same workflow into the service repos so their pushes also trigger redeploys.

## What this bundle does NOT do

- No managed Postgres / no Azure Key Vault / no Container Apps / no AKS — by design, single VM is the whole story.
- No monitoring beyond `docker logs`. Acceptable for a uni-project scale.
- **No application-code hardening** (Phase 2 of the plan: stripping fallback secret defaults from `SE_CarRental/src/main/resources/application.yml` and adding a CORS bean to `SecurityConfig.java`). Skipped because the user reserved code changes in `SE_CarRental` and `SE_CurrencyConverter`. Until those are done, set every required env var in `.env` carefully — the fallback values in `application.yml` are the only safety net.
