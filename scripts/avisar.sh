#!/usr/bin/env bash
# Manda un aviso al dueño por Telegram (gratis, llega al celular al instante).
# Lo usan vigilar.sh y los servicios systemd cuando algo falla.
#
# Configurar una vez (ver infra/DESPLIEGUE.md §2.6) en .env:
#   TELEGRAM_BOT_TOKEN=...   (lo da @BotFather al crear el bot)
#   TELEGRAM_CHAT_ID=...     (tu chat con el bot)
# Sin configurar, el aviso solo queda en el registro del sistema (journalctl).
#
# Uso: scripts/avisar.sh "mensaje"
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.env"
  set +a
fi

MESSAGE="[${DOMAIN:-plataforma}] ${1:?uso: avisar.sh \"mensaje\"}"
echo "AVISO: $MESSAGE" >&2

if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ]; then
  curl -sS --max-time 15 -o /dev/null \
    "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=${MESSAGE}" || echo "No se pudo enviar el aviso por Telegram" >&2
fi
