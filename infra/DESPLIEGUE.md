# Despliegue y escala (objetivo: 100M de vistas/mes sin gasto extra)

Guía operativa para poner el sitio en producción en el VPS más chico de Contabo
con Cloudflare gratis delante. Lo que está en el código ya viene hecho; esta
guía cubre lo que se configura **fuera** del repo (cuenta de Cloudflare, VPS).

Gasto esperado: VPS + dominio. Cloudflare Free, nginx y la caché no cuestan nada.

---

## 1. Cómo aguanta el tráfico (las capas de caché)

```text
Visitante
   │
   ▼
Cloudflare (gratis)   ← responde la gran mayoría de las visitas desde su caché
   │  solo lo que no tiene guardado
   ▼
nginx (VPS)           ← segunda caché: páginas públicas e imágenes
   │  solo lo que tampoco tiene
   ▼
Next.js               ← páginas ISR: se generan una vez y se reutilizan
   │  solo al regenerar
   ▼
Spring Boot → PostgreSQL
```

100M de vistas al mes son ~40 por segundo de promedio (picos de 200+). Ningún
VPS barato genera eso página por página; la idea es que el VPS casi no se entere.

Qué quedó preparado en el código:

| Pieza | Dónde | Qué hace |
|---|---|---|
| Páginas públicas cacheables | `app/(public)/**` | Portada y detalles son ISR (se ven como `○`/`●` en el build). Next manda `Cache-Control: s-maxage=…`, que Cloudflare y nginx respetan. |
| Invalidación al publicar | `lib/admin/action-helpers.ts` | Cualquier cambio del panel invalida la caché de Next (`revalidateTag`). |
| Anuncios directos desde el navegador | `app/api/ads/campaign` | Antes se pedían al renderizar y volvían dinámico TODO el sitio. |
| Caché + límite por IP en nginx | `infra/nginx/templates/` | `proxy_cache` para páginas e imágenes, micro-caché de 60 s para listados y búsqueda; `limit_req` 20 r/s páginas y 10 r/s API por IP. |
| IP real detrás de Cloudflare | `00-edge.conf.template` | `set_real_ip_from` con los rangos de Cloudflare; sin esto el límite por IP bloquearía nodos enteros de Cloudflare. |
| Imágenes reducidas al subir | `ImageProcessor` | Lado mayor máximo 2560px (`MEDIA_MAX_STORED_DIMENSION_PIXELS`). |
| Topes de memoria | `infra/docker-compose.yml` | Postgres 2G, backend 1.5G, frontend 1G, Redis 256M, nginx 256M. |

Listados, temas y búsqueda (`/publicaciones`, `/lugares`, `/eventos`,
`/galerias`, `/directorio`, `/categorias/*`, `/buscar`) leen parámetros de la
URL (`?page=`, `?categoryId=`, `?q=`), así que Next los genera en cada pedido.
Como son públicos e iguales para todos, nginx les aplica una **micro-caché de
60 s** y les pone `Cache-Control: public, s-maxage=60` para que Cloudflare
también los guarde: cada URL se genera como mucho una vez por minuto. Lo
publicado tarda hasta 1 minuto en aparecer en esos listados (el detalle de
cada contenido se actualiza al instante). La respuesta trae `X-Cache-Status`
(MISS/HIT/BYPASS) para comprobarlo.

---

## 2. Preparar el VPS (una sola vez)

### 2.1 Swap de 4 GB

El VPS no trae swap; sin él, un pico de memoria hace que el kernel mate procesos.

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2.2 Firewall: solo SSH, 80 y 443

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Postgres, Redis, backend y frontend ya escuchan solo en `127.0.0.1` (ver compose).

### 2.3 Levantar

```bash
cd infra   # este mismo directorio
cp ../.env.example .env   # completar DOMAIN, SITE_URL, contraseñas, etc.
./nginx/init-letsencrypt.sh
docker compose up -d --build
```

### 2.4 Copia de backups fuera del VPS

Ya existe `scripts/remote-copy.sh` (copia a Cloudflare R2 con rclone, 10 GB
gratis). Seguir los pasos de su cabecera y poner en `.env`:

```bash
BACKUP_REMOTE_COPY_CMD=/opt/plataforma-contenidos/scripts/remote-copy.sh
```

Sin esto el backup queda en el mismo disco que la base: si se pierde el VPS,
se pierde todo.

---

## 3. Cloudflare (plan Free)

1. Agregar el dominio en Cloudflare y cambiar los nameservers en Namecheap a
   los que indica Cloudflare.
2. **DNS**: registro `A` del dominio → IP del VPS, con la nube **naranja**
   (proxied). Igual para `www`.
3. **SSL/TLS → Overview**: modo **Full (strict)** (nginx ya tiene certificado
   de Let's Encrypt).
4. **Caching → Cache Rules** → crear regla "Páginas públicas":
   - Si: *Hostname* es igual a tu dominio **y** *URI Path* no empieza con
     `/admin` **y** no empieza con `/api/`.
   - Entonces: *Eligible for cache*, **Edge TTL: usar el Cache-Control del
     origen** (respeta el `s-maxage` de Next; lo `no-store` no se guarda).
5. Segunda regla "Imágenes": *URI Path* empieza con `/api/v1/images/` →
   *Eligible for cache*, Edge TTL: respetar origen (Spring manda 30 días).
6. **Caching → Tiered Cache**: activar (gratis; un nodo regional llena a los demás).
7. **Security → Bots**: activar *Bot Fight Mode* (gratis).
8. **Rules → Settings → Managed Transforms**: activar **Add visitor location
   headers** (gratis). Manda el país y la región del visitante; sin esto, las
   campañas de publicidad segmentadas por país o región nunca se muestran
   (CONTEXTO §45.4).

Por defecto Cloudflare **no** guarda HTML: sin la regla del paso 4 todas las
páginas llegarían al VPS.

---

## 4. Verificar que la caché funciona

```bash
# Debe decir "cf-cache-status: HIT" a partir de la 2ª vez
curl -sI https://TU-DOMINIO/ | grep -iE "cf-cache-status|cache-control"

# El panel NUNCA debe salir de caché
curl -sI https://TU-DOMINIO/admin/login | grep -iE "cf-cache-status|cache-control"
```

---

## 5. Comandos que NO hay que correr

Circulan consejos (incluidos de chatbots) que borran datos:

| Comando | Por qué no |
|---|---|
| `docker system prune -af --volumes` | `--volumes` borra los volúmenes sin uso **en ese momento**: si la base o las imágenes están detenidas (un reinicio, un deploy), se borran. |
| `find /var/data/images -mtime +90 -delete` | Borra **todas** las imágenes con más de 90 días, también las publicadas. |

Para limpiar imágenes de Docker viejas sin riesgo, solo imágenes:
`docker image prune -f` (no toca volúmenes ni contenedores).
