#!/usr/bin/env bash
# Prepara un VPS nuevo (Ubuntu 24.04 o Debian 12/13) para la plataforma.
# Se corre UNA vez, como root, y se puede repetir sin romper nada.
#
#   curl -fsSL https://raw.githubusercontent.com/Fraylui/plataforma-_contenidos/main/scripts/preparar-vps.sh -o preparar-vps.sh
#   sudo bash preparar-vps.sh
#
# Qué hace (infra/DESPLIEGUE.md §2):
#   1. Actualiza el sistema y deja activas las actualizaciones de seguridad automáticas.
#   2. Swap de 4 GB (colchón para picos de memoria).
#   3. Firewall: solo SSH, 80 y 443. fail2ban contra intentos de entrar por SSH.
#   4. Docker oficial + rclone (copia de backups a Cloudflare R2).
#   5. Usuario «deploy» (sin root) dueño de /opt/plataforma-contenidos.
#   6. Instala los temporizadores: backup diario, vigilancia cada 5 min,
#      limpieza semanal de Docker.
set -euo pipefail

[ "$(id -u)" -eq 0 ] || { echo "Córrelo como root: sudo bash $0" >&2; exit 1; }

APP_DIR="${APP_DIR:-/opt/plataforma-contenidos}"
REPO_URL="${REPO_URL:-https://github.com/Fraylui/plataforma-_contenidos.git}"
SWAP_SIZE="${SWAP_SIZE:-4G}"
SSH_PORT="${SSH_PORT:-22}"
export DEBIAN_FRONTEND=noninteractive

echo "==> 1. Sistema y actualizaciones de seguridad automáticas"
apt-get update -q
apt-get upgrade -yq
apt-get install -yq ca-certificates curl git ufw fail2ban unattended-upgrades rclone
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "==> 2. Swap de $SWAP_SIZE"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l "$SWAP_SIZE" /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
# Usar la swap solo como último recurso: la RAM es mucho más rápida.
echo 'vm.swappiness=10' > /etc/sysctl.d/99-plataforma.conf
sysctl -q --system

echo "==> 3. Firewall y fail2ban"
ufw allow "$SSH_PORT"/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
cat > /etc/fail2ban/jail.d/plataforma.local <<EOF
[sshd]
enabled = true
port = $SSH_PORT
maxretry = 5
bantime = 1h
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban

echo "==> 4. Docker"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
# Docker abre puertos saltándose ufw; por eso el compose publica Postgres,
# Redis, backend y frontend solo en 127.0.0.1 y únicamente nginx en 80/443.
systemctl enable --now docker

echo "==> 5. Usuario deploy y código en $APP_DIR"
id deploy >/dev/null 2>&1 || useradd --create-home --shell /bin/bash deploy
usermod -aG docker deploy
if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
fi
chown -R deploy:deploy "$APP_DIR"

echo "==> 6. Temporizadores (backup, vigilancia, limpieza)"
for unit in "$APP_DIR"/infra/systemd/*.service "$APP_DIR"/infra/systemd/*.timer; do
  ln -sf "$unit" "/etc/systemd/system/$(basename "$unit")"
done
systemctl daemon-reload
systemctl enable plataforma-backup.timer plataforma-vigilar.timer plataforma-limpieza.timer

cat <<EOF

Listo. Lo que sigue (infra/DESPLIEGUE.md §2.3 en adelante):
  1. su - deploy && cd $APP_DIR
  2. cp .env.example .env  y completar DOMAIN, SITE_URL, contraseñas, R2 y Telegram
  3. echo <token-de-github> | docker login ghcr.io -u Fraylui --password-stdin
  4. ./infra/nginx/init-letsencrypt.sh
  5. scripts/desplegar.sh
  6. sudo systemctl start plataforma-backup.timer plataforma-vigilar.timer plataforma-limpieza.timer
EOF
