#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# deploy.sh — Deploy CopyPasteLearn to an Oracle Cloud VM
# Run this ON the VM after cloning the repo.
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[deploy]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn]${NC}  $*"; }
err()  { echo -e "${RED}[error]${NC} $*" >&2; }

# ---------- Pre-flight checks ----------
check_deps() {
  log "Checking dependencies..."
  local missing=()
  for cmd in docker git; do
    if ! command -v "$cmd" &>/dev/null; then
      missing+=("$cmd")
    fi
  done

  if ! docker compose version &>/dev/null; then
    missing+=("docker-compose-plugin")
  fi

  if [[ ${#missing[@]} -gt 0 ]]; then
    err "Missing: ${missing[*]}"
    err "Run: sudo apt-get install -y docker.io docker-compose-plugin git"
    exit 1
  fi

  # Ensure current user can use Docker
  if ! docker info &>/dev/null; then
    err "Cannot connect to Docker. Run: sudo usermod -aG docker \$USER && newgrp docker"
    exit 1
  fi

  log "All dependencies OK ✓"
}

# ---------- Environment ----------
check_env() {
  local env_file="$ROOT_DIR/.env.production"
  if [[ ! -f "$env_file" ]]; then
    err ".env.production not found!"
    warn "Copy and fill: cp .env.production.example .env.production"
    exit 1
  fi
  log "Environment file found ✓"
}

# ---------- Build & deploy ----------
deploy() {
  cd "$ROOT_DIR"

  log "Pulling latest code..."
  git pull --ff-only origin main || warn "Git pull skipped (not a git repo or no remote)"

  log "Building containers (this may take a few minutes on first run)..."
  docker compose -f docker-compose.prod.yml build --parallel

  log "Starting services..."
  docker compose -f docker-compose.prod.yml up -d

  log "Waiting for health checks..."
  sleep 10

  # Check health
  local all_ok=true
  for svc in cpl-web cpl-labs cpl-caddy; do
    local status
    status=$(docker inspect --format='{{.State.Status}}' "$svc" 2>/dev/null || echo "missing")
    if [[ "$status" == "running" ]]; then
      log "  $svc: running ✓"
    else
      warn "  $svc: $status"
      all_ok=false
    fi
  done

  if $all_ok; then
    echo ""
    log "═══════════════════════════════════════════"
    log "  Deployment complete! 🚀"
    log "  Web:  https://$(grep -oP '(?<=NEXT_PUBLIC_APP_URL=")https?://[^"]+' .env.production || echo 'your-domain.com')"
    log "  Labs: internal on :4000"
    log "═══════════════════════════════════════════"
  else
    warn "Some services are not running. Check: docker compose -f docker-compose.prod.yml logs"
  fi
}

# ---------- Helpers ----------
status() {
  cd "$ROOT_DIR"
  docker compose -f docker-compose.prod.yml ps
}

logs() {
  cd "$ROOT_DIR"
  docker compose -f docker-compose.prod.yml logs -f --tail=50 "${1:-}"
}

stop() {
  cd "$ROOT_DIR"
  docker compose -f docker-compose.prod.yml down
  log "Services stopped."
}

restart() {
  cd "$ROOT_DIR"
  docker compose -f docker-compose.prod.yml restart
  log "Services restarted."
}

# ---------- Main ----------
case "${1:-deploy}" in
  deploy)  check_deps; check_env; deploy ;;
  status)  status ;;
  logs)    logs "${2:-}" ;;
  stop)    stop ;;
  restart) restart ;;
  *)
    echo "Usage: $0 {deploy|status|logs [service]|stop|restart}"
    exit 1
    ;;
esac
