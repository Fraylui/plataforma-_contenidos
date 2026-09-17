#!/usr/bin/env bash
# Restaura un dump generado por backup.sh — SIEMPRE contra una base de datos
# nueva, nunca sobrescribe la real. Es a la vez la "prueba de restauración"
# que exige CONTEXTO.md sección 29: un backup que nunca se restauró no está
# probado.
#
# Uso: scripts/restore.sh <archivo.dump> [nombre_db_destino]
# Sin nombre_db_destino, crea "restore_test_<timestamp>" y al final imprime
# el comando para borrarla una vez verificados los datos.
#
# Simétrico con remote-copy.sh (la copia externa de backup.sh): si
# <archivo.dump> no existe en disco, se busca por nombre en el mismo
# remoto/bucket de R2 (RCLONE_REMOTE/RCLONE_BACKUP_PATH) y se descarga acá
# antes de restaurar — útil en un servidor nuevo, donde el .dump nunca
# estuvo en disco local, solo en R2.
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Uso: $0 <archivo.dump> [nombre_db_destino]" >&2
  exit 1
fi

DUMP_FILE="$1"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/infra/docker-compose.yml"

if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.env"
  set +a
fi

if [ ! -f "$DUMP_FILE" ]; then
  RCLONE_REMOTE="${RCLONE_REMOTE:-r2}"
  RCLONE_BACKUP_PATH="${RCLONE_BACKUP_PATH:-plataforma-contenidos-backups}"
  BACKUP_DIR="${BACKUP_DIR:-$REPO_ROOT/backups}"
  echo "==> No existe local, buscando '$(basename "$DUMP_FILE")' en ${RCLONE_REMOTE}:${RCLONE_BACKUP_PATH}/"
  mkdir -p "$BACKUP_DIR"
  rclone copy "${RCLONE_REMOTE}:${RCLONE_BACKUP_PATH}/$(basename "$DUMP_FILE")" "$BACKUP_DIR/"
  DUMP_FILE="$BACKUP_DIR/$(basename "$DUMP_FILE")"
fi
[ -f "$DUMP_FILE" ] || { echo "No existe el archivo (ni local ni en el remoto): $DUMP_FILE" >&2; exit 1; }
DUMP_FILE="$(cd "$(dirname "$DUMP_FILE")" && pwd)/$(basename "$DUMP_FILE")"

DB_USER="${DB_USER:-plataforma_contenidos}"
: "${DB_PASSWORD:?define DB_PASSWORD antes de restaurar}"
export DB_PASSWORD

TARGET_DB="${2:-restore_test_$(date -u +%Y%m%dT%H%M%SZ)}"

compose() {
  docker compose -f "$COMPOSE_FILE" "$@"
}

echo "==> Creando base de datos temporal '$TARGET_DB'"
compose exec -T -e PGPASSWORD="$DB_PASSWORD" postgres createdb --username="$DB_USER" "$TARGET_DB"

echo "==> Restaurando $(basename "$DUMP_FILE") en '$TARGET_DB'"
compose exec -T -e PGPASSWORD="$DB_PASSWORD" postgres \
  pg_restore --username="$DB_USER" --dbname="$TARGET_DB" --no-owner --no-privileges \
  < "$DUMP_FILE"

echo "==> Restauración completa en '$TARGET_DB'."
echo "    Verifica los datos y, cuando termines, bórrala con:"
echo "    docker compose -f \"$COMPOSE_FILE\" exec -e PGPASSWORD=\"\$DB_PASSWORD\" postgres dropdb --username=\"$DB_USER\" \"$TARGET_DB\""
