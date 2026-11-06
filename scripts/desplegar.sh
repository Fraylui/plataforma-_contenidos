#!/usr/bin/env bash
# Actualiza la plataforma en el VPS sin compilar nada aquí: baja el código
# (solo para compose, nginx y scripts), descarga las imágenes que construyó
# GitHub (.github/workflows/imagenes.yml), recrea solo lo que cambió y borra
# las imágenes viejas para que el disco no se llene.
#
# Uso: scripts/desplegar.sh            (última versión)
#      IMAGE_TAG=<sha> scripts/desplegar.sh   (volver a una versión anterior;
#      el sha de 12 letras está en la pestaña Actions de GitHub)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"
[ -f "$ENV_FILE" ] || { echo "ERROR: falta $ENV_FILE (copia .env.example y complétalo)" >&2; exit 1; }

compose() {
  docker compose -f "$REPO_ROOT/infra/docker-compose.yml" --env-file "$ENV_FILE" "$@"
}

echo "==> Código"
git -C "$REPO_ROOT" pull --ff-only

echo "==> Imágenes${IMAGE_TAG:+ (versión $IMAGE_TAG)}"
compose pull backend frontend

echo "==> Levantando"
compose up -d --no-build --remove-orphans

echo "==> Esperando al backend"
for _ in $(seq 1 60); do
  status="$(docker inspect -f '{{.State.Health.Status}}' "$(compose ps -q backend)" 2>/dev/null || true)"
  [ "$status" = "healthy" ] && break
  sleep 3
done
if [ "${status:-}" != "healthy" ]; then
  echo "ERROR: el backend no quedó sano. Últimas líneas:" >&2
  compose logs --tail 60 backend >&2
  exit 1
fi

echo "==> Limpiando imágenes viejas"
docker image prune -af --filter "until=168h" >/dev/null

compose ps
echo "==> Listo"
