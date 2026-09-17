#!/usr/bin/env bash
# Bootstrap del certificado HTTPS real (Let's Encrypt) — se corre UNA sola
# vez, a mano, en el servidor, después de apuntar el DNS del dominio al
# Contabo (y de configurar Cloudflare en modo DNS-only/gris para este paso;
# ver el comentario más abajo sobre por qué).
#
# El problema que resuelve: la plantilla de nginx (default.conf.template)
# siempre referencia el certificado real en /etc/letsencrypt/live/$DOMAIN —
# nginx no arranca si ese archivo no existe. Pero para pedirle el
# certificado real a Let's Encrypt hace falta que nginx YA esté sirviendo
# HTTP en el puerto 80 (desafío ACME webroot). Se resuelve con un
# certificado autofirmado "de mentira" solo para que nginx pueda arrancar
# la primera vez; se borra apenas se obtiene el real.
#
# Uso: infra/init-letsencrypt.sh   (desde la raíz del repo, en el servidor)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"

if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.env"
  set +a
fi

: "${DOMAIN:?define DOMAIN en .env (ej. midominio.com, sin https:// ni www.)}"
: "${CERTBOT_EMAIL:?define CERTBOT_EMAIL en .env — Lets Encrypt lo usa para avisos de expiracion}"

compose() {
  docker compose -f "$COMPOSE_FILE" "$@"
}

echo "==> Dominio: $DOMAIN"
echo "==> Este paso necesita que el DNS de $DOMAIN ya apunte a este servidor."
echo "    Si usás el proxy naranja de Cloudflare, ponelo en modo DNS-only (nube gris)"
echo "    SOLO para este paso — el desafío HTTP-01 de Let's Encrypt necesita hablar"
echo "    directo con este servidor, no a través del proxy de Cloudflare. Podés"
echo "    volver a activar el proxy naranja apenas termine este script."
read -r -p "¿DNS ya apunta acá y Cloudflare en modo DNS-only? [s/N] " confirm
[ "$confirm" = "s" ] || [ "$confirm" = "S" ] || { echo "Cancelado."; exit 1; }

echo "==> Generando certificado autofirmado temporal (para que nginx pueda arrancar)"
mkdir -p "$SCRIPT_DIR/certbot/conf/live/$DOMAIN"
docker run --rm \
  -v "$SCRIPT_DIR/certbot/conf:/etc/letsencrypt" \
  --entrypoint openssl certbot/certbot req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout "/etc/letsencrypt/live/$DOMAIN/privkey.pem" \
  -out "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" \
  -subj "/CN=$DOMAIN"

echo "==> Levantando nginx con el certificado temporal"
compose up -d nginx

echo "==> Borrando el certificado temporal y pidiendo el real a Let's Encrypt"
rm -rf "$SCRIPT_DIR/certbot/conf/live/$DOMAIN" \
       "$SCRIPT_DIR/certbot/conf/archive/$DOMAIN" \
       "$SCRIPT_DIR/certbot/conf/renewal/$DOMAIN.conf"

compose run --rm certbot certonly --webroot -w /var/www/certbot \
  -d "$DOMAIN" -d "www.$DOMAIN" \
  --email "$CERTBOT_EMAIL" --agree-tos --no-eff-email

echo "==> Recargando nginx con el certificado real"
compose exec nginx nginx -s reload

echo "==> Listo. HTTPS activo para https://$DOMAIN"
echo "    Si desactivaste el proxy naranja de Cloudflare para este paso, volvé a activarlo ahora."
