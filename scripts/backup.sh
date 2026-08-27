#!/usr/bin/env bash
# Backup de PostgreSQL + almacenamiento local de medios (CONTEXTO.md
# sección 29). Corre contra el Postgres de infra/docker-compose.yml — no
# requiere pg_dump instalado en el host, usa el cliente que ya trae la
# imagen del contenedor (docker compose exec).
#
# Uso: scripts/backup.sh
# Variables (ver .env.example, mismas que usa docker-compose/backend):
#   DB_NAME, DB_USER, DB_PASSWORD, MEDIA_STORAGE_PATH
# Opcionales:
#   BACKUP_DIR              (default: ./backups)
#   BACKUP_RETENTION_DAYS   (default: 14)
#   BACKUP_REMOTE_COPY_CMD  comando que recibe la ruta del archivo como único
#                           argumento, para la copia externa que exige la
#                           sección 29 (ej. "rclone copy --config ... /ruta -
#                           remoto:bucket/"). Sin definir, el backup se queda
#                           solo en disco local — no se inventa un proveedor.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/infra/docker-compose.yml"

if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.env"
  set +a
fi

DB_NAME="${DB_NAME:-plataforma_contenidos}"
DB_USER="${DB_USER:-plataforma_contenidos}"
: "${DB_PASSWORD:?define DB_PASSWORD (en .env o el entorno) antes de hacer backup}"
export DB_PASSWORD

MEDIA_STORAGE_PATH="${MEDIA_STORAGE_PATH:-$REPO_ROOT/backend/data/media}"
BACKUP_DIR="${BACKUP_DIR:-$REPO_ROOT/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

compose() {
  docker compose -f "$COMPOSE_FILE" "$@"
}

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP_DIR"

DB_DUMP_FILE="$BACKUP_DIR/db_${DB_NAME}_${TIMESTAMP}.dump"
echo "==> Volcando base de datos '$DB_NAME' a $DB_DUMP_FILE"
compose exec -T -e PGPASSWORD="$DB_PASSWORD" postgres \
  pg_dump --username="$DB_USER" --format=custom --compress=9 "$DB_NAME" > "$DB_DUMP_FILE"

MEDIA_ARCHIVE=""
if [ -d "$MEDIA_STORAGE_PATH" ] && [ -n "$(ls -A "$MEDIA_STORAGE_PATH" 2>/dev/null)" ]; then
  MEDIA_ARCHIVE="$BACKUP_DIR/media_${TIMESTAMP}.tar.gz"
  echo "==> Empaquetando medios locales ($MEDIA_STORAGE_PATH) a $MEDIA_ARCHIVE"
  tar -czf "$MEDIA_ARCHIVE" -C "$(dirname "$MEDIA_STORAGE_PATH")" "$(basename "$MEDIA_STORAGE_PATH")"
else
  echo "==> Sin archivos de medios locales que respaldar (o el módulo Media ya migró a Object Storage — sección 10)"
fi

if [ -n "${BACKUP_REMOTE_COPY_CMD:-}" ]; then
  echo "==> Copia externa: $BACKUP_REMOTE_COPY_CMD"
  eval "$BACKUP_REMOTE_COPY_CMD \"$DB_DUMP_FILE\""
  [ -n "$MEDIA_ARCHIVE" ] && eval "$BACKUP_REMOTE_COPY_CMD \"$MEDIA_ARCHIVE\""
else
  echo "==> BACKUP_REMOTE_COPY_CMD no está definido: el backup queda solo en disco local ($BACKUP_DIR)."
  echo "    La sección 29 exige copia externa antes de confiar en esto para producción."
fi

echo "==> Retención: borrando backups de más de ${BACKUP_RETENTION_DAYS} días en $BACKUP_DIR"
find "$BACKUP_DIR" -maxdepth 1 -type f \( -name 'db_*.dump' -o -name 'media_*.tar.gz' \) \
  -mtime "+${BACKUP_RETENTION_DAYS}" -print -delete

echo "==> Backup completo: $DB_DUMP_FILE"
