#!/usr/bin/env bash
# One-time Azure VM provisioning for the Car-Rental stack.
#
# Prerequisites:
#   - Azure CLI installed and logged in:  `az login`
#   - SSH public key at ~/.ssh/id_ed25519.pub  (or change SSH_KEY below)
#
# What this script does:
#   1. Creates resource group `rg-carrental` in westeurope
#   2. Creates a Standard_B2s Ubuntu 24.04 VM with cloud-init bootstrapping
#   3. Opens ports 22, 80, 443 in the network security group
#   4. Promotes the public IP to Static + assigns a DNS name
#   5. Prints the resulting hostname so you can ssh in
#
# Re-runs are safe: each `az` command checks for existing resources and skips
# creation if already present. Anything you customize via env vars below.

set -euo pipefail

# ----- Customize these -----
RG="${RG:-rg-carrental}"
LOCATION="${LOCATION:-westeurope}"
VM_NAME="${VM_NAME:-vm-carrental}"
VM_SIZE="${VM_SIZE:-Standard_B2s}"
ADMIN_USER="${ADMIN_USER:-azureuser}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519.pub}"
DNS_LABEL="${DNS_LABEL:-carrental-$(whoami | tr -cd 'a-z0-9')-$RANDOM}"
DISK_GB="${DISK_GB:-30}"
# ---------------------------

CLOUD_INIT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/cloud-init.yml"

if [[ ! -f "$SSH_KEY" ]]; then
  echo "ERROR: SSH public key not found at $SSH_KEY" >&2
  echo "       Generate one with:  ssh-keygen -t ed25519" >&2
  exit 1
fi
if [[ ! -f "$CLOUD_INIT" ]]; then
  echo "ERROR: cloud-init.yml not found at $CLOUD_INIT" >&2
  exit 1
fi
if ! az account show >/dev/null 2>&1; then
  echo "ERROR: not logged into Azure CLI. Run:  az login" >&2
  exit 1
fi

echo "→ Resource group: $RG ($LOCATION)"
az group create -n "$RG" -l "$LOCATION" -o none

echo "→ VM: $VM_NAME ($VM_SIZE)"
if az vm show -g "$RG" -n "$VM_NAME" >/dev/null 2>&1; then
  echo "  exists, skipping create"
else
  az vm create \
    -g "$RG" -n "$VM_NAME" \
    --image Ubuntu2404 --size "$VM_SIZE" \
    --admin-username "$ADMIN_USER" \
    --ssh-key-values "$SSH_KEY" \
    --public-ip-sku Standard \
    --custom-data "$CLOUD_INIT" \
    --os-disk-size-gb "$DISK_GB" \
    -o none
fi

echo "→ Open ports 22, 80, 443"
az vm open-port -g "$RG" -n "$VM_NAME" --port 22  --priority 1001 -o none 2>/dev/null || true
az vm open-port -g "$RG" -n "$VM_NAME" --port 80  --priority 1002 -o none 2>/dev/null || true
az vm open-port -g "$RG" -n "$VM_NAME" --port 443 --priority 1003 -o none 2>/dev/null || true

PIP_NAME=$(az vm show -g "$RG" -n "$VM_NAME" \
  --query "networkProfile.networkInterfaces[0].id" -o tsv \
  | xargs -I {} az network nic show --ids {} \
    --query "ipConfigurations[0].publicIPAddress.id" -o tsv \
  | awk -F/ '{print $NF}')

echo "→ Static IP + DNS name on $PIP_NAME"
az network public-ip update \
  -g "$RG" -n "$PIP_NAME" \
  --allocation-method Static \
  --dns-name "$DNS_LABEL" \
  -o none

FQDN=$(az network public-ip show -g "$RG" -n "$PIP_NAME" \
  --query "dnsSettings.fqdn" -o tsv)
PUBLIC_IP=$(az network public-ip show -g "$RG" -n "$PIP_NAME" \
  --query "ipAddress" -o tsv)

cat <<EOF

============================================================
✅ VM is up.

   FQDN:       $FQDN
   IP:         $PUBLIC_IP
   ssh:        ssh ${ADMIN_USER}@${FQDN}

Next steps (on the VM):
   git clone https://github.com/<you>/Car-Rental.git
   cd Car-Rental
   cp .env.example .env
   nano .env                    # set PUBLIC_HOSTNAME=$FQDN and real secrets
   chmod 600 .env

   ./deploy.sh

Cost control (from your laptop):
   az vm deallocate -g $RG -n $VM_NAME    # stop billing for compute
   az vm start      -g $RG -n $VM_NAME    # bring back online
============================================================
EOF
