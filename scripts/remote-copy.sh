#!/usr/bin/env bash
# Puente entre backup.sh y rclone (CONTEXTO.md sección 29 — copia externa
# de backups). backup.sh llama a $BACKUP_REMOTE_COPY_CMD con la ruta del
# archivo como ÚLTIMO argumento; rclone copy espera "origen destino" (el
# archivo PRIMERO) — este script hace ese acomodo, nada más.
#
# Setup (una sola vez, en el servidor):
#   1. apt install rclone
#   2. rclone config
#      - name: r2 (o lo que pongas en RCLONE_REMOTE más abajo)
#      - type: Amazon S3 Compliant Storage Provider → Cloudflare R2
#      - access_key_id / secret_access_key: del token de R2 (Manage R2 API Tokens)
#      - endpoint: https://<account_id>.r2.cloudflarestorage.com
#   3. En .env: BACKUP_REMOTE_COPY_CMD=/opt/plataforma-contenidos/scripts/remote-copy.sh
#
# Variables opcionales (definir en .env si el nombre por defecto no sirve):
#   RCLONE_REMOTE       nombre configurado en `rclone config` (default: r2)
#   RCLONE_BACKUP_PATH  bucket/carpeta destino (default: plataforma-contenidos-backups)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.env"
  set +a
fi

FILE="${1:?uso: remote-copy.sh <ruta-del-archivo>}"
RCLONE_REMOTE="${RCLONE_REMOTE:-r2}"
RCLONE_BACKUP_PATH="${RCLONE_BACKUP_PATH:-plataforma-contenidos-backups}"

rclone copy "$FILE" "${RCLONE_REMOTE}:${RCLONE_BACKUP_PATH}/"
