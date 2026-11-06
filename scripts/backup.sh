#!/usr/bin/env bash
# Backup de PostgreSQL + fotos subidas (CONTEXTO.md sección 29). Corre
# contra el stack de infra/docker-compose.yml — no requiere pg_dump ni nada
# instalado en el host, usa los clientes que ya traen los contenedores
# (docker compose exec).
#
# Uso: scripts/backup.sh
# Variables (ver .env.example, mismas que usa docker-compose/backend):
#   DB_NAME, DB_USER, DB_PASSWORD
# Opcionales:
#   BACKUP_DIR              (default: ./backups)
#   BACKUP_RETENTION_DAYS   (default: 14)
#   BACKUP_KEEP_MIN         (default: 7) los N más recientes de cada tipo no
#                           se borran nunca por antigüedad: si los backups se
#                           detienen un tiempo, la retención no deja el disco
#                           sin ninguno.
#   MEDIA_CONTAINER_PATH    (default: /app/data/media) dónde ve el backend las
#                           fotos subidas (el volumen media_data). Se empaqueta
#                           desde el contenedor, no desde el host:
#                           MEDIA_STORAGE_PATH es la ruta interna del backend y
#                           en el host no apunta al volumen.
#   BACKUP_REMOTE_COPY_CMD  comando que recibe la ruta del archivo como único
#                           argumento, para la copia externa que exige la
#                           sección 29 (ej. scripts/remote-copy.sh → R2). Sin
#                           definir, el backup se queda solo en disco local —
#                           no se inventa un proveedor.
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

MEDIA_CONTAINER_PATH="${MEDIA_CONTAINER_PATH:-/app/data/media}"
BACKUP_DIR="${BACKUP_DIR:-$REPO_ROOT/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
BACKUP_KEEP_MIN="${BACKUP_KEEP_MIN:-7}"

compose() {
  docker compose -f "$COMPOSE_FILE" "$@"
}

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP_DIR"

DB_DUMP_FILE="$BACKUP_DIR/db_${DB_NAME}_${TIMESTAMP}.dump"
echo "==> Volcando base de datos '$DB_NAME' a $DB_DUMP_FILE"
if ! compose exec -T -e PGPASSWORD="$DB_PASSWORD" postgres \
  pg_dump --username="$DB_USER" --format=custom --compress=9 "$DB_NAME" > "$DB_DUMP_FILE"; then
  rm -f "$DB_DUMP_FILE"
  echo "ERROR: falló pg_dump" >&2
  exit 1
fi

# Un volcado que pg_restore no puede leer no es un backup: se comprueba acá,
# no el día que haga falta restaurarlo.
echo "==> Verificando el volcado"
TABLES="$(compose exec -T postgres pg_restore --list < "$DB_DUMP_FILE" | grep -c ' TABLE DATA ' || true)"
if [ "${TABLES:-0}" -eq 0 ]; then
  echo "ERROR: el volcado $DB_DUMP_FILE no tiene datos de tablas legibles" >&2
  exit 1
fi
echo "    $TABLES tablas con datos"

MEDIA_ARCHIVE=""
MEDIA_COUNT="$(compose exec -T backend sh -c "find '$MEDIA_CONTAINER_PATH' -type f 2>/dev/null | wc -l" | tr -d '[:space:]')"
if [ "${MEDIA_COUNT:-0}" -gt 0 ]; then
  MEDIA_ARCHIVE="$BACKUP_DIR/media_${TIMESTAMP}.tar.gz"
  echo "==> Empaquetando $MEDIA_COUNT fotos ($MEDIA_CONTAINER_PATH en el backend) a $MEDIA_ARCHIVE"
  # Si tar falla, no dejar un .tar.gz vacío que parezca un backup.
  if ! compose exec -T backend tar -czf - -C "$(dirname "$MEDIA_CONTAINER_PATH")" "$(basename "$MEDIA_CONTAINER_PATH")" > "$MEDIA_ARCHIVE"; then
    rm -f "$MEDIA_ARCHIVE"
    echo "ERROR: no se pudo empaquetar $MEDIA_CONTAINER_PATH" >&2
    exit 1
  fi
  # Por stdin: el tar de Git Bash toma "C:..." como host remoto.
  ARCHIVED="$(tar -tzf - < "$MEDIA_ARCHIVE" | grep -vc '/$' || true)"
  if [ "${ARCHIVED:-0}" -ne "$MEDIA_COUNT" ]; then
    rm -f "$MEDIA_ARCHIVE"
    echo "ERROR: el paquete de medios tiene ${ARCHIVED:-0} archivos y el volumen $MEDIA_COUNT" >&2
    exit 1
  fi
else
  echo "==> Sin fotos que respaldar en $MEDIA_CONTAINER_PATH"
fi

if [ -n "${BACKUP_REMOTE_COPY_CMD:-}" ]; then
  echo "==> Copia externa: $BACKUP_REMOTE_COPY_CMD"
  eval "$BACKUP_REMOTE_COPY_CMD \"$DB_DUMP_FILE\""
  [ -n "$MEDIA_ARCHIVE" ] && eval "$BACKUP_REMOTE_COPY_CMD \"$MEDIA_ARCHIVE\""
else
  echo "==> BACKUP_REMOTE_COPY_CMD no está definido: el backup queda solo en disco local ($BACKUP_DIR)."
  echo "    La sección 29 exige copia externa antes de confiar en esto para producción."
fi

echo "==> Retención: más de ${BACKUP_RETENTION_DAYS} días, conservando siempre los ${BACKUP_KEEP_MIN} más recientes de cada tipo"
for pattern in 'db_*.dump' 'media_*.tar.gz'; do
  # La fecha UTC del nombre se ordena como texto: orden inverso = del más nuevo al más viejo.
  find "$BACKUP_DIR" -maxdepth 1 -type f -name "$pattern" -printf '%f\n' | sort -r | tail -n "+$((BACKUP_KEEP_MIN + 1))" |
    while read -r old; do
      find "$BACKUP_DIR" -maxdepth 1 -type f -name "$old" -mtime "+${BACKUP_RETENTION_DAYS}" -print -delete
    done
done

echo "==> Backup completo: $DB_DUMP_FILE${MEDIA_ARCHIVE:+ + $MEDIA_ARCHIVE}"
