# Plataforma de Contenidos

Sistema de gestión y distribución de contenidos digitales. Monolito modular:
`frontend` (Next.js) + `backend` (Spring Boot) + PostgreSQL + Redis.

**Antes de tocar código, lee [`CONTEXTO.md`](./CONTEXTO.md)** — es la fuente
de verdad del proyecto (producto, arquitectura, seguridad, modelo de
negocio, estándar de frontend). Se actualiza cuando cambia una decisión
importante.

## Estructura

```text
frontend/   Next.js (TypeScript, App Router, Tailwind)
backend/    Spring Boot (Java 21, Maven)
infra/      docker-compose para desarrollo local (PostgreSQL + Redis)
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

## Tests

```bash
# Backend — usa Testcontainers, requiere Docker corriendo
cd backend && ./mvnw test

# Frontend
cd frontend && npx eslint . && npm run build
```

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

**Pendiente para un MVP completo** (sección 34): Lugares (post-MVP),
SEO técnico (sitemap/robots.txt), búsqueda, panel administrativo (el
sitio público ya existe; el panel de EDITOR/AUTHOR para gestionar
contenido desde el navegador sigue sin construirse), configuración de
marca, estadísticas básicas, CI/CD, Dockerfiles de producción, backups.
CORS sigue sin configurarse (lo necesita el panel admin, no el sitio
público).
