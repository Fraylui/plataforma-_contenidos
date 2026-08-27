# syntax=docker/dockerfile:1
#
# Build multi-stage sobre next.config.ts `output: "standalone"`: la imagen
# final solo lleva el server standalone + los estáticos, no todo
# node_modules (CONTEXTO.md secciones 21/25/26).
#
# NEXT_PUBLIC_* se hornea en el bundle en build time (queda visible en el
# navegador) — por eso es ARG+ENV acá, a diferencia de BACKEND_API_URL/
# SITE_URL, que el server standalone lee en runtime (ver docker-compose.yml).

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_BACKEND_ASSET_URL
ENV NEXT_PUBLIC_BACKEND_ASSET_URL=${NEXT_PUBLIC_BACKEND_ASSET_URL}
# Server Components hacen fetch real al backend durante `next build`
# (páginas estáticas de secciones públicas) — necesita un backend
# alcanzable en build time, igual que el job "frontend" de CI.
ARG BACKEND_API_URL
ENV BACKEND_API_URL=${BACKEND_API_URL}

RUN npm run build

FROM node:22-alpine AS runtime
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build --chown=app:app /app/public ./public
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static

USER app
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
# 127.0.0.1 explícito, no "localhost": dentro de este contenedor
# "localhost" resuelve a ::1 antes que a 127.0.0.1, y el server de Next
# (HOSTNAME=0.0.0.0) solo escucha en IPv4 — con "localhost" el healthcheck
# daba "Connection refused" pese a que el server respondía bien (probado).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000/ >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
