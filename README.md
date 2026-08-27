# Plataforma de Contenidos

Sistema de gestión y distribución de contenidos digitales. Monolito modular:
`frontend` (Next.js) + `backend` (Spring Boot) + PostgreSQL + Redis.

**Antes de tocar código, lee [`CONTEXTO.md`](./CONTEXTO.md)** — es la fuente
de verdad del proyecto (producto, arquitectura, seguridad, modelo de
negocio, estándar de frontend). Se actualiza cuando cambia una decisión
importante.

## Estructura

```text
frontend/   Next.js (TypeScript, App Router, Tailwind) — Dockerfile propio
backend/    Spring Boot (Java 21, Maven) — Dockerfile propio
infra/      docker-compose (Postgres + Redis + backend + frontend)
docs/       documentación adicional
```

## Requisitos

- Node.js 20.9+ y npm
- Java 21+ y Maven (o usar `./mvnw` incluido en `backend/`)
- Docker (para PostgreSQL/Redis locales)

## Puesta en marcha (desarrollo local)

```bash
# 1. Variables de entorno
cp .env.example .env
# editar .env con contraseñas propias (nunca commitear este archivo)

# 2. Infraestructura local (PostgreSQL + Redis)
cd infra && docker compose --env-file ../.env up -d

# 3. Backend
cd ../backend
./mvnw spring-boot:run
# health check: http://localhost:8080/actuator/health

# 4. (Opcional) Datos de ejemplo para probar el sitio con contenido real
python3 scripts/seed_dev_data.py
# crea un EDITOR, categorías, geografía y 3 artículos publicados de muestra

# 5. Frontend
cd frontend
cp .env.example .env.local   # BACKEND_API_URL=http://localhost:8080 por defecto
npm install
npm run dev
# http://localhost:3000
```

## Stack completo en contenedores (backend + frontend)

Para desarrollo del día a día seguí usando `./mvnw spring-boot:run` / `npm run
dev` (hot reload, más rápido). Esto es para correr/probar el stack completo
"como en producción", o como base de un despliegue real.

`next build` hace fetch real al backend en build time (páginas públicas con
Server Components, sección 43) — por eso el build del frontend necesita el
backend **ya arriba y saludable**, y por eso no alcanza un solo
`docker compose up -d --build`:

```bash
cd infra

# 1. Infra + backend primero, y esperar a que el backend esté "healthy"
#    (docker ps, o docker inspect --format='{{.State.Health.Status}}' plataforma-contenidos-backend-1)
docker compose --env-file ../.env up -d --build postgres redis backend

# 2. Recién ahí, el frontend (su build necesita el backend healthy del paso 1)
docker compose --env-file ../.env build frontend
docker compose --env-file ../.env up -d frontend
```

http://localhost:8080/actuator/health (backend) y http://localhost:3000
(frontend). Para reconstruir tras un cambio de código, repetir el paso
correspondiente (`build` + `up -d`) del servicio que cambió.

## Tests

```bash
# Backend — usa Testcontainers, requiere Docker corriendo
cd backend && ./mvnw test

# Frontend
cd frontend && npx eslint . && npm run build
```

## Backups (CONTEXTO.md sección 29)

```bash
# Volcado de PostgreSQL (formato custom, comprimido) + tar de medios locales
# (si existen). Lee las mismas variables que docker-compose/backend desde
# .env. Requiere bash (Git Bash en Windows) y el stack de infra/ corriendo.
scripts/backup.sh

# Restaura un dump en una base de datos NUEVA (nunca sobrescribe la real) —
# es también la prueba de restauración que exige la sección 29.
scripts/restore.sh backups/db_plataforma_contenidos_<fecha>.dump
```

Variables opcionales: `BACKUP_DIR` (default `./backups`),
`BACKUP_RETENTION_DAYS` (default 14), `BACKUP_REMOTE_COPY_CMD` (comando para
la copia externa que exige la sección 29 — ej. `rclone copy`; sin definir,
el backup queda solo en disco local, no se inventa un proveedor). Falta
automatizar la ejecución periódica (cron en el host de producción) y
definir el destino real de la copia externa — ambos dependen de la
infraestructura de despliegue, que todavía no existe (sección 25).

## Estado actual

- **Bootstrap** (2026-08-25): estructura de repo, esqueleto de backend
  (Spring Boot 4 + PostgreSQL + Redis + Flyway + Actuator) y esqueleto de
  frontend (Next.js 16 + Tailwind, sin sistema de diseño todavía).
- **Identity/Auth** (2026-08-25): login/refresh/logout con JWT (access
  corto + refresh opaco rotativo en Redis), RBAC por rol (`SUPER_ADMIN`,
  `ADMIN`, `EDITOR`, `AUTHOR`, `MODERATOR`, `COLLABORATOR`, `USER`),
  gestión de usuarios por admin (`/api/v1/admin/users`), rate limiting de
  login, audit log real, bootstrap del primer `SUPER_ADMIN` vía variables
  de entorno.
- **MFA para SUPER_ADMIN** (2026-08-25): TOTP (RFC 6238, implementación
  propia sin dependencias externas) + códigos de respaldo de un solo uso.
  Secreto cifrado en reposo (AES-256-GCM). Enforcement: login de
  `SUPER_ADMIN` exige código MFA una vez habilitado; el primer login tras
  el bootstrap lo deja pasar pero marca `mfaSetupRequired: true` y lo
  audita (`SUPER_ADMIN_LOGIN_WITHOUT_MFA`) — necesario para poder
  bootstrapear sin quedar bloqueado. **Pendiente explícito:** el
  `mfaSetupRequired` es una señal, no un bloqueo duro — todavía no hay
  límite de "N logins sin MFA y luego se bloquea". Auto-registro público y
  CORS siguen pendientes (mismos motivos que antes).
- **Taxonomy (Categorías/Etiquetas)** (2026-08-25): categorías jerárquicas
  (`/api/v1/categories` lectura pública, `/api/v1/admin/categories`
  escritura `EDITOR+`), validación de ciclos en la jerarquía, slug único
  autogenerado. Etiquetas se crean al vuelo al redactar un artículo.
- **Content (Artículos)** (2026-08-25): los 11 tipos de texto de la sección
  3, con el flujo editorial completo de la sección 12
  (`DRAFT → IN_REVIEW → APPROVED → PUBLISHED/SCHEDULED → ARCHIVED`, rama
  `REJECTED`). Autorización a nivel de objeto (un `AUTHOR` solo edita SU
  artículo en `DRAFT`/`REJECTED`; `EDITOR+` aprueba/publica/archiva).
  Publicación programada vía `@Scheduled` (revisa cada 60s). Campos SEO
  (sección 15) en el modelo. Endpoints públicos (`/api/v1/articles`) solo
  exponen `PUBLISHED`, con una respuesta liviana en el listado (sin body
  completo) por rendimiento. Sin joins/FK entre esquemas `content` ↔
  `identity`/`taxonomy` (sección 38) — referencias por UUID validadas en
  el servicio.
- **Geography** (2026-08-25): jerarquía fija de la sección 5
  (`PAIS → REGION → PROVINCIA → DISTRITO → LOCALIDAD`), validación
  estricta de que el padre sea exactamente el nivel inmediato superior
  (no jerarquía libre como en Categorías). Lectura pública
  (`/api/v1/geography?level=&parentId=`), escritura `EDITOR+`. Sin datos
  semilla (Perú/Ayacucho) — se cargan por API, no se inventan. Desactivar
  una unidad no desactiva en cascada a sus hijos (mismo comportamiento que
  Category).
- **Content ↔ Geography** (2026-08-25): `Article.geographyId` opcional
  (no todo contenido tiene ubicación — ej. Tecnología/IA), validado contra
  `geography.units` activas al crear/editar. Filtro combinable en el
  listado público: `/api/v1/articles?categoryId=&geographyId=`
  (ej. Turismo + Ayacucho, sección 4). Sin FK entre esquemas (igual que
  category_id, sección 38).
- **Media (Imágenes)** (2026-08-25): almacenamiento local detrás de
  `StorageService` (interfaz — migrar a Object Storage/CDN después no
  toca lógica de negocio, sección 10). Cada imagen se **reencodea** con
  `ImageIO` al subirla: neutraliza archivos polyglot y elimina EXIF/GPS
  de fotos de colaboradores. Solo JPEG/PNG en el MVP (GIF perdería
  animación al reencodear, WebP no tiene decoder nativo en el JDK).
  Límite de tamaño y dimensiones, nombre de archivo generado (UUID, nunca
  el original), rate limiting de subidas por usuario. `AUTHOR+` sube,
  dueño o `EDITOR+` edita `altText`/borra. Archivo servido públicamente
  sin auth (`GET /api/v1/images/{id}/file`) con cache de 30 días.
  **Pendiente/fuera de esta tarea:** `Article` todavía no tiene un campo
  tipo `featuredImageId` — conectar Content con Media queda como paso
  aparte, igual que se hizo con Geography.
- **Content ↔ YouTube** (2026-08-25): `Article.youtubeVideoId` opcional
  (sección 8). El redactor pega la URL completa; `YouTubeUrlParser` extrae
  el ID de los 4 formatos reales (`watch?v=`, `youtu.be/`, `/embed/`,
  `/shorts/`) y **solo se persiste el ID**, nunca la URL cruda ni el
  video. URL no reconocida → 400. Ningún archivo de video se sube ni se
  aloja — el frontend embebe el reproductor de YouTube con ese ID.
- **Endpoints públicos por id** (2026-08-26): `GET /api/v1/categories/{id}`
  y `GET /api/v1/geography/{id}` — no existían; hacían falta para que el
  frontend pudiera mostrar el nombre de la categoría/ubicación de un
  artículo sin exponer las rutas de administración.
- **Sitio público (frontend)** (2026-08-26): Home (grid de artículos
  publicados) + página de detalle por slug, construidos con Server
  Components (el fetch corre en el servidor de Next.js, sin problema de
  CORS porque nunca sale del navegador — eso solo hará falta cuando exista
  panel admin con mutaciones desde el cliente). Metadata SEO real por
  artículo (`generateMetadata`, campos de la sección 15). Estados: loading
  (skeleton), 404 propio, error con reintento. Video de YouTube con patrón
  "lite embed" (miniatura real, el iframe de YouTube solo se carga al
  hacer click — rendimiento). Diseño: tipografía Newsreader (serif,
  encabezados) + Inter (sans, cuerpo/UI), paleta neutra con acento cálido
  terracota, ambas adaptables a la marca definitiva (sección 14, nada
  hardcodeado salvo `platformPlaceholder`). Revisado visualmente en
  Chrome: home, detalle con/sin ubicación, detalle con video (interacción
  de click verificada), 404. **No pude verificar el layout responsive de
  forma visual** — la herramienta de navegador no reflejó el resize de
  ventana en las capturas; las clases de Tailwind usadas son patrones
  estándar (`sm:`/`lg:` grid, `max-w`, `flex-wrap`) de bajo riesgo, pero
  quien lo use en un dispositivo real debería confirmarlo.
- **Datos de desarrollo** (`scripts/seed_dev_data.py`): script de un solo
  uso para poblar un `EDITOR`, categorías, geografía y 3 artículos
  publicados **claramente marcados como "[Contenido de ejemplo]"** — nunca
  se hacen pasar por periodismo real (sección 44.10, credibilidad).
- **SEO técnico** (2026-08-26): sitemap.xml y robots.txt dinámicos, canonical
  por artículo, JSON-LD (`Article`, `BreadcrumbList`).
- **Panel administrativo** (2026-08-26): login con MFA, gestión de
  artículos (flujo editorial completo), categorías, etiquetas, geografía,
  medios y usuarios desde el navegador — `frontend/src/app/admin/(protected)`.
  Server Actions, sin mutaciones directas desde el cliente (sigue sin hacer
  falta CORS).
- **Configuration (identidad de plataforma)** (2026-08-26): fila única
  `platform_settings` (sección 14) editable desde `/admin/configuracion`
  (`SUPER_ADMIN`/`ADMIN`), auditada. El sitio público y el layout ya no
  usan un placeholder hardcodeado — leen la marca del backend.
- **Búsqueda** (2026-08-26): full-text search de PostgreSQL sobre artículos
  publicados (columna `tsvector` generada + índice GIN, ranking con
  `ts_rank`), `GET /api/v1/search` + página `/buscar` (sección 16). Vive en
  el módulo Content hasta que exista más de un tipo de contenido buscable.
- **Estadísticas básicas** (2026-08-26): `/admin/estadisticas` — artículos
  por estado, publicados últimos 30 días, alcance (categorías/etiquetas/
  geografía), usuarios por rol. Diseño propio (línea editorial como barra
  de producción), no una tabla más — dirección guardada en
  `.interface-design/system.md`.
- **CI/CD** (2026-08-26): `.github/workflows/ci.yml` — tests del backend
  (Testcontainers) y build del frontend (lint + typecheck + `next build`
  contra un backend real) en cada push/PR. **Sin remoto de GitHub
  configurado todavía** — el pipeline no corre hasta que exista.
- **Backups** (2026-08-26): `scripts/backup.sh` (pg_dump formato custom +
  tar de medios locales, retención configurable) y `scripts/restore.sh`
  (restaura en una base nueva — es la prueba de restauración de la sección
  29). Verificados contra Postgres real. Falta automatizar la ejecución
  periódica y definir el destino de la copia externa — ambos dependen de
  la infraestructura de despliegue, que todavía no existe.

- **Auditoría — consulta desde el panel** (2026-08-27): el audit log se
  registraba desde el bootstrap del proyecto pero nadie podía consultarlo
  (secciones 18/35.3, fase 1). `GET /api/v1/admin/audit`
  (`SUPER_ADMIN`/`ADMIN`, más sensible que un listado editorial normal —
  incluye IPs y acciones de otros admins, sección 37) con filtros
  combinables (usuario, acción, tipo de recurso, resultado, rango de
  fechas) vía `JpaSpecificationExecutor` — de solo lectura, no reintroduce
  update/delete en el repositorio append-only. Pantalla
  `/admin/auditoria`.
- **Dockerfiles + stack completo en contenedores** (2026-08-27): imágenes
  multi-stage para backend (JRE Alpine, sin JDK/Maven en la imagen final) y
  frontend (`next.config.ts` con `output: "standalone"`, sin
  `node_modules` completo). `infra/docker-compose.yml` ahora levanta
  Postgres + Redis + backend + frontend con healthchecks reales. Sin
  usuario root en ninguna imagen. Probado extremo a extremo: los 4
  contenedores healthy, home/login sirviendo 200 contra el backend
  containerizado. **Limitación conocida:** `next build` hace fetch real al
  backend (SSG de páginas públicas), así que el build del frontend necesita
  el backend ya arriba — no hay forma de hacerlo con un solo
  `docker compose up --build` (ver README, sección "Stack completo").

**Pendiente para un MVP completo** (sección 34): despliegue real en Contabo
(sección 25 — hoy el stack en contenedores corre pero no está desplegado en
ningún servidor), automatización de backups en el servidor, Nginx/reverse
proxy delante del stack. CORS sigue sin configurarse (el panel admin corre
en Server Actions, no lo necesita todavía).
