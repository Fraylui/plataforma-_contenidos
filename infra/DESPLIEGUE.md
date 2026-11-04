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

VPS recomendado: Contabo Cloud VPS 10 (4 vCPU, 8 GB RAM, NVMe) con Ubuntu 24.04.
La plataforma encendida sin visitas ya usa unos 3 GB; con 4 GB quedaría al límite.

### 2.1 Un solo script deja el VPS listo

```bash
curl -fsSL https://raw.githubusercontent.com/Fraylui/plataforma-_contenidos/main/scripts/preparar-vps.sh -o preparar-vps.sh
sudo bash preparar-vps.sh
```

`scripts/preparar-vps.sh` hace, y se puede repetir sin romper nada:

| Qué | Para qué |
|---|---|
| Actualizaciones de seguridad automáticas | Parches del sistema sin entrar al VPS |
| Swap de 4 GB (`swappiness=10`) | Un pico de memoria no tumba la base |
| Firewall: solo SSH, 80 y 443 + fail2ban | Nadie entra a Postgres/Redis; bloquea ataques a SSH |
| Docker oficial + rclone | Contenedores y copia de backups a R2 |
| Usuario `deploy` (sin root) en `/opt/plataforma-contenidos` | La app no corre como root |
| Temporizadores | Backup diario 03:00, vigilancia cada 5 min, limpieza de Docker los domingos |

Postgres, Redis, backend y frontend escuchan solo en `127.0.0.1` (ver compose);
solo nginx da a internet.

### 2.2 Las imágenes se construyen en GitHub, no en el VPS

Compilar Java y Next.js en el VPS lo dejaba lento varios minutos en cada
actualización. Ahora `.github/workflows/imagenes.yml` las construye en cada
cambio a `main` y las publica en `ghcr.io`. El VPS solo las descarga.

Una vez:

1. En GitHub: **Settings → Secrets and variables → Actions → Variables** →
   `SITE_URL` = `https://tudominio.com`.
2. Un token para que el VPS pueda descargar las imágenes: **GitHub → Settings →
   Developer settings → Personal access tokens (classic)** con solo
   `read:packages`. En el VPS, como `deploy`:
   `echo <token> | docker login ghcr.io -u Fraylui --password-stdin`

### 2.3 Levantar y actualizar

```bash
su - deploy
cd /opt/plataforma-contenidos
cp .env.example .env            # completar DOMAIN, SITE_URL, contraseñas, R2, Telegram
./infra/nginx/init-letsencrypt.sh   # certificado HTTPS (solo la primera vez)
scripts/desplegar.sh            # descarga imágenes, levanta, espera al backend, limpia
sudo systemctl start plataforma-backup.timer plataforma-vigilar.timer plataforma-limpieza.timer
```

Para cada actualización, después de unir cambios en `main` y ver la acción
«Imágenes Docker» en verde: `scripts/desplegar.sh`.

Volver a una versión anterior: `IMAGE_TAG=<sha de 12 letras> scripts/desplegar.sh`
(el sha está en la pestaña Actions de GitHub).

### 2.4 Copia de backups fuera del VPS

El backup diario (`scripts/backup.sh`) ya verifica que el volcado se pueda
restaurar. Para que además salga del VPS, `scripts/remote-copy.sh` lo copia a
Cloudflare R2 (10 GB gratis). Una vez, como `deploy`:

```bash
rclone config      # nombre: r2 · tipo: S3 → Cloudflare R2 · claves del token de R2
                   # endpoint: https://<account_id>.r2.cloudflarestorage.com
```

y en `.env`:

```bash
BACKUP_REMOTE_COPY_CMD=/opt/plataforma-contenidos/scripts/remote-copy.sh
RCLONE_BACKUP_PATH=plataforma-contenidos-backups   # bucket privado, distinto al de fotos
```

Sin esto el backup queda en el mismo disco que la base: si se pierde el VPS,
se pierde todo. Si un backup falla, llega aviso (§2.6).

### 2.5 Fotos en Cloudflare R2 (para que el VPS no se llene)

Por defecto las fotos se guardan en el disco del VPS. Con R2 se guardan en
Cloudflare (gratis hasta 10 GB y sin costo por las visitas que las
descargan) y, con un dominio público, **Cloudflare las entrega directo**:
el VPS solo responde una redirección mínima que Cloudflare también cachea.

1. **Crear el bucket.** Panel de Cloudflare → *R2 Object Storage* →
   *Create bucket*. Nombre, por ejemplo, `plataforma-imagenes`.
2. **Darle un dominio público.** En el bucket → *Settings* → *Public access*
   → *Custom Domains* → *Connect domain*: `media.tu-dominio.pe`. Cloudflare
   crea el DNS solo. (Evitar la dirección `r2.dev`: tiene límite de
   velocidad y Cloudflare la recomienda solo para pruebas.)
3. **Crear una llave con el mínimo permiso.** *R2* → *Manage R2 API Tokens*
   → *Create API token* → permiso **Object Read & Write**, solo para ese
   bucket. Anotar *Access Key ID* y *Secret Access Key* (el secreto se
   muestra una sola vez). El *Account ID* está en la página de R2.
4. **Configurar el `.env` del VPS** (nunca en el repositorio):
   ```bash
   MEDIA_STORAGE=r2
   R2_ACCOUNT_ID=…
   R2_ACCESS_KEY_ID=…
   R2_SECRET_ACCESS_KEY=…
   R2_BUCKET=plataforma-imagenes
   R2_PUBLIC_BASE_URL=https://media.tu-dominio.pe
   ```
5. **Si ya hay fotos en el VPS, copiarlas antes de reiniciar** (las nuevas
   irán a R2; las viejas solo existen en el disco):
   ```bash
   docker compose cp backend:/app/data/media ./media-a-subir
   rclone copy ./media-a-subir r2:plataforma-imagenes --progress \
     --header-upload "Cache-Control: public, max-age=31536000, immutable"
   ```
   (`rclone` ya se usa para los backups, sección 2.4; el remoto `r2` es el
   mismo.)
6. **Reiniciar el backend:** `docker compose up -d backend`. Si falta un
   dato, no arranca y el log dice cuál (`Falta app.media.r2.bucket`).
7. **Verificar:** subir una foto en el panel y abrirla: la dirección final
   debe ser `https://media.tu-dominio.pe/…`.

Volver al disco local es poner `MEDIA_STORAGE=local` (las fotos subidas a R2
mientras tanto quedan allá: copiarlas de vuelta con `rclone copy` al revés).

---

### 2.6 Avisos si algo falla

Dos capas, ambas gratis:

1. **Dentro del VPS** (`scripts/vigilar.sh`, cada 5 min): sitio y API
   responden, disco bajo 85 %, memoria libre, los 5 contenedores encendidos.
   Avisa por Telegram solo cuando algo cambia (se cae / se recupera). También
   avisa si falla el backup o la limpieza.
   - En Telegram, habla con **@BotFather** → `/newbot` → copia el token.
   - Escríbele algo a tu bot y abre
     `https://api.telegram.org/bot<token>/getUpdates`: el número en
     `"chat":{"id":...}` es tu chat.
   - En `.env`: `TELEGRAM_BOT_TOKEN=...` y `TELEGRAM_CHAT_ID=...`.
   - Probar: `scripts/avisar.sh "prueba"`.
2. **Fuera del VPS** (si el VPS entero se apaga, el paso 1 no corre): un
   monitor gratuito como UptimeRobot o Better Stack revisando
   `https://tudominio.com/` cada 5 min, con aviso al correo o Telegram.

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
`docker image prune -f` (no toca volúmenes ni contenedores). Ya lo hacen solos
`scripts/desplegar.sh` y el temporizador `plataforma-limpieza` (domingos).
