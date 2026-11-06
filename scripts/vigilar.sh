#!/usr/bin/env bash
# Revisa cada 5 minutos (infra/systemd/plataforma-vigilar.timer) que la
# plataforma responda y que al VPS no le falte disco ni memoria. Avisa solo
# cuando algo CAMBIA (se cae / se recupera), no cada 5 minutos.
#
# Si el VPS entero se apaga, este script tampoco corre: para eso está el
# monitor externo gratuito de infra/DESPLIEGUE.md §2.6.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.env"
  set +a
fi

STATE_DIR="${VIGILAR_STATE_DIR:-/var/tmp/plataforma-vigilar}"
DISK_MAX="${VIGILAR_DISK_MAX_PERCENT:-85}"
MEM_MIN_MB="${VIGILAR_MEM_MIN_MB:-300}"
mkdir -p "$STATE_DIR"

problems=()

# Sitio y API a través de nginx (lo mismo que ve un visitante, sin pasar
# por Cloudflare para no medir su caché).
check_url() {
  local name="$1" url="$2"
  local code
  code="$(curl -sk -o /dev/null -w '%{http_code}' --max-time 15 \
    --resolve "${DOMAIN:-localhost}:443:127.0.0.1" "$url" || true)"
  [ "${code:-0}" -ge 200 ] 2>/dev/null && [ "$code" -lt 400 ] || problems+=("$name no responde (HTTP $code)")
}
check_url "El sitio" "https://${DOMAIN:-localhost}/"
check_url "La API" "https://${DOMAIN:-localhost}/api/v1/series"

disk="$(df --output=pcent / | tail -1 | tr -dc '0-9')"
[ "${disk:-0}" -lt "$DISK_MAX" ] || problems+=("Disco al ${disk}% (límite ${DISK_MAX}%)")

mem="$(awk '/MemAvailable/ {print int($2/1024)}' /proc/meminfo)"
[ "${mem:-0}" -gt "$MEM_MIN_MB" ] || problems+=("Quedan solo ${mem} MB de memoria libre")

for service in postgres redis backend frontend nginx; do
  id="$(docker compose -f "$REPO_ROOT/infra/docker-compose.yml" ps -q "$service" 2>/dev/null)"
  running="$(docker inspect -f '{{.State.Running}}' "$id" 2>/dev/null || echo false)"
  [ "$running" = "true" ] || problems+=("El servicio $service está detenido")
done

current="$(printf '%s\n' "${problems[@]:-}")"
previous="$(cat "$STATE_DIR/estado" 2>/dev/null || true)"
if [ "$current" != "$previous" ]; then
  if [ -n "$current" ]; then
    "$SCRIPT_DIR/avisar.sh" "Problema: $(printf '%s; ' "${problems[@]}")"
  else
    "$SCRIPT_DIR/avisar.sh" "Todo volvió a la normalidad."
  fi
  printf '%s' "$current" > "$STATE_DIR/estado"
fi

[ -z "$current" ]
