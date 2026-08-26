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

# 4. Frontend
cd ../frontend
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
  semilla (Perú/Ayacucho) — se cargan por API, no se inventan. **Fuera de
  esta tarea, señalado explícito:** todavía no hay `geographyId` en
  `Article` (conectar Content con Geography queda como paso aparte);
  desactivar una unidad no desactiva en cascada a sus hijos (mismo
  comportamiento que Category, no es una regresión nueva).

**Pendiente para un MVP completo** (sección 34): Lugares (post-MVP),
Imágenes, integración YouTube, SEO técnico (sitemap/robots.txt), búsqueda, panel
administrativo (frontend), estadísticas básicas, CI/CD, backups.
