# syntax=docker/dockerfile:1
#
# Build multi-stage (CONTEXTO.md secciones 21/25/26): la imagen final no
# lleva JDK ni Maven, solo el JRE y el jar ya empaquetado. Los tests NO
# corren acá — corren en CI (ver .github/workflows/ci.yml, Testcontainers
# necesita el socket de Docker del host, no tiene sentido dentro del propio
# build) — este Dockerfile solo empaqueta lo que ya pasó CI.

FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Capa de dependencias separada del código fuente para aprovechar la caché
# de Docker: mientras no cambie pom.xml, este paso no se repite.
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline

COPY src src
RUN ./mvnw -B -q -DskipTests package && mv target/*.jar target/app.jar

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /app/target/app.jar app.jar
USER app

EXPOSE 8080
# 127.0.0.1 explícito por el mismo motivo que en frontend/Dockerfile
# (dentro del contenedor "localhost" puede resolver a ::1 primero).
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/actuator/health | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
