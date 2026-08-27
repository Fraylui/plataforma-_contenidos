#!/usr/bin/env bash
# Restaura un dump generado por backup.sh — SIEMPRE contra una base de datos
# nueva, nunca sobrescribe la real. Es a la vez la "prueba de restauración"
# que exige CONTEXTO.md sección 29: un backup que nunca se restauró no está
# probado.
#
# Uso: scripts/restore.sh <archivo.dump> [nombre_db_destino]
# Sin nombre_db_destino, crea "restore_test_<timestamp>" y al final imprime
# el comando para borrarla una vez verificados los datos.
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Uso: $0 <archivo.dump> [nombre_db_destino]" >&2
  exit 1
fi

DUMP_FILE="$1"
[ -f "$DUMP_FILE" ] || { echo "No existe el archivo: $DUMP_FILE" >&2; exit 1; }
DUMP_FILE="$(cd "$(dirname "$DUMP_FILE")" && pwd)/$(basename "$DUMP_FILE")"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/infra/docker-compose.yml"

if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.env"
  set +a
fi

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
