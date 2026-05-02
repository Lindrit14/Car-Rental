# GitHub Actions

## `deploy.yml`

Triggers on every push to `main` of **this** repo (Car-Rental-deploy). SSHes into the VM and runs `./deploy.sh`, which re-pulls all four repos and re-builds the stack.

### One-time setup

1. **Generate a dedicated SSH keypair on your laptop:**
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/carrental-deploy -C "github-actions-deploy" -N ""
   ```
2. **Add the public key to the VM:**
   ```bash
   ssh-copy-id -i ~/.ssh/carrental-deploy.pub azureuser@<your-vm-fqdn>
   # or manually:
   cat ~/.ssh/carrental-deploy.pub | ssh azureuser@<your-vm-fqdn> 'cat >> ~/.ssh/authorized_keys'
   ```
3. **Add three secrets to this GitHub repo** (Settings → Secrets and variables → Actions):
   | Secret name | Value |
   |---|---|
   | `VM_HOST` | The DNS name, e.g. `carrental-xyz.westeurope.cloudapp.azure.com` |
   | `VM_USER` | `azureuser` |
   | `VM_SSH_KEY` | Contents of `~/.ssh/carrental-deploy` (the **private** key) |
4. Push a commit to `main` — workflow runs.

## Auto-deploy on pushes to the *service* repos

By default this workflow only fires when you push to the deploy repo. To also redeploy when `SE_CarRental`, `SE_CurrencyConverter`, or `frontend-car-rental` get a push, add the same workflow file to each of those repos with the same three secrets — they'll all hit the same VM and run the same `./deploy.sh`.

A drop-in copy:

```yaml
# .github/workflows/deploy.yml in any of the service repos
name: Trigger VM redeploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: appleboy/ssh-action@v1.2.0
        with:
          host:     ${{ secrets.VM_HOST }}
          username: ${{ secrets.VM_USER }}
          key:      ${{ secrets.VM_SSH_KEY }}
          script_stop: true
          command_timeout: 12m
          script: |
            cd ~/Car-Rental-deploy
            ./deploy.sh
```

## Manual trigger

In the GitHub UI: Actions tab → "Deploy to VM" → "Run workflow". Useful for forcing a redeploy without pushing.
