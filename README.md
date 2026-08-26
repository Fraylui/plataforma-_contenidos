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

Bootstrap inicial (2026-08-25): estructura de repo, esqueleto de backend
(Spring Boot 4 + PostgreSQL + Redis + Flyway + Actuator + seguridad base
"deny all excepto health") y esqueleto de frontend (Next.js 16 + Tailwind,
sin sistema de diseño todavía). Ninguna funcionalidad de negocio
implementada aún — ver sección 34 de CONTEXTO.md para el orden del MVP.
