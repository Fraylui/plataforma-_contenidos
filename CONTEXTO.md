# CONTEXTO DEL PROYECTO — PLATAFORMA DE CONTENIDOS

*Documento vivo. Única fuente de verdad del proyecto — se actualiza cuando
cambia una decisión importante, nunca se reescribe "por las dudas".*

---

# 1. Descripción

Se desarrollará una **Plataforma de Contenidos Digitales** profesional, escalable, segura y modular, diseñada para publicar, organizar y distribuir información de diferentes categorías en un solo lugar.

No será simplemente un blog ni una página de noticias. Será un **sistema de gestión y distribución de contenidos** — un ecosistema de contenidos, no una publicación centrada en artículos — capaz de manejar diferentes formatos, categorías, ubicaciones geográficas, autores, multimedia, SEO, publicidad y futuras funcionalidades.

## 1.1 Por qué no es un blog

Un blog normalmente se centra en artículos. Esta plataforma gestiona **diferentes tipos de contenido y los relaciona entre sí** (ver también el diagrama de la sección 2). Ejemplos concretos:

* Un lugar turístico puede tener historia, fotografías, videos y eventos relacionados.
* Una festividad puede estar conectada con una ubicación, una galería de imágenes y artículos relacionados.
* Una comunidad puede tener información cultural, gastronómica y turística asociada.

Esto es lo que debe guiar decisiones de diseño (visual y de arquitectura): ninguna sección — Lugares, Eventos, Directorio, etc. — debe sentirse como un apéndice forzado dentro de un formato pensado solo para artículos/noticias. Ver también sección 43 (estándar de diseño): la identidad visual debe funcionar para todos los tipos de contenido de la sección 3, no solo para el editorial de actualidad.

## 1.2 Alcance geográfico

La plataforma inicialmente estará orientada a **Perú** (comenzando con contenido de Ayacucho, que es lo que se puede producir primero), pero su arquitectura no debe limitarse a una región o país. La visión es crecer hacia otros países, regiones, temas y audiencias — no diseñar como si fuera a quedarse local para siempre (ver también sección 32, principio de escalabilidad).

## 1.3 Visión

Construir una plataforma de contenidos moderna, escalable y preparada para crecer, que reúna información, cultura, conocimiento, turismo y entretenimiento — con el tiempo, evolucionando hacia una empresa digital de contenidos con alcance nacional e internacional (el ángulo de negocio de esa evolución, con sus fases e hipótesis, está en la sección 44 — acá se habla del producto, no de cifras).

---

# 2. Objetivo

Crear un ecosistema donde los usuarios puedan:

* descubrir información;
* leer artículos;
* conocer lugares;
* descubrir historias;
* aprender;
* encontrar recomendaciones;
* consultar fotografías;
* visualizar videos;
* conocer eventos;
* explorar cultura y tradiciones;
* buscar empresas y servicios;
* descubrir contenido según su ubicación e intereses;
* compartir contenido con otras personas.

La plataforma debe conectar diferentes contenidos.

Por ejemplo:

```text
LUGAR
  ↓
Historia
  ↓
Artículo
  ↓
Fotografías
  ↓
Video
  ↓
Mapa
  ↓
Contenido relacionado
```

---

# 3. Tipos de contenido

El sistema debe soportar inicialmente y/o posteriormente:

### Texto

* Artículos
* Noticias
* Reportajes
* Crónicas
* Guías
* Entrevistas
* Historias
* Rankings
* Reseñas
* Tutoriales
* Opinión

### Multimedia

* Fotografías
* Galerías
* Videos
* Videos de YouTube
* Videos externos
* Podcasts
* Audio
* Infografías

### Información estructurada

* Lugares (turísticos, pueblos, comunidades, distritos, provincias, regiones)
* Eventos
* Empresas
* Restaurantes
* Hoteles
* Servicios / negocios locales
* Personas
* Organizaciones

### Cultura y conocimiento tradicional

* Tradiciones
* Costumbres
* Leyendas
* Historias de pueblos
* Saberes de los abuelos / memoria oral
* Gastronomía
* Artesanía
* Música
* Danzas
* Personajes locales
* Plantas y conocimientos tradicionales (medicina/uso ancestral)

La arquitectura debe permitir agregar nuevos tipos sin tener que reconstruir todo el sistema (ver sección 27 y sección 38 sobre módulos).

> Nota: "Pueblos / Comunidades / Distritos / Provincias / Regiones" son al
> mismo tiempo **nodos de la estructura geográfica** (sección 5) y pueden
> tener su propia página de tipo "Lugar" (sección 6). No son un tipo de
> contenido nuevo aparte de "Lugar": son instancias de la jerarquía
> geográfica que además funcionan como página de contenido.

---

# 4. Categorías

La plataforma debe soportar categorías y subcategorías ilimitadas.

Categorías iniciales:

```text
Actualidad
Perú
Turismo
Historia
Cultura
Tradiciones
Gastronomía
Naturaleza
Agricultura
Tecnología
Inteligencia Artificial
Ciencia
Educación
Negocios
Emprendimiento
Finanzas
Salud y Bienestar
Moda y Belleza
Deportes
Entretenimiento
Motor
Hogar
Familia
Historias
Curiosidades
```

Estas categorías **no deben estar hardcodeadas**.

El administrador podrá:

* crear;
* editar;
* eliminar;
* activar;
* desactivar;
* ordenar;
* crear subcategorías.

---

# 5. Estructura geográfica

La plataforma debe tener una estructura geográfica independiente de las categorías.

Ejemplo:

```text
País
 └── Región / Departamento
      └── Provincia
           └── Distrito
                └── Localidad / Comunidad
```

Ejemplo:

```text
Perú
└── Ayacucho
    └── Huamanga
        └── Quinua
```

Esto permitirá buscar contenido por ubicación.

Por ejemplo:

> Turismo → Ayacucho → Huamanga

o:

> Historia → Ayacucho → La Mar

La estructura debe permitir posteriormente otros países.

---

# 6. Lugares

Cada lugar podrá tener una página propia.

Ejemplo:

```text
Lugar
├── Nombre
├── Descripción
├── Ubicación
├── Coordenadas
├── Historia
├── Fotografías
├── Videos
├── Categorías
├── Eventos
├── Artículos relacionados
└── Información adicional
```

Ejemplo concreto: **Quinua, Ayacucho** podría tener su propia página con
historia, ubicación, fotografías, videos, lugares turísticos y artículos
relacionados.

Esto permitirá construir progresivamente una base de conocimiento geográfica.

## 6.1 Eventos

Segundo tipo de contenido implementado más allá de Artículo (sección 3,
"Información estructurada"). Mismo flujo editorial que Artículo/Lugar
(sección 12), con dos diferencias de fondo:

* **Fecha de inicio (obligatoria) y fin (opcional)** en vez de solo fecha
  de publicación — un evento tiene una vigencia real, no solo una fecha
  en la que se escribió.
* **El listado público separa "próximos" de "pasados"** (por fecha de
  inicio, no de publicación) en vez de un único orden cronológico —
  evita que el sitio se sienta un muro homogéneo cuando hay miles de
  contenidos con estados temporales distintos.

Un evento puede vincularse a un Lugar ya existente (`placeId`) o llevar
solo un nombre de lugar libre (`venueName`) cuando ese lugar todavía no
tiene su propia página — no se obliga a crear un Lugar solo para poder
publicar un evento.

## 6.2 Galerías

Tercer tipo de contenido implementado (sección 3, "Multimedia" →
"Galerías"). Mismo flujo editorial que el resto, pero sin cuerpo de texto
largo: el contenido *es* la colección de fotografías, así que
`GalleryService` exige al menos una imagen — la única regla de negocio
de este tipo que no existe en ningún otro módulo de contenido.

## 6.3 Reseñas

Cuarto tipo de contenido implementado (sección 3, "Información
estructurada"). Mismo flujo editorial que el resto, con cuerpo de texto
largo (a diferencia de Galería). Su diferenciador real: una calificación
(`rating`, 1-5, validada tanto en la API como con un CHECK real en la
base de datos). Puede reseñar un Lugar ya existente (`placeId`) o algo
que todavía no tiene página propia (`subjectName` libre) — mismo patrón
que Evento con `placeId`/`venueName`.

---

# 7. Historias y cultura

Una línea importante de la plataforma será recopilar y publicar:

* historias de pueblos;
* historias de personas;
* historias familiares;
* tradiciones;
* costumbres;
* leyendas;
* gastronomía;
* artesanía;
* música;
* danzas;
* conocimientos tradicionales;
* memoria oral;
* personajes locales.

Ejemplo:

> Una persona mayor cuenta cómo era su comunidad hace 50 años.

Esto puede convertirse en:

```text
Entrevista
+
Artículo
+
Fotografías
+
Video
```

---

# 8. Multimedia

La plataforma tendrá un módulo multimedia.

Debe diferenciar:

### Contenido alojado externamente

Principalmente:

```text
YouTube
```

Flujo:

```text
Administrador
      ↓
Pega URL de YouTube
      ↓
Sistema obtiene Video ID
      ↓
Guarda referencia
      ↓
Frontend muestra reproductor
```

El video **no se almacenará en Contabo**.

Esto reduce considerablemente el consumo de almacenamiento y ancho de banda.

---

# 9. Videos propios

El sistema debe quedar preparado para permitir posteriormente:

```text
Usuario autorizado
       ↓
Subir video
       ↓
Object Storage
       ↓
CDN
       ↓
Usuario final
```

No se debe diseñar la infraestructura pensando que el servidor Contabo almacenará indefinidamente grandes cantidades de video.

---

# 10. Imágenes

Inicialmente se pueden almacenar imágenes en infraestructura propia.

Pero la arquitectura debe permitir posteriormente:

```text
Object Storage
      ↓
CDN
      ↓
Usuario
```

La base de datos almacenará metadatos y referencias, no necesariamente archivos pesados.

---

# 11. CMS / Panel administrativo

Debe existir un panel administrativo completo.

```text
Dashboard
│
├── Contenidos
├── Categorías
├── Etiquetas
├── Lugares
├── Multimedia
├── Autores
├── Usuarios
├── Roles
├── Eventos
├── Directorio
├── Comentarios
├── SEO
├── Publicidad
├── Estadísticas
├── Auditoría
└── Configuración
```

---

# 12. Sistema editorial

Los contenidos deben tener estados.

```text
DRAFT
IN_REVIEW
APPROVED
SCHEDULED
PUBLISHED
ARCHIVED
REJECTED
```

Flujo:

```text
Redactor
   ↓
Borrador
   ↓
Editor
   ↓
Revisión
   ↓
Aprobación
   ↓
Publicación
```

Debe ser posible programar publicaciones.

---

# 13. Usuarios y roles

Roles iniciales:

```text
SUPER_ADMIN
ADMIN
EDITOR
AUTHOR
MODERATOR
COLLABORATOR
USER
VISITOR
```

Debe existir RBAC:

> Role-Based Access Control.

Los permisos deben ser granulares. (Ampliado en la sección 36 con tipos de
trabajador/administrador y reglas específicas del superusuario.)

---

# 14. Configuración de identidad de plataforma

El nombre y logo **todavía no están definidos**. Por ello, no deben estar
hardcodeados en ningún lado del código.

Ruta en el CMS:

```text
Administrador → Configuración → Identidad de la plataforma
```

### 14.1 Campos configurables

```text
Identidad
├── Nombre de la plataforma
├── Nombre corto
├── Descripción
├── Slogan
├── Logo principal
├── Logo para modo oscuro
├── Favicon
└── Imagen para compartir (Open Graph)

Apariencia
├── Color principal
├── Color secundario
├── Color de fondo
├── Tipografía
└── Tema (claro/oscuro/auto)

SEO
├── Título por defecto
├── Meta descripción por defecto
├── Imagen social por defecto
└── Google Search Console verification

Redes sociales
├── Facebook
├── Instagram
├── TikTok
└── YouTube

Contacto
├── Correo de contacto
├── Teléfono
└── Dirección

Monetización
├── AdSense
├── Publicidad
└── Analytics (Google Analytics / similar)
```

### 14.2 Ejemplo de uso (antes/después de definir marca)

```text
Estado inicial              Estado final
──────────────────────      ──────────────────────
Nombre: Plataforma de       Nombre: NuevaMarca
        Contenidos
Logo: logo-temporal.png     Logo: logo-final.png
Slogan: (sin definir)       Slogan: "Historias que conectan"
Facebook: (sin configurar)  Facebook: facebook.com/nuevamarca
```

El cambio se hace **desde el panel**, sin tocar código ni redeployar.

### 14.3 Regla obligatoria para el equipo (código y agentes de IA incluidos)

**Prohibido** cablear nombre/marca/logo en el código:

```text
❌ const nombre = "NewFlash";
❌ <title>Ayacucho NewsFlash</title>
❌ import logo from "./logo-newflash.svg"
```

**Correcto**: todo se lee de la configuración persistida (tabla/servicio
`platformSettings`, cacheada en Redis, expuesta al frontend vía API/props):

```text
✔ platformSettings.name
✔ platformSettings.logoUrl
✔ platformSettings.slogan
✔ <title>{platformSettings.seo.defaultTitle}</title>
```

Esta regla aplica a `DARREV Group`, `NewFlash`, `Ayacucho NewsFlash` y
cualquier nombre de marca futuro: ninguno debe aparecer hardcodeado en
código, config de build, ni fixtures de test — solo, si acaso, como valor de
ejemplo/seed en datos de desarrollo, nunca como literal en lógica o markup.

---

# 15. SEO

El SEO será fundamental.

Cada contenido debe poder manejar:

```text
Slug
SEO Title
Meta Description
Canonical URL
Open Graph
Schema.org
Imagen SEO
Robots
```

Además:

```text
Sitemap
Robots.txt
URLs amigables
Breadcrumbs
Datos estructurados
```

La plataforma debe estar diseñada para buscadores desde el inicio.

---

# 16. Búsqueda

Debe existir búsqueda interna.

Inicialmente:

```text
PostgreSQL
```

Posteriormente, si la cantidad de contenido aumenta:

```text
OpenSearch / Elasticsearch
```

La arquitectura debe permitir reemplazar o complementar el mecanismo de búsqueda.

---

# 17. Seguridad

La seguridad será un requisito transversal.

Se tomarán como referencia:

* OWASP Top 10.
* OWASP ASVS.
* OWASP Cheat Sheets.
* Secure by Design.
* Principio de mínimo privilegio.

Se deberá contemplar:

```text
HTTPS
Autenticación segura
Autorización
RBAC
Password hashing
Rate limiting
Validación de entradas
Protección XSS
Protección SQL Injection
CSRF cuando corresponda
CORS
Security Headers
Gestión de secretos
Auditoría
Logs
Backups
```

Nunca confiar únicamente en validaciones del frontend.

---

# 18. Auditoría

El sistema debe registrar operaciones importantes:

```text
Usuario
Acción
Recurso
Fecha
IP
Resultado
Cambios realizados
```

Ejemplo:

```text
EDITOR
UPDATE_ARTICLE
ARTICLE #152
25/08/2026
```

(Ampliado en la sección 35.3 con niveles de auditoría por fase.)

---

# 19. Arquitectura

La primera versión será un:

> **Monolito Modular**

No se comenzará directamente con microservicios.

Pero deberá existir separación clara de módulos.

```text
Frontend
     ↓
API
     ↓
Application
     ↓
Domain
     ↓
Infrastructure
```

Módulos:

```text
Identity
Content
Taxonomy
Geography
Places
Media
Events
Directory
SEO
Search
Notifications
Audit
Advertising
Configuration
```

---

# 20. Preparación para microservicios

En el futuro, algunos módulos podrán convertirse en servicios independientes.

Por ejemplo:

```text
                    API Gateway
                         │
          ┌──────────────┼─────────────┐
          ↓              ↓             ↓
     Content         Identity        Media
     Service         Service         Service
```

La separación solo se realizará cuando exista una necesidad real de escalabilidad, disponibilidad o independencia. (Detalle técnico concreto en la sección 38.)

---

# 21. Stack tecnológico

### Frontend

```text
Next.js
```

### Backend

```text
Spring Boot
```

### Base de datos

```text
PostgreSQL
```

### Cache

```text
Redis
```

### Contenedores

```text
Docker
```

### Control de versiones

```text
Git
GitHub
```

### CI/CD

```text
GitHub Actions
```

### Infraestructura inicial

```text
Contabo
```

### DNS/CDN/seguridad perimetral

```text
Cloudflare
```

### Dominio

```text
Registrador de dominio
```

### Video inicial

```text
YouTube
```

---

# 22. WebSockets

No son obligatorios para el MVP, pero la arquitectura debe permitir incorporarlos.

Posibles usos:

* notificaciones;
* comentarios en tiempo real;
* chat;
* estadísticas;
* administración en tiempo real.

(Detalle técnico de implementación en la sección 40.)

---

# 23. Redis

Redis se utilizará para:

* caché;
* rate limiting;
* datos temporales;
* sesiones cuando corresponda;
* optimización de consultas frecuentes.

PostgreSQL seguirá siendo la fuente principal de datos persistentes.

---

# 24. Patrones de diseño

Se utilizarán patrones cuando realmente resuelvan problemas.

Posibles:

* Repository.
* Strategy.
* Factory.
* Builder.
* Adapter.
* Observer / eventos.
* Specification.

Y principios:

* SOLID.
* DRY.
* KISS.
* Separation of Concerns.

No utilizar patrones simplemente para aumentar la complejidad.

---

# 25. Infraestructura inicial

La primera infraestructura será aproximadamente:

```text
                    Internet
                       │
                       ▼
                  Cloudflare
                       │
                       ▼
                    Contabo
                       │
                 Docker Engine
                       │
        ┌──────────────┼─────────────┐
        ↓              ↓             ↓
     Next.js       Spring Boot    Nginx
                       │
                ┌──────┴──────┐
                ↓             ↓
           PostgreSQL       Redis
```

Posteriormente:

```text
Object Storage
CDN
Monitoring
Message Broker
API Gateway
Microservices
```

según necesidad.

Guía operativa de producción (capas de caché Cloudflare → nginx → ISR, límite
por IP, swap, reglas de Cloudflare, backups fuera del VPS, comandos a evitar):
ver `infra/DESPLIEGUE.md`.

---

# 26. CI/CD

Flujo:

```text
Developer
    ↓
Git
    ↓
GitHub
    ↓
Pull Request
    ↓
Tests
    ↓
Security Checks
    ↓
Build
    ↓
Docker Image
    ↓
Deploy
    ↓
Contabo
```

---

# 27. Testing

Debe existir:

### Backend

* Unit tests.
* Integration tests.
* API tests.
* Security tests.

### Frontend

* Component tests.
* Integration tests.
* E2E.

### Seguridad

* SAST.
* Dependency scanning.
* DAST posteriormente.

---

# 28. Observabilidad

El sistema debe poder responder:

> ¿Está funcionando?

> ¿Qué está fallando?

> ¿Qué está lento?

> ¿Cuánto tráfico tenemos?

> ¿Qué usuario realizó determinada acción?

Implementar progresivamente:

* Logs estructurados.
* Métricas.
* Health checks.
* Alertas.
* Monitoring.
* Trazabilidad.

---

# 29. Backups

Debe existir una estrategia de respaldo para PostgreSQL y archivos importantes.

```text
Backup
↓
Retención
↓
Copia externa
↓
Prueba de restauración
```

No depender únicamente del disco de Contabo.

---

# 30. Monetización

La plataforma debe estar preparada para:

### Publicidad

* Google AdSense.
* Publicidad directa.

### YouTube

Los videos publicados en el canal pueden tener su propia monetización cuando el canal cumpla los requisitos correspondientes.

### Otros

* Contenido patrocinado.
* Directorios premium.
* Afiliados.
* Eventos.
* Servicios.
* Nuevos modelos de negocio.

El módulo de publicidad debe ser configurable. (Requisitos de UX de
publicidad detallados en la sección 43.)

---

# 31. Distribución del contenido

Una publicación no debe existir únicamente en la web.

Ejemplo:

```text
                 CONTENIDO
                     │
       ┌─────────────┼─────────────┐
       ↓             ↓             ↓
      Web          YouTube      Redes Sociales
       │             │             │
   Artículo        Video       Facebook/TikTok
```

Un mismo tema puede transformarse en:

```text
Artículo
+
Video
+
Short
+
Galería
+
Publicación social
```

---

# 32. Principio de escalabilidad

El sistema debe poder comenzar pequeño:

```text
1 servidor Contabo
```

y posteriormente evolucionar:

```text
Contabo
 ↓
Más recursos
 ↓
Separación de almacenamiento
 ↓
CDN
 ↓
Servicios especializados
 ↓
Microservicios
 ↓
Infraestructura distribuida
```

No se debe sobredimensionar la primera versión.

---

# 33. Principio fundamental

La plataforma debe cumplir:

> **Modularidad + Seguridad + Mantenibilidad + SEO + Escalabilidad.**

La primera versión debe ser funcional y relativamente sencilla, pero su arquitectura debe evitar decisiones que impidan crecer.

---

# 34. Primera versión recomendada (MVP)

El MVP debería concentrarse en:

```text
1. Usuarios
2. Roles
3. Autenticación
4. Artículos
5. Categorías
6. Etiquetas
7. Geografía
8. Imágenes
9. YouTube
10. SEO
11. Búsqueda
12. Panel administrativo
13. Auditoría
14. Configuración de marca
15. Estadísticas básicas
16. Seguridad
17. Docker
18. CI/CD
19. Backups
```

Después se incorporarán:

```text
Lugares
Eventos
Directorio
Podcasts
Comentarios avanzados
Notificaciones
WebSockets
Publicidad avanzada
Object Storage
CDN
```

y posteriormente, si el crecimiento lo justifica:

```text
Microservicios
Message Broker
API Gateway
Kubernetes
```

---

# 35. Cumplimiento normativo y auditorías (ISO / legal)

El proyecto no puede depender solo de "buenas prácticas" sueltas: debe
anclarse a marcos reconocidos, de forma progresiva (no todo desde el día 1).

### 35.1 Marcos de referencia

```text
Seguridad de la información   → ISO/IEC 27001 (SGSI) + ISO/IEC 27002 (controles)
Privacidad / datos personales → ISO/IEC 27701
Continuidad de negocio        → ISO 22301 (cuando exista dependencia crítica)
Calidad de software           → ISO/IEC 25010 (características de calidad)
Desarrollo seguro             → OWASP ASVS, OWASP SAMM, OWASP Top 10
Gestión de riesgos            → ISO 31000 / NIST CSF (como guía, no certificación)
```

No se busca certificar ISO 27001 desde el inicio (es costoso y prematuro para
un MVP), pero **se diseña como si algún día hubiera que auditar contra ella**:
políticas, controles, evidencia y logs desde el principio.

### 35.2 Marco legal aplicable

```text
Perú (revisado 2026-10-16)
├── Ley N.º 29733 — Protección de Datos Personales
├── Reglamento nuevo: D.S. 016-2024-JUS, vigente desde el 30-03-2025 (reemplaza
│   al D.S. 003-2013-JUS): brechas de seguridad se notifican en 48 h, oficial de
│   datos personales con plazos según tamaño, transferencias internacionales
├── D.L. 1044 — Competencia Desleal: art. 16, principio de autenticidad (todo
│   anuncio identificable como tal; publicidad encubierta sancionada hasta 700 UIT)
├── Guía de Publicidad para Influencers de Indecopi (2.ª ed., 2024): «conexión
│   material» con el anunciante = se marca como publicidad
├── Ley N.º 29571 — Código de Protección y Defensa del Consumidor
├── D.L. 822 — Derecho de Autor (fotos, textos y videos propios o con licencia)
├── Ley N.º 28493 — correo comercial no solicitado (si hay boletín por email)
├── Ley N.º 30096 — Delitos Informáticos
├── Rubros con advertencias obligatorias en sus anuncios: alimentos procesados
│   (Ley 30021, octógonos), bebidas alcohólicas (Ley 28681), juegos y apuestas
│   a distancia (Ley 31557) → no aceptar sin revisión legal
└── SUNAT: RUC y comprobantes electrónicos por la publicidad directa; ingresos
    de AdSense declarados

Contractual (no es ley, pero te pueden cerrar la cuenta)
├── Políticas del programa de Google AdSense (contenido, clics inválidos,
│   divulgación de cookies en la política de privacidad, consentimiento)
└── Términos de servicio de YouTube (insertar videos está permitido)

Si la plataforma capta usuarios de la UE
└── GDPR (Reglamento General de Protección de Datos) — aplica por alcance,
    no por ubicación del servidor
```

Implicaciones concretas para el diseño:

```text
Consentimiento explícito para datos personales (registro, cookies, newsletter)
Política de privacidad y términos de uso versionados
Derecho de acceso, rectificación, cancelación y oposición (ARCO)
Registro de tratamiento de datos ante la Autoridad Nacional (si aplica)
Banner de cookies con opción real de rechazo (no solo "aceptar")
Retención de datos con plazo definido, no indefinida
```

### 35.3 Auditoría interna (amplía la sección 18)

Niveles de auditoría a implementar por fases:

```text
Fase 1 (MVP)     → Audit log de acciones administrativas (quién hizo qué)
Fase 2           → Audit log de acceso a datos sensibles + exportación
Fase 3           → Revisiones periódicas (checklist OWASP ASVS nivel 1)
Fase 4           → Auditoría externa / pentest cuando haya tráfico real
```

Cada evento de auditoría debe ser **inmutable** (append-only) y separado del
resto de la base de datos operativa, o replicado a un almacén write-once.

---

# 36. Tipos de trabajadores y administradores

Conviene separar dos ejes que suelen confundirse: **rol funcional** (qué hace
la persona en el negocio) y **rol de acceso/RBAC** (qué puede hacer en el
sistema, sección 13). El primero es organizacional; el segundo es técnico.
Un mismo trabajador puede tener un rol de negocio y uno o más permisos
técnicos.

### 36.1 Personal de contenido (equipo editorial)

```text
Redactor / Autor            → crea borradores, no publica
Editor                      → revisa, corrige, aprueba o rechaza
Fotógrafo / Videomaker      → sube y gestiona multimedia
Editor multimedia           → post-producción de audio/video (podcasts, cortes)
Community Manager           → gestiona distribución en redes, no contenido web
Moderador                   → gestiona comentarios y reportes de usuarios
Traductor (futuro)          → gestiona versiones en otros idiomas
Investigador cultural       → recopila tradiciones, historias orales, saberes
                               ancestrales antes de convertirlos en contenido
Corresponsal / cronista     → colaborador local en un pueblo/distrito que
   comunitario                reporta desde el terreno (puede ser un rol de
                               AUTHOR con alcance geográfico limitado a su zona)
Curador de contenido        → arma colecciones, destacados y rutas temáticas
                               entre contenidos ya publicados
Gestor de eventos           → mantiene la agenda de eventos (sección "Eventos")
Gestor de directorio        → mantiene fichas de negocios/lugares/servicios
```

### 36.2 Personal técnico

```text
Desarrollador Backend
Desarrollador Frontend
DevOps / Infraestructura
QA / Tester
Analista de seguridad (a partir de que haya tráfico real)
```

### 36.3 Personal de negocio

```text
Administrador de publicidad / monetización
Analista de datos / estadísticas
Soporte al usuario
```

### 36.4 Administradores (nivel de sistema)

```text
SUPER_ADMIN     → control total, incluida gestión de otros admins y config
                  crítica (marca, seguridad, integraciones). Debe ser
                  mínimo posible (1-2 personas) — ver 36.5 sobre MFA.
ADMIN           → gestión operativa completa, sin acceso a configuración
                  crítica de infraestructura ni a la gestión de SUPER_ADMIN.
ADMIN_CONTENIDO → gestiona todo lo editorial (categorías, taxonomía,
                  lugares, contenidos), sin acceso a usuarios/roles.
ADMIN_TECNICO   → gestiona configuración técnica (SEO global, integraciones,
                  caché, backups), sin publicar contenido.
```

Esto amplía la lista de roles de la sección 13 sin reemplazarla: los roles
`SUPER_ADMIN … VISITOR` siguen siendo la base de RBAC; lo anterior es cómo se
agrupan en la práctica según función de negocio. Los roles editoriales de
36.1 (investigador cultural, corresponsal, curador, gestor de eventos/
directorio) se implementan técnicamente como variaciones de `AUTHOR` /
`EDITOR` con permisos y alcance (scope geográfico o de módulo) acotados, no
como roles RBAC nuevos desde el inicio — se evalúa crear un rol RBAC
dedicado solo si la granularidad de `AUTHOR`/`EDITOR` resulta insuficiente
en la práctica.

### 36.5 El superusuario: reglas especiales

**MFA retirado (2026-09-14):** hubo TOTP obligatorio para SUPER_ADMIN; se
quitó por decisión de producto (queda para una versión futura, no era una
prioridad todavía con el proyecto sin tráfico real). El resto de esta
sección sigue vigente.

```text
1. Nunca se usa para trabajo diario (se usa una cuenta ADMIN normal).
2. (Retirado — ver nota arriba.)
3. Cada acción de SUPER_ADMIN queda auditada con mayor detalle (before/after).
4. Idealmente, acciones críticas (borrar usuario, cambiar rol de otro admin,
   modificar configuración de seguridad) requieren doble confirmación o
   segundo aprobador (four-eyes principle) cuando el equipo lo permita.
5. Las credenciales de superusuario no se comparten ni se guardan en texto
   plano en ningún lado (usar un gestor de secretos).
```

---

# 37. Logs: qué se registra y dónde

No todos los logs son iguales ni tienen el mismo destino. Conviene separarlos
desde el diseño para no mezclar "debug" con "evidencia legal".

```text
Tipo de log          Contenido                              Retención sugerida
────────────────────────────────────────────────────────────────────────────
Application log      Errores, warnings, trazas técnicas     7-30 días
Access log            (Nginx) IP, endpoint, status, latencia 30-90 días
Security log          Login fallido, bloqueo, rate limit hit 90-180 días
Audit log             Acción admin/editorial (sec. 18 y 35)  Indefinida / años
Business/analytics    Vistas, clics, conversiones            Según política
```

Principios:

```text
Logs estructurados (JSON), no texto libre → permiten trazabilidad real
Nunca loguear contraseñas, tokens, datos de tarjetas, ni PII innecesaria
Los logs de seguridad y auditoría no deben poder ser editados ni borrados
   por un ADMIN normal (solo lectura, incluso para SUPER_ADMIN idealmente)
Centralizar (aunque sea simple al inicio): stdout de contenedores → agregador
   (Loki / ELK / Grafana) cuando el volumen lo justifique
Correlación: cada request lleva un trace/request ID que atraviesa
   Frontend → API → Backend → DB, para poder reconstruir un incidente
```

---

# 38. Arquitectura preparada para microservicios (detalle)

Ampliando la sección 20, el monolito modular debe respetar límites de
**bounded context** desde el día 1, aunque todo corra en un solo proceso.
Regla práctica: **cada módulo solo accede a otro módulo a través de su
interfaz pública (servicio/puerto), nunca directamente a sus tablas.**

```text
                         ┌─────────────────────────┐
                         │      API Gateway         │  (futuro: Nginx/Kong)
                         └────────────┬─────────────┘
                                      │
        ┌───────────┬────────────────┼────────────────┬───────────┐
        ▼           ▼                ▼                ▼           ▼
    Identity     Content          Taxonomy         Geography     Media
    (users,      (artículos,      (categorías,     (país/región/ (imágenes,
     roles,       estados,         etiquetas)        provincia)   video refs)
     auth)        editorial)
        │           │                │                │           │
        └───────────┴────────────────┴────────────────┴───────────┘
                                      │
                              Event Bus interno
                       (in-process al inicio; Kafka/RabbitMQ después)
```

Reglas para que la migración futura sea barata:

```text
1. Comunicación entre módulos vía interfaces + eventos de dominio,
   nunca vía joins SQL directos entre esquemas de módulos distintos.
2. Cada módulo con su propio esquema/schema de PostgreSQL (aislamiento
   lógico desde ya, aunque sea la misma instancia física).
3. IDs públicos como UUID, no autoincrementales expuestos (facilita
   partición y evita colisiones al separar bases de datos).
4. Eventos de dominio documentados (ej. ContentPublished, UserRegistered)
   como contrato estable, aunque hoy se despachen en memoria.
5. Ningún módulo asume que otro corre "en el mismo proceso" en su lógica
   de negocio (nada de llamadas estáticas cruzadas).
```

Cuando exista necesidad real (no antes): el módulo con más carga o
requisitos de disponibilidad distintos (típicamente Media o Content) se
extrae primero, detrás del mismo contrato de eventos ya definido.

---

# 39. Middlewares

### 39.1 Backend (Spring Boot)

```text
Orden típico de la cadena de filtros/interceptores:
1. Correlation-ID / request tracing
2. CORS
3. Rate limiting (Redis)
4. Autenticación (JWT / sesión)
5. Autorización (RBAC / permisos por endpoint)
6. Validación de entrada (Bean Validation)
7. Logging de acceso
8. Manejo centralizado de errores (exception handler → respuesta uniforme)
```

### 39.2 Frontend (Next.js middleware.ts)

```text
Redirección por geolocalización/idioma (futuro multi-país)
Protección de rutas /admin (verificación de sesión antes de renderizar)
Reescritura de URLs amigables / redirects SEO (301) para slugs cambiados
Cabeceras de seguridad (CSP, X-Frame-Options, etc.) a nivel de edge
```

### 39.3 Principio

Los middlewares son la primera línea de defensa, pero **nunca la única**: la
autorización y validación se repiten en el backend (defense in depth), tal
como ya establece la sección 17 ("nunca confiar únicamente en el frontend").

---

# 40. WebSockets (detalle de implementación futura)

Ampliando la sección 22. Cuando se implemente, el patrón recomendado con
Spring Boot es STOMP sobre WebSocket (con SockJS como fallback), autenticado
con el mismo JWT de la sesión HTTP.

```text
Cliente (Next.js)
     │  connect + JWT
     ▼
WS Gateway (Spring)
     │
     ├── /topic/notifications/{userId}   → notificaciones personales
     ├── /topic/comments/{contentId}     → comentarios en vivo
     └── /topic/admin/stats              → panel admin en tiempo real
```

No es necesario para el MVP. Se activa cuando exista un caso de uso real
(ej. comentarios en vivo con tráfico suficiente para justificarlo), no como
funcionalidad especulativa.

---

# 41. Metodología de trabajo: Scrum + XP (adaptado)

El equipo es pequeño y trabaja con apoyo de agentes de IA (ver sección 42),
así que se usa una versión ligera de Scrum combinada con prácticas técnicas
de Extreme Programming (XP), no el proceso completo "de manual".

### 41.1 De Scrum se toma

```text
Backlog priorizado (sección 34: MVP primero, resto después)
Sprints cortos (1-2 semanas) con objetivo claro por sprint
Sprint review informal: ¿qué quedó funcionando de verdad?
Retro breve: ¿qué del flujo con IA funcionó / qué no?
```

Se deja de lado la ceremonia pesada (daily formal, story points elaborados)
mientras el equipo sea muy pequeño; se recupera si el equipo crece.

### 41.2 De XP se toma (esto es lo que más aporta con desarrollo asistido por IA)

```text
Test-First / TDD           → el test se escribe antes o junto con el código,
                              nunca "para después" (encaja con el test loop
                              de la sección 42)
Integración continua        → cada PR pequeño, mergeado seguido, con CI en
                              verde (sección 26)
Refactor continuo           → no se acumula deuda "para más adelante"; se
                              corrige en el mismo ciclo (self-correction loop)
Diseño simple               → lo mínimo que resuelve el problema actual, sin
                              sobre-ingeniería (coherente con la sección 24)
Code review sistemático     → cada cambio pasa por revisión (humana y/o de
                              IA) antes de mergear a main
Pair programming ↔ IA       → el agente de IA cumple el rol de "par": el
                              humano define objetivo y revisa; la IA propone
                              e implementa dentro de ese marco
```

### 41.3 Definición de "hecho" (Definition of Done)

Una tarea no se considera terminada hasta que:

```text
Compila / build en verde
Tests pasan (unitarios + integración si aplica)
Pasó el security loop cuando toca (código sensible: auth, permisos, input)
Code review aprobado
Documentado si introduce una decisión de arquitectura nueva
```

---

# 42. Flujo de trabajo con agentes de IA (referencia operativa)

Esto resume, para el equipo, cómo se usa la IA en este proyecto — no es un
detalle nuevo del producto, es una guía de proceso interno.

```text
Context Engineering  → el agente siempre parte de este documento + reglas
                        de seguridad/arquitectura, no de un prompt suelto
Decomposition         → cada feature se pide dividida (auth, luego roles,
                        luego contenido...), no "toda la plataforma junta"
Plan → Execute         → para cambios no triviales: primero plan (sin tocar
                        código), luego ejecución del plan aprobado
Test loop              → implementar → test → corregir → test de nuevo
Security loop           → especialmente en Identity, permisos, input de
                        usuario: revisión OWASP antes de dar por cerrado
Review loop             → revisión de código (arquitectura, seguridad,
                        rendimiento) antes de mergear
Memoria de decisiones   → decisiones importantes (por qué PostgreSQL, por
                        qué YouTube y no upload propio, por qué monolito
                        modular) se documentan, no se asumen de memoria
```

Multi-agente (un orquestador con agentes especializados en backend, frontend,
seguridad, QA) queda como posibilidad futura, no como punto de partida: al
inicio, un agente principal con buen contexto y estos loops es suficiente.

---

# 43. Estándar de diseño y frontend

El frontend debe tener calidad de producto profesional de primer nivel — no
un diseño genérico de plantilla, un CRUD visual, ni una interfaz que parezca
generada automáticamente. Referencia de UX/UI (sin copiar identidad visual
ni código): Google, Apple, Stripe, Notion. Identidad propia, adaptable a la
marca definitiva (sección 14).

### 43.1 Requisitos no negociables

```text
Jerarquía visual clara            Estados: loading/empty/error/éxito
Excelente tipografía              Feedback visual en toda acción
Espaciado consistente             Microinteracciones solo si aportan valor
Sistema de diseño coherente       Animaciones sutiles, nunca decorativas
Componentes reutilizables         Excelente navegación y legibilidad
Responsive real, mobile-first     Buen contraste
Accesibilidad (WCAG como ref.)    Imágenes optimizadas
Core Web Vitals                   SEO (integrado con sección 15)
```

Regla: cada elemento visual debe tener una razón UX. No se anima "para que
se vea moderno". Prioridad: claridad, confianza, velocidad, facilidad de
uso — la plataforma se monetiza con publicidad, así que profesionalismo y
credibilidad son directamente parte del modelo de negocio.

### 43.2 Publicidad sin destruir la experiencia

```text
Prohibido: cubrir contenido inesperadamente, generar clics accidentales,
romper la navegación, degradar el rendimiento, verse como spam.
```

Debe existir separación visual clara entre contenido editorial y
publicidad. La arquitectura frontend debe soportar distintas posiciones de
anuncio mediante slots configurables, sin editar manualmente cada página.

### 43.3 Uso de skills/agentes especializados

Antes de implementar una funcionalidad frontend compleja, identificar qué
conocimiento aplica (UI/UX, design systems, accesibilidad, responsive, SEO,
performance/Core Web Vitals, arquitectura de componentes, animación,
seguridad frontend, testing, optimización de imágenes, estado/datos, diseño
editorial) y usar las herramientas/skills realmente disponibles en el
entorno de desarrollo antes de improvisar una solución inferior. No inventar
herramientas que no existen.

### 43.4 Revisión visual obligatoria

Después de implementar una interfaz, antes de darla por terminada, responder:

```text
¿Parece un producto profesional?          ¿Los espacios/tipografía son correctos?
¿La jerarquía visual es clara?            ¿Los estados están contemplados?
¿El usuario sabe qué hacer de inmediato?  ¿Hay elementos innecesarios?
¿Funciona bien en móvil?                  ¿Carga rápido?
¿Es consistente con el sistema?           ¿La publicidad podría afectar la UX?
¿Es accesible?                            ¿Parece una plantilla genérica?
```

**Regla dura:** no terminar una funcionalidad frontend solo porque funciona
técnicamente. Debe funcionar y ofrecer una experiencia profesional. Si el
resultado es visualmente mediocre, no se considera terminado.

---

# 44. Modelo de negocio

> **El modelo de negocio está en validación, no decidido.** Esta sección
> documenta el marco de pensamiento e hipótesis de trabajo, no funcionalidades
> a construir. Ninguna cifra (precio, comisión, plan) es real: no se debe
> inventar ninguna. Cuando una tarea técnica dependa de una decisión de
> negocio no definida aquí, **señalarlo antes de implementar**, no asumir.

### 44.1 Qué es el negocio y qué no es

No es un blog ni un sitio de noticias: es una **plataforma de contenidos
digitales** que busca construir una audiencia propia y, sobre esa audiencia,
desarrollar múltiples fuentes de ingreso — validadas una por una, no todas
a la vez. Empieza local (Ayacucho/Perú) sin quedar limitada a eso ni a un
solo idioma/mercado.

```text
CREAR CONTENIDO → AUDIENCIA → TRÁFICO → RECURRENCIA → CONFIANZA → MONETIZACIÓN → CRECER
```

Principio rector: no optimizar para "máximo número de anuncios". Optimizar
primero calidad de contenido + experiencia de usuario + confianza +
audiencia; la monetización sostenible viene después. Una plataforma con
mucha publicidad pero sin usuarios recurrentes no es un buen negocio.

### 44.2 Problema y propuesta de valor

Problema del usuario: información local dispersa entre Facebook/TikTok/
YouTube/páginas sueltas; pueblos, comunidades y negocios locales con poca
documentación o presencia digital; contenido de lugares difícil de
encontrar y sin contexto.

La ventaja no puede ser solo "publicamos artículos" — tiene que validarse
como la combinación: **contenido + organización + descubrimiento + contexto
+ ubicación + multimedia**, todo relacionado entre sí (ver sección 2, el
diagrama Lugar→Historia→Artículo→Fotos→Video→Mapa→Relacionados).

### 44.3 Segmentos de clientes (dos lados del negocio)

```text
B2C — Audiencia                      B2B — Empresas/anunciantes
─────────────────────                ─────────────────────────
Lectores, turistas, estudiantes,     Negocios, restaurantes, hoteles,
familias, investigadores,            instituciones, anunciantes,
creadores/colaboradores              organizaciones, patrocinadores
```

Cada segmento puede tener necesidades y vías de monetización distintas —
no tratarlos como un único público homogéneo.

### 44.4 Competencia y diferenciación (hipótesis, no verdad asumida)

Competencia indirecta: medios digitales, blogs, Facebook, TikTok, YouTube,
Instagram, Google, directorios y plataformas turísticas. No es necesario
vencerlos directamente — se puede complementar unos canales y competir en
otros. Diferenciación hipotética a validar con usuarios reales: contenido
local profundo + historias reales + lugares + cultura + multimedia +
organización — **hipótesis, se valida con datos, no se da por cierta**.

### 44.5 Adquisición, retención y comunidad

```text
Adquisición   → SEO/Google, redes sociales, WhatsApp, recomendaciones,
                colaboradores, comunidades, eventos, contenido viral
Retención     → (futuro, no MVP) newsletter, notificaciones, seguir
                categorías/lugares, guardar contenido, favoritos
Comunidad     → (largo plazo) comentarios, aportes/correcciones de
                usuarios, fotos/historias enviadas por la comunidad
Colaboradores → flujo: colaborador externo → revisión → edición →
                publicación (permite escalar contenido sin que todo
                dependa del equipo interno — ver roles 36.1)
```

### 44.6 Estrategia de contenido y distribución

Un mismo contenido se adapta a varios formatos/canales sin asumir que debe
publicarse igual en todos:

```text
UNA HISTORIA → artículo → video YouTube → short → post social → galería
```

La web es el activo propio; redes sociales y YouTube son canales de
distribución/adquisición, nunca la base del negocio (ver 44.10).

### 44.7 Posibles fuentes de ingreso (catálogo de opciones, no roadmap fijo)

Ninguna de estas está confirmada para el MVP — se activan solo cuando los
datos muestran demanda real:

```text
1.  Publicidad digital (AdSense, programática)   8.  Suscripciones (futuro, no MVP)
2.  Publicidad directa a empresas                9.  Membresías (futuro, no MVP)
3.  Contenido patrocinado (marcado como tal)      10. Servicios (producción, marketing)
4.  Patrocinio de categoría/sección/evento        11. Eventos (entradas, patrocinio)
5.  Directorio empresarial (gratis→destacado→     12. Productos digitales (guías, ebooks)
    premium)                                      13. Marketplace (NO forma parte del MVP)
6.  Publicaciones destacadas
7.  Afiliados
```

Regla de diseño: el contenido editorial, el contenido patrocinado y la
publicidad deben distinguirse visualmente sin ambigüedad (ver 43.2).

### 44.8 Costos, métricas y economía unitaria

```text
Costos a considerar   → dominio, servidor, storage, CDN, APIs, herramientas
                         de IA, producción de contenido, equipos, edición,
                         publicidad, personal, mantenimiento, seguridad,
                         backups, impuestos, comisiones de pago
Unit economics         → CAC, LTV, ARPU, RPM, margen, conversión, retención
                         — solo con datos reales, nunca valores inventados
Métricas de tráfico     → usuarios, sesiones, páginas vistas, recurrencia,
                         fuente de tráfico, dispositivo, ubicación
Métricas de contenido   → más vistos, tiempo de interacción, búsquedas,
                         categorías con más tracción
Métricas de negocio     → ingresos, campañas, conversión de anunciantes,
                         costo de adquisición
Embudo (B2C)            → descubrimiento → visita → consumo → interacción
                         → retorno → conversión → ingreso
Embudo B2B              → conoce plataforma → ve audiencia → se registra →
                         crea perfil → contrata promoción → campaña → renueva
```

No confundir ingresos con ganancias. No medir solo "seguidores".

### 44.9 Riesgos del negocio a vigilar

Dependencia de redes sociales y sus cambios de algoritmo/política; baja
audiencia; contenido de baja calidad; derechos de autor; desinformación;
daño reputacional; exceso de publicidad degradando UX; costos de
infraestructura; dependencia de proveedores externos; dificultad de
monetizar en etapas tempranas.

### 44.10 Propiedad intelectual y confianza

No copiar artículos, fotos ni videos de terceros sin autorización. Debe
existir (progresivamente) estrategia de: derechos de autor y atribución,
licencias, manejo de contenido enviado por usuarios, proceso de retiro de
contenido ante reclamos. Credibilidad por encima de clics: fuentes,
correcciones visibles, fecha de actualización, marcado claro de contenido
patrocinado, política editorial, política de privacidad, términos de uso,
política de cookies cuando aplique (ver también sección 35.2, marco legal).

No depender completamente de Facebook/TikTok/YouTube/Google: son canales de
adquisición, la plataforma propia es el activo del negocio.

### 44.11 Validación (Lean Startup) y qué debe demostrar el MVP

```text
CREAR → MEDIR → APRENDER → ITERAR
```

Antes de construir una funcionalidad comercial grande, responder: ¿qué
problema resuelve?, ¿para quién?, ¿qué valor genera?, ¿cómo se mide?,
¿tiene potencial real de ingreso?, ¿hace falta ahora? Si la respuesta no
está definida, señalarlo en vez de decidir por cuenta propia.

El MVP debe demostrar: se puede producir contenido, las personas lo
consumen, se puede atraer tráfico, las personas regresan, se puede medir
el comportamiento, y existe una oportunidad real (no garantizada) de
monetización. No se construye el ecosistema comercial completo de una vez.

### 44.12 Roadmap de negocio (hipótesis de fases, se ajusta con datos)

```text
Fase 1  → Plataforma + contenido + SEO + redes sociales + audiencia + analítica
Fase 2  → Optimización de contenido, crecimiento de tráfico, AdSense,
          YouTube, primeros anunciantes
Fase 3  → Publicidad directa, contenido patrocinado, directorio,
          publicaciones destacadas
Fase 4  → Servicios premium, afiliados, suscripciones/membresías si hay
          demanda validada
Fase 5  → Nuevas líneas de negocio, marketplace u otros, solo si hay
          oportunidad validada con datos
```

Estas fases no son compromisos: cambian según lo que midan las fases 44.8.

### 44.13 Marca y regla para decisiones técnicas con implicación comercial

El modelo de negocio es independiente del nombre de marca (ver sección 14):
ninguna decisión de negocio se ata a "NewFlash", "Ayacucho NewsFlash",
"DARREV" ni ningún nombre provisional.

**Regla operativa:** cuando una funcionalidad tenga implicación comercial
(precios, comisiones, planes, categorías de anunciante, límites de
suscripción, etc.), no asumir el comportamiento. Antes de implementar,
identificar: qué problema de negocio resuelve, quién la usa, cómo genera
valor, cómo podría generar ingreso, qué métrica evalúa su éxito, qué costo
técnico tiene, y si de verdad pertenece al MVP. Si algo de eso no está
definido, decirlo explícitamente antes de tomar una decisión de diseño.

### 44.14 Objetivo final

Construir progresivamente un activo digital que acumule contenido,
audiencia, datos y relaciones con empresas y distribución — no solo
"artículos que generan clics". Evolución esperada (no garantizada):

```text
Plataforma de contenidos → audiencia → comunidad → empresas → publicidad
→ servicios → nuevos productos
```

Cada etapa se valida con datos antes de construir la siguiente. El software
debe permitir que el negocio evolucione sin reconstruir la plataforma cada
vez que aparezca una nueva oportunidad comercial (coherente con la
modularidad de la sección 38).

---

# 45. Algoritmos de contenido y pendientes (estado al 2026-10-04)

Referencias analizadas renderizando sus portadas: AliExpress, Amazon, MSN,
Substack, Hashnode. Reddit bloqueó el navegador automatizado; de Reddit solo
se usa su algoritmo público (código abierto 2008-2017). No hay cuentas de
lectores: ningún algoritmo puede depender de un perfil de usuario en el
servidor. Regla general: **solo señales reales** (fechas, me gusta, categorías)
— nunca rellenar listas "populares" con contenido sin esa señal.

## 45.1 Lo que ya funciona

| Pieza | Dónde | Cómo ordena |
|---|---|---|
| Feed del home ("Todo" + pestañas por tipo) | `FeedService.diversify` | `0.55·frescura + 0.20·popularidad + 0.25·variación`. Frescura = `1/(1+días)`; popularidad = `likes/(likes+10)` (satura, un ítem viral no tapa todo); variación = jitter determinista por semilla **horaria** (todos ven el mismo orden dentro de la hora → la portada es cacheable). Reparto round-robin por categoría (dos seguidos casi nunca del mismo tema). Excluye lo ya visto en el scroll. |
| Relacionados del detalle | `FeedService.getRelated` + `getRelatedWithFallback` | Misma categoría: `frescura + 0.3·log1p(likes)`; se completa con el feed general hasta 6, sin repetir. |
| "Lo más gustado" | `FeedService.getTopLiked` | Me gusta acumulados, desc. Solo contenido con ≥1 me gusta; la lista solo se muestra con ≥3. |
| Búsqueda | `SearchService` | `tsvector` español sin acentos por módulo **+** contenido de las categorías cuyo nombre coincide (y sus subcategorías). Fusión por fecha. Con <4 resultados: temas parecidos + lo más reciente. |
| Anuncios en el feed | `InfiniteFeed` | Posición `en-feed` (300×250, ocupa una tarjeta; fila entera en celular) cada 8 celdas de grilla desde la 16: 1 anuncio cada 6 tarjetas, ~14 % de la grilla (tope Better Ads: 30 %). |
| Entrega de publicidad directa | ver 45.4 | Selección ponderada, sin repetir campaña ni anunciante en la página, tope de frecuencia, impresión visible, clic válido. |
| Atajo de búsqueda | `SearchBox` + `lib/search-shortcut.ts` | Ctrl+K / ⌘K siempre; "/" solo fuera de campos de texto (no roba la barra al escribir). Solo el buscador de escritorio lo registra; pista "Ctrl K"/"⌘K" en el campo, oculta al enfocar o escribir. |

## 45.2 Planeado — con condición de activación

Cada uno se activa cuando existe el dato que lo hace útil; antes sería
complejidad sin efecto visible.

**A. "En tendencia" (reemplaza "Lo más gustado") — fórmula "hot" de Reddit adaptada.**
```text
puntaje = log10(max(likes, 1)) + (publicado_en_segundos − T0) / 45000
```
45000 s = 12,5 h: multiplicar por 10 los me gusta equivale a ser 12,5 h más
nuevo. Lo popular sube, pero lo viejo baja solo (el acumulado actual dejaría
un contenido viejo arriba para siempre). Sin votos negativos (sin cuentas se
usarían para hundir contenido). Cambio acotado a `FeedService.getTopLiked`.
**Activar:** cuando ≥20 contenidos tengan al menos 1 me gusta.

**B. "Temas de la semana" (los "Trending tags" de Hashnode).**
```text
actividad(tema) = publicados_7d + 0.5 · me_gusta_7d
```
`engagement.content_likes.created_at` ya guarda la fecha de cada me gusta;
publicados_7d sale de `publishedAt`. Ordena "Explorar por tema" de la barra
lateral y la franja de temas en vez del `sortOrder` fijo; desempate por
`sortOrder`. **Activar:** cuando se publique contenido cada semana.

**C. Atajo de teclado para buscar (Ctrl+K y "/").** Hecho el 2026-10-05 —
ver tabla 45.1.

**D. "Para ti" sin cuentas.** Pesos por categoría guardados en el navegador
(categorías abiertas), enviados como parámetro opcional al feed; requiere
consentimiento en el aviso de cookies (Europa). **Activar:** con >300
contenidos y visitantes recurrentes medidos (hoy ~2,4 contenidos por tema:
personalizar no cambiaría nada).

**E. Relacionados "quien vio esto también vio" (Amazon, item a item).**
Requiere registrar visitas por sesión; hoy no hay analítica propia.
**Activar:** después de tener analítica de páginas vistas.

**F. Puntaje de Wilson (Reddit "best").** Solo tiene sentido con votos
positivos Y negativos o comentarios; no previsto.

## 45.4 Publicidad directa — cómo se entrega (2026-10-05)

Criterio de los ad servers profesionales (Google Ad Manager, normas IAB/MRC
y Coalition for Better Ads), sin cookies ni cuentas:

| Regla | Dónde | Detalle |
|---|---|---|
| Medida estándar por posición | `ad_placements.width/height` (V46) | 300×250 (feed, lateral, contenido), 728×90 (cabecera de listados, solo escritorio), 320×50 (barra fija). El anunciante entrega su banner diseñado a esa medida (mejor al doble) y se muestra **entero** (`object-contain`), con "Publicidad" fuera de la imagen. El backend rechaza imágenes subidas con otra proporción o más chicas; el panel avisa también para enlaces externos. |
| Selección ponderada | `WeightedOrder` (Efraimidis–Spirakis) | `clave = −ln(u) / peso`, orden ascendente. Peso 1–10 por campaña (5 por defecto): peso 10 sale primero el doble que peso 5, sin dejar a nadie sin vistas. |
| Sin repetir en la página | `page-ad-plan.ts` | Cada espacio toma la primera campaña de la rotación que no esté ya en la página y, si se puede, de otro anunciante. Sobrantes → AdSense o vacío. |
| Tope de frecuencia | `AdDeliveryGuard` (Redis) | Máximo 6 vistas por persona, campaña y día (UTC); luego deja de ofrecérsele. Persona = hash de la IP, vive horas en Redis, nunca en la base. **En local todas las visitas comparten la IP del contenedor de Next: tras 6 vistas propias la campaña desaparece hasta el día siguiente** (borrar `ads:*` en Redis para probar). |
| Impresión visible | `useViewableImpression` | Se cuenta cuando ≥50 % del anuncio estuvo 1 s seguido en pantalla (pestaña visible), vía `sendBeacon` a `/api/ads/impression`. Pedir la campaña ya no cuenta. |
| Tráfico inválido | `InvalidTraffic` | Robots, previsualizadores (WhatsApp, Facebook), scripts y pedidos sin user agent no cuentan impresión ni clic. |
| Antiduplicado | `AdDeliveryGuard` | Impresión: misma persona y campaña, 1 cada 10 s. Clic: 1 cada 30 min (el visitante igual llega al destino). |
| Conteo atómico | `CampaignRepository` / `campaign_daily_stats` | `UPDATE … + 1` y upsert por día: vistas simultáneas no se pierden. |
| Segmentación | `CampaignTargeting` (V47) | Por sección (Inicio, Publicaciones, Lugares, Eventos, Galerías, Directorio), por tema (incluye subtemas) y por país/región **del visitante** (cabeceras de Cloudflare `cf-ipcountry`, `cf-region`, `cf-region-code`; requiere "Add visitor location headers", ver DESPLIEGUE §3). Vacío = sin restricción. En una página, las campañas que calzan con más dimensiones van antes que las generales. No usa la geografía del contenido (dada de baja en V38). |
| Cupo por público | `CampaignService.MAX_COMPETING_CAMPAIGNS` = 5 | Como máximo 5 campañas activas compitiendo por el mismo público: misma posición, segmentación que se cruza en todas las dimensiones (temas: igual o uno contiene al otro) y fechas superpuestas. La sexta da 409 con explicación. Así cada anunciante recibe vistas suficientes. Más campañas nunca agregan anuncios a la página: los espacios son fijos, solo se turnan. |
| Prioridad frente a AdSense | `AdBlockClient` | Lo vendido directo ocupa solo su espacio y su público; todo lo demás lo llena AdSense (prioridad del negocio mientras el sitio no tiene anunciantes propios). |
| Presentación por contexto | `AdBlock layout` | `fill`: ocupa el ancho de la columna (lateral, celda del feed), hasta 1,3× su medida. `band`: bloque a todo el ancho **sin marco ni fondo** (el contorno con relleno se veía poco profesional, 2026-10-06). `band` + `count`: "fila patrocinada" de hasta 3 campañas distintas (final de listados) o 2 (final del artículo); con una sola disponible queda centrada; en celular siempre una. Nada de franjas vacías a los costados. |
| Barra fija | `AnchorAdSlot` | Aparece recién después de responder el aviso de cookies (antes quedaba tapada y contaba vistas que nadie veía). |
| Reporte | Panel → Anunciantes → campaña | Impresiones visibles, clics, % de clics y gráfico diario de 30 días (UTC). |

**Con AdSense:** Google permite anuncios vendidos directamente en las
mismas páginas siempre que no imiten a los de Google (por eso: etiqueta
"Publicidad" propia, sin "Anuncios de Google", creatividades del
anunciante). En páginas con AdSense, lo que promocionen las campañas
directas también debe cumplir las políticas de Google (nada de apuestas,
contenido adulto, armas, etc.). Si se vende la barra fija (`anchor`),
desactivar los "anuncios fijos" (anchor) en los Auto ads de AdSense para no
tener dos barras abajo.

Los totales `impression_count` de antes del 2026-10-05 se contaban al pedir
la campaña (inflados); desde esta fecha son vistas reales.

## 45.3 Pendientes que no son algoritmos

Del usuario (configuración, no código):
- Cloudflare: activar "Add visitor location headers" (segmentación de
  publicidad por país/región).
- Cloudflare (reglas de caché), swap, firewall y copia de backups a R2: ver
  `infra/DESPLIEGUE.md`.
- Configuración del panel: correo de contacto (activa "Proponer contenido" y
  `/contacto`), descripción del sitio (hoy dice "Sistema de gestión…"),
  descripción de la categoría Turismo (repite el nombre), slot de AdSense
  para la posición `en-feed`.

Decididos para más adelante:
- Módulo "Páginas" editable para textos legales: no por ahora — las páginas
  legales se adaptan solas a la configuración (p. ej. AdSense activado) y
  cambian poco.
- Selector de país/ciudad (Geografía) como "Enviar a Perú" de Amazon:
  cuando haya suficiente contenido por zona.

---

# 46. Rediseño estilo red social — estado y pendientes (pausa del 2026-10-06)

Documento para retomar sin depender del chat. Diseño acordado con el dueño:
el sitio y el panel dejan de verse "como un diario/editorial" y pasan a
sentirse como una **red social moderna (referencia Instagram, también
Facebook y X)**, pensada para 2027, intuitiva e interactiva. Solo publican
el dueño y sus trabajadores; los visitantes miran, dan "me gusta",
comparten y exploran (sin cuentas, sin comentarios, sin firma de autor).

Archivos de trabajo (locales, `docs/` está en `.gitignore`):
- Diseño: `docs/superpowers/specs/2026-10-06-sitio-publico-estilo-instagram-design.md`
- Plan por sprints/tareas: `docs/superpowers/plans/2026-10-06-sitio-publico-estilo-instagram.md`
- Registro de avance y decisiones ("Ruling"): `.superpowers/sdd/2026-10-06-sitio-publico-estilo-instagram/progress.md`

## 46.1 Estado de git al pausar

- **Rama de trabajo: `feat/sitio-red-social`** (sale de `main` en `d3a415e`).
  9 commits, todos con tests en verde. **No está fusionada a `main`.**
- **`main` tiene 4 commits sin subir a GitHub** (publicidad profesional):
  `a717f10`, `6cae3ca`, `b727913`, `d3a415e`. Preguntar al dueño antes de
  `git push`.
- Docker local corre la rama (backend + frontend reconstruidos el 2026-10-06).
- Al retomar: `git switch feat/sitio-red-social` y leer el registro de avance.

## 46.2 Hecho en la rama (Sprint 1 completo + parte del 2)

| Tarea | Qué quedó |
|---|---|
| 1 | Feed del backend con los 5 tipos (galerías y directorio incluidos), filtro por tema con subtemas (`categoryId`), Agenda (`type=EVENT&sort=upcoming`), datos de tarjeta: carrusel (`images`, hasta 10), `startsAt`, `latitude/longitude`, `phone`, `website`. |
| 2 | `GET /api/v1/feed/topics`: círculos de temas raíz con portada automática y `hasNew` (48 h), orden por actividad de la semana (`publicados_7d + 0.5·me_gusta_7d`). |
| 3 | Tipos/mapeo/proxy del frontend (`HomeItem.images`, tipo `directorio`). |
| 4 | Navegación tipo app: barra de pestañas abajo en celular (Inicio · Explorar · Buscar · Agenda · Más), riel izquierdo en escritorio, variable CSS `--bottom-bar-h` (anuncio fijo y aviso de cookies se apilan encima). Íconos **Phosphor** (contorno / relleno activo). |
| 5 | `PostCard`: encabezado de marca, imagen cuadrada 1:1 con carrusel, doble toque = me gusta, acciones por tipo (Agendar, Cómo llegar, Llamar, Sitio web), sin antetítulos. |
| 5b | Buscador moderno sin desplegable "Buscar en"; `/buscar` con chips de tipo y de tema y campo propio en celular. |
| 6 | Inicio = feed de una columna + círculos de temas + chips de tipo + columna derecha (≥1280 px: próximos eventos, lo más gustado, anuncio). Riel con secciones y temas (5 + "Ver más"), sin línea al costado. Franja superior: título de la pantalla + flecha "volver" + buscador (estilo X). Sin barras de desplazamiento visibles (utilidad `.no-scrollbar`) y flechas ‹ › en los círculos. |
| 7 (parcial) | Componentes listos y testeados pero **todavía no usados por las páginas**: `PostView` (variante `visual` y `text`), `GridTile`, `PostHeader` reutilizable. |

## 46.3 Pendiente — en este orden

### A. Tarea 6b — Riel interactivo como redes sociales (pedido explícito, siguiente)
1. **"Buscar" del riel abre un panel lateral** (Radix Dialog, como Instagram desktop): foco en el campo, `Esc` cierra, reutiliza `SearchBox`. En celular la pestaña sigue yendo a `/buscar`.
2. **"Más" abre un menú** (Radix Popover, como Instagram/X) con:
   - **Apariencia**: Sistema / Claro / Oscuro, por visitante → `localStorage["theme-pref"]` + `data-theme` en `<html>`. Para que no parpadee, script en línea en `<head>` de `app/layout.tsx` (CSP ya permite `'unsafe-inline'`) y `suppressHydrationWarning` en `<html>`. Si no eligió nada, manda la configuración del panel (`settings.theme`).
   - Contacto, Privacidad, Términos (reemplaza los enlaces sueltos del pie del riel).
3. **Contador en Agenda**: cantidad de eventos de los próximos 7 días (dato del servidor, sin guardar nada).
4. **Microinteracciones**: hover con fondo de "píldora" e ícono 1.05 (solo `motion-safe`), presión 0.95, tooltips en el modo solo íconos (1024–1279 px).
5. Tests: `rail-interactions.test.tsx` (panel de búsqueda con foco, menú con radios de apariencia y `data-theme="dark"` guardado, contador "3 eventos esta semana"). Verificar en Docker con capturas.

### B. Tarea 7 — Conectar `PostView` a las 5 páginas de detalle
En `app/(public)/{publicaciones,lugares,eventos,galerias,directorio}/[slug]/page.tsx`:
- **Mantener**: `generateMetadata`, todos los JSON-LD (incluido `BreadcrumbList`), `VideoJsonLd`, `notFound`.
- **Quitar**: `<nav aria-label="Breadcrumb">`, antetítulo en mayúsculas, "min de lectura" (`estimateReadingTime`), `ReadingProgressBar`, entradilla en negrita, `NeighborNav` ("Seguir leyendo"), `DetailSidebar` y las listas "Otras galerías / Lugares en… / Más de…" de galerías.
- `variant`: `text` para publicaciones; `visual` para el resto.
- `media`: `ContentImageGallery` + `ContentVideoGallery` existentes.
- `facts` por tipo: **evento** (fecha y hora absolutas, lugar con enlace, "Agendar": Google + `.ics` con `calendarLinks`), **lugar** (mapa embebido + "Cómo llegar" `mapsDirections`), **directorio** (dirección, teléfono `tel:`, email, web + "Cómo llegar"), publicación y galería sin facts.
- `actions`: `LikeShareBar` (reestilizar como barra de post: corazón Phosphor, compartir).
- `ad`: `AdBlock position="article" layout="band" count={2}` con su `section`/`categoryId`.
- `more`: `getRelatedWithFallback` → `fromFeedItem` (hasta 9 miniaturas).
- Test e2e `frontend/tests/e2e/seo-urls.spec.ts`: cada detalle conserva `<title>`, canonical y JSON-LD con `BreadcrumbList`. Verificar los 5 tipos en Docker a 390/1366.

### C. Tarea 8 — Explorar y resultados de búsqueda en cuadrícula
- Página nueva `/explorar` (hoy da 404): `ExploreGrid` (cliente, scroll infinito con `/api/feed`, chips de tipo) usando `GridTile`; metadatos propios.
- `/buscar`: reemplazar `SearchResultCard` (todavía con antetítulo "ACTUALIDAD") por `GridTile` en cuadrícula de 3.

### D. Tarea 9 — Secciones y temas = feed filtrado
- `/publicaciones`, `/lugares`, `/galerias`, `/directorio`: `TopicStories` + `FilterChips` (tipo activo) + `Feed filter={{type}}`; sin `ListingHeader` ni `FilterMenu` ("Filtrar por tema").
- `/eventos` = **Agenda**: `Feed filter={{type:"EVENT", sort:"upcoming"}}`.
- `/categorias/[slug]`: `Feed filter={{categoryId}}` con su círculo activo.
- SEO: cada URL conserva título/descripción/canonical y enlaces `?page=` en el HTML inicial para bots.
- Quitar `AdBlock position="cabecera"` (la franja 728×90 se deja de mostrar).

### E. Tarea 10 — Anuncio "Patrocinado" con forma de post
`SponsoredPost` envuelve `AdBlockClient position="en-feed"` con encabezado "Patrocinado" (sin marco de color). 1 cada 6 posts. Nada si no hay campaña ni AdSense.

### F. Tarea 11 — Limpieza y guardia anti-diario
- Borrar (verificar con `grep` que no tengan usos): `home/hero-rotator`, `home/module-strip`, `home/category-showcase`, `home/content-card`, `home/infinite-feed`, `home/home-sidebar`, `layout/listing-header`, `layout/mobile-nav`, `layout/category-menu`, `layout/nav-link`, `layout/site-footer`, `content/detail-sidebar`, `content/card-actions`, `filters/filter-menu`, `ReadingProgressBar`, `NeighborNav`, `SearchResultCard`.
- Test e2e `no-editorial-patterns.spec.ts`: recorre todas las URLs públicas y falla con "min de lectura", "cubrimos", "editorial", ruta visible o antetítulos en mayúsculas.
- Lighthouse en inicio y un detalle (LCP < 2,5 s, CLS < 0,1, INP < 200 ms). Actualizar §43 y §45.

### G. Sprint 5 — Algoritmos de red social (pedido explícito)
12. Velocidad de interacción con decaimiento (Hacker News) en el puntaje del feed.
13. "En tendencia" (Reddit hot) con activación a ≥ 20 contenidos con me gusta; antes "Lo más gustado".
14. "Más como esto" por similitud (tema, subtema, tipo, Jaccard de palabras del título/bajada).
15. "Para ti" en el navegador **solo con consentimiento de cookies** (afinidad por tema, nada sale del navegador).
16. Visitas anónimas + "quienes vieron esto también vieron" (co-visitas ≥ 5; robots fuera; sin datos personales).
Detalle de cada uno en el plan.

### H. Cierre del proyecto 1
Revisión completa de la rama con un revisor nuevo (code review), corregir lo crítico, **preguntar al dueño** y fusionar `feat/sitio-red-social` → `main`; subir a GitHub con su permiso.

### I. Proyecto 2 — Panel de administración moderno + trabajadores
Acordado con el dueño ("todas las páginas del panel se ven antiguas, estilo editorial"):
1. **Primero**: crear una cuenta de prueba **solo en la base local** (aprobado: opción A), recorrer y capturar todas las pantallas del panel, y **borrarla al terminar**.
2. Rediseño moderno e intuitivo de todo el panel (mismo lenguaje visual del sitio, íconos Phosphor, sin desplegables anticuados, sin vacíos ni líneas sobrantes).
3. **Trabajadores con módulos asignados** (diseño aprobado):
   - **Dueño** (SUPER_ADMIN): todo; exclusivos: Usuarios, Configuración, Auditoría.
   - **Trabajador**: módulos que asigna el dueño. Siempre tiene: Inicio del panel, Imágenes, Mi cuenta.
   - Módulos de contenido (Publicaciones, Lugares, Eventos, Galerías, Directorio) con nivel **Crear** (solo lo suyo, pasa a revisión) o **Publicar** (revisa y publica lo de todos); Categorías, Estadísticas y Publicidad: acceso sí/no.
   - **Plantillas**: Creador, Publicador, Gestor de eventos, Gestor de directorio, Publicidad.
   - Migración: el ADMIN actual → trabajador con "Publicador" + Publicidad; se eliminan MODERATOR, COLLABORATOR, USER.
   - Permisos aplicados **en el servidor** (no solo ocultar botones) y auditados.
4. Documento de diseño + plan antes de programar (mismo proceso que el proyecto 1).
5. **2026-10-06:** se divide en **2a (trabajadores y permisos, primero)** y **2b (rediseño visual del panel)**. Spec de 2a: `docs/superpowers/specs/2026-10-06-trabajadores-y-permisos-design.md` (local). Decisiones: roles DUEÑO/TRABAJADOR + tabla `identity.worker_permissions` verificada en cada petición (revocación inmediata), contraseña temporal con cambio obligatorio, desactivar en vez de borrar, sin MFA.

## 46.4 Reglas aprendidas (aplican a todo lo pendiente)

- El dueño revisa con capturas en **Edge**; quiere: nada de vacíos, nada de líneas sobrantes (bordes, barras de desplazamiento visibles), nada que "parezca diario", interacciones como Instagram/Facebook/X, íconos modernos (Phosphor), estándares (WCAG 2.2 AA, Core Web Vitals, SEO, OWASP), metodología Scrum + XP (§41) y verificación en ciclos con Playwright.
- **Reglas CSS globales sin capa** (`:focus-visible`, `* { scrollbar-width }`) le ganan a las clases de Tailwind (en capa): usar utilidades **sin capa** en `globals.css` (como `.no-scrollbar`) o `!`.
- Cuando cambia un contrato de la API, **reconstruir backend y frontend juntos** en Docker (`docker compose build backend frontend && docker compose up -d`): un backend viejo rompió el build del inicio.
- Publicidad en local: todas las visitas comparten la IP del contenedor de Next → el tope de 6 vistas/día oculta campañas; borrar `ads:*` en Redis (clave en `infra/.env`). Los banners de demostración solo existen en la base local.
- Fechas: eventos/lugares absolutas; publicaciones relativas. Nunca "editorial"/"artículo(s)" en textos visibles.

## 46.5 Pendientes del dueño (configuración, no código)

- Cloudflare: activar "Add visitor location headers" (segmentación de publicidad por país/región) y las reglas de caché (`infra/DESPLIEGUE.md` §3).
- AdSense: si se vende la barra fija, desactivar los anuncios fijos (anchor) de Auto ads.
- Panel → Configuración: correo de contacto, descripción del sitio (dice "Sistema de gestión…"), descripción de Turismo, slot de AdSense en-feed.
- Backups: copia a R2; **corregir `scripts/backup.sh`**: (1) la retención de 14 días borraría el único backup viejo, (2) no respalda las imágenes reales (están en el volumen Docker `media_data`, no en `backend/data/media`).

## 46.6 Inventario de páginas — qué falta transformar

Estado en la rama `feat/sitio-red-social` al 2026-10-06. ✅ hecho · ⚠️ parcial · ❌ falta.

### Sitio público (17 páginas) — actualizado 2026-10-06 (sesión 2)

| Página | Estado | Nota |
|---|---|---|
| `/` Inicio | ✅ | `FeedScreen` + anuncio «Patrocinado» con forma de post. |
| `/buscar` | ✅ | Resultados y sugerencias en cuadrícula `GridTile`. |
| `/explorar` | ✅ | Cuadrícula de 3 con chips `?tipo=` y scroll infinito. |
| `/publicaciones` `/lugares` `/galerias` `/directorio` | ✅ | Feed filtrado por tipo (`FeedScreen`); `?page=` viejos responden 200 con canonical a la sección. |
| `/eventos` | ✅ | **Agenda**: próximos por fecha. |
| `/categorias/[slug]` | ✅ | Feed del tema, encabezado con nombre y descripción, círculo activo. |
| 5 detalles `[slug]` | ✅ | `PostView` + `PostFacts` + barra de post + «Más como esto» (9). JSON-LD intacto. |
| `/contacto` `/privacidad` `/terminos` | ✅ | Pantalla de app: chips de secciones, texto en superficie blanca. |
| `not-found` (404) y `error` | ✅ | Pantalla de app con Phosphor e Inicio / Explorar / Buscar. |
| `loading.tsx` | ✅ | Esqueletos de feed, post y cuadrícula. El `app/loading.tsx` raíz se borró el 2026-10-16: envolvía todo el sitio público en un segmento de streaming y retrasaba el LCP; el panel tiene el suyo. |

### Panel de administración (34 páginas) — todo ❌, proyecto 2 (46.3-I)

| Módulo | Páginas |
|---|---|
| Acceso | `login` |
| Inicio y Estadísticas | `/admin`, `/admin/estadisticas` |
| Contenido (listado, nuevo, editar) | Publicaciones, Lugares, Eventos, Galerías, Directorio (3 páginas c/u = 15) |
| Organización | Categorías (3), Medios (1) |
| Monetización | Publicidad/posiciones (3), Anunciantes (3) + campañas (2) |
| Administración | Usuarios (2) → pasa a **Trabajadores**, Configuración, Auditoría |
| **Nuevas** | **Trabajadores**: permisos por módulo y plantillas; **Mi cuenta**: cambiar contraseña (hoy no hay una página propia). |

## 46.6b Avance 2026-10-06 (sesión 2) — commits en `feat/sitio-red-social`

- `76213b2`, `f2c3be9`: riel estilo Facebook/Instagram (secciones con círculos de color, temas con anillo de historia y «Novedades», enlaces legales a la vista, sin el «Más» de rayitas), panel de búsqueda lateral, contador de Agenda, columna derecha pegada al borde, lienzo claro `#f0f2f5` (gris de Facebook, contraste AA). **Sin selector de apariencia**: claro/oscuro según el dispositivo — el panel debe estar en Configuración → Apariencia → «Sistema».
- `abab37b`: `/explorar` y búsqueda en cuadrícula.
- `f88ea5d`: los 5 detalles como post; se retiró el endpoint `/articles/{slug}/neighbors` (sin consumidores).
- `d32b169`: `FeedScreen` para inicio/secciones/Agenda/temas; **knip** (`npm run lint:unused`, también en CI) — 23 archivos huérfanos borrados.
- `964f962`, `a3408a4`: anuncio «Patrocinado» con forma de post.
- `d8a60f9`: carga, 404, error y páginas de información con forma de app; e2e `no-editorial-patterns.spec.ts` y `seo-urls.spec.ts`.
- Seguridad: test `json-ld-escape.test.ts` exige el escape de `<` en todo JSON-LD (se detectó y corrigió una regresión al reescribir Eventos).

**Pendiente del proyecto 1:** verificación en Docker/Edge de todo lo anterior (los builds dependen de la memoria libre del equipo), Lighthouse (LCP/CLS/INP), Sprint 5 (algoritmos, 46.3-G), revisión completa de la rama y fusión a `main` con permiso del dueño.

## 46.6c Marco de trabajo — ITIL 4, COBIT 2019 e ISO aplicados (sin burocracia)

Cada tarea es un ciclo corto (PDCA de ISO 9001): **planificar** (brief del plan) → **hacer** (test que falla primero, luego código) → **verificar** (suite completa + Docker/Edge) → **actuar** (registro en el ledger y en este documento).

| Marco | Práctica / objetivo | Cómo se cumple aquí |
|---|---|---|
| ITIL 4 | Habilitación del cambio | Rama propia, commits pequeños con tests en verde, fusión a `main` solo con permiso del dueño. |
| ITIL 4 | Gestión de liberaciones y despliegue | Build y verificación en Docker antes de mostrar; `infra/DESPLIEGUE.md` para el VPS. |
| ITIL 4 | Gestión de problemas | Causa raíz anotada en el ledger (`Fix: … causa raíz …`) con test de regresión. |
| COBIT 2019 | BAI03 (soluciones), BAI06 (cambios), BAI07 (aceptación) | Plan con criterios de aceptación por tarea; CI (lint, knip, tipos, tests, build); revisión del dueño con capturas. |
| COBIT 2019 | MEA01 (monitoreo del desempeño) | Core Web Vitals (Lighthouse), métricas del panel, auditoría. |
| ISO/IEC 25010 | Calidad del producto | Definición de "hecho": funcional, usable (WCAG 2.2 AA), eficiente (CWV), mantenible (cero huérfanos con knip), seguro. |
| ISO/IEC 27001 (A.8.25–A.8.29) | Desarrollo seguro | OWASP (escape de JSON-LD, HTML saneado en backend, CSP), `npm audit` en CI, CodeQL. |
| WCAG 2.2 AA | Accesibilidad | `vitest-axe` en componentes, objetivos táctiles ≥ 44 px, foco visible, contraste verificado. |

## 46.6d Sprint de calidad (2026-10-06) — seguridad, observabilidad y datos personales

Pedido del dueño: software seguro, mantenible, medible y que no sature el VPS (bots, memoria).

| Tema | Hecho |
|---|---|
| Dependencias | Next.js 16.3.3 → **16.3.8** (vulnerabilidad crítica); `npm audit --audit-level=high` del CI vuelve a pasar. Quedan 2 moderadas de `@tailwindcss/typography` (solo al compilar CSS propio) aceptadas como riesgo bajo. |
| Logs | `RequestIdFilter`: id por petición en cada línea de log y en la cabecera `X-Request-Id` (nginx manda su `$request_id`; ids inseguros se descartan → sin falsificación de logs). Docker/VPS: **JSON ECS**. Rotación 10 MB × 5 por servicio. |
| Auditoría | `AdminActionAuditInterceptor`: **toda** acción del panel que modifica algo queda registrada (quién, método+ruta, recurso, IP, resultado). Los 5 tipos de contenido, login, usuarios, configuración e imágenes ya tenían eventos propios; el hueco real eran **categorías y publicidad** (anunciantes, campañas, posiciones) y cualquier endpoint futuro. Sin duplicados con los eventos propios. |
| Retención (Ley 29733) | `AuditRetentionJob` purga a diario la auditoría con más de `AUDIT_RETENTION_DAYS` (365) y deja constancia. |
| VPS / bots | nginx: tiempos cortos (slowloris), 30 conexiones simultáneas por IP, `server_tokens off`, escáneres (`wp-*`, `.php`, `.env`, `.git`) cortados con 444. Ya existían: límite de peticiones por IP, micro-caché, topes de memoria por contenedor, JVM al 70 %, Redis `maxmemory`, límite de intentos de login y de subidas. |
| Orden del código | knip en CI (cero archivos/exportaciones sin uso); carpeta `public` versionada (el build en un clon limpio fallaba). |
| MFA | **No se reactiva** (decisión del dueño, 2026-10-06): riesgo aceptado, compensado con límite de intentos de login y auditoría de accesos. |

**Inventario de datos personales (Ley 29733):**

| Dato | Dónde | Retención |
|---|---|---|
| Correo, nombre y contraseña (hash) del personal | `identity.users` | Mientras exista la cuenta |
| Correo e IP de quien actúa en el panel | `audit.audit_log` | 365 días (`AUDIT_RETENTION_DAYS`) |
| «Me gusta» | `engagement.content_likes` — UUID aleatorio del navegador, sin datos personales | Indefinida (no identifica) |
| Frecuencia de anuncios | Redis — hash de la IP | 26 h |
| Intentos de login | Redis | Ventana de 15 min |
| Logs de contenedores (IP en nginx) | Archivos JSON rotados | 50 MB por servicio |

Barrido de código muerto del backend: 3 métodos sin uso borrados (`dae0306`); el resto eran falsos positivos (records, `@Scheduled`, getters JPA).

**Lighthouse (2026-10-06, perfil móvil, Docker local, equipo con poca memoria → rendimiento pesimista):**

| Pantalla | Rend. | Accesib. | B. prácticas | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Inicio | 57 | 96 | 100 | 100 | 8,3 s | 0 | 722 ms |
| Explorar | 79 | 100 | 100 | 100 | 3,9 s | 0 | 310 ms |
| Lugares | 71 | 96 | 96 | 100 | 5,4 s | 0 | 376 ms |
| Detalle evento | 74 | 100 | 100 | 100 | 5,6 s | 0 | 243 ms |

Corregido a partir de la medición: (1) **bug real** — imágenes con 500 en `/_next/image`: las páginas prerenderizadas en el build de Docker quedaban con `localhost:8080`; `serverImageUrl` ahora usa `RUNTIME_BACKEND_INTERNAL_URL`; (2) WCAG 2.5.3: el nombre de «me gusta» incluye el número visible; (3) WCAG 2.5.8: puntos del carrusel con área de toque de 24 px; (4) `fetchpriority="high"` en la foto principal aunque sea un enlace externo. `lighthouserc.js` pasa a perfil móvil con las pantallas nuevas.

Pendiente: el LCP alto se debe en gran parte a las fotos de demostración de `picsum.photos` (JPG de 1400 px por enlace externo, sin optimizar); el contenido real subido por el panel pasa por el optimizador. Volver a medir con contenido real y en el VPS. TBT: un paquete JS de ~1,7 s de ejecución en CPU lenta → analizar el bundle (`next build` con análisis) antes del lanzamiento.

## 46.6e Proyecto 2a — Trabajadores y permisos (rama `feat/trabajadores-permisos`, 2026-10-06)

Hecho en 10 tareas (spec y plan en `docs/superpowers/`, local):

- **Roles:** `OWNER` (dueño, puede todo) y `WORKER` (V50). Lo que puede un trabajador vive en `identity.worker_permissions` (V49): módulo + nivel `CREATE` / `PUBLISH` / `ACCESS`, con CHECK por módulo. Las cuentas viejas conservaron su alcance (ADMIN → Publicador + Publicidad).
- **Servidor:** cada endpoint del panel declara `@RequiresModule` (un test de arquitectura falla si alguno queda sin declarar); permisos leídos en cada petición → quitar un permiso o desactivar rige al instante. Publicar exige `PUBLISH` (403 `PUBLISH_PERMISSION_REQUIRED`). Solo el dueño: Trabajadores, Configuración, Registro de actividad.
- **Cuentas:** alta con contraseña temporal de 20 caracteres mostrada una vez; con temporal solo se puede cambiarla (403 `PASSWORD_CHANGE_REQUIRED`); Mi cuenta (12+ caracteres, distinta, cierra las demás sesiones); restablecer y desactivar cierran sesiones; el dueño es intocable (403 `OWNER_MANAGEMENT_DENIED`). Sin MFA (decisión del dueño).
- **Auditoría:** eventos `WORKER_*` y `PASSWORD_CHANGED` con detalle antes → después (`audit_log.details`).
- **Panel:** menú y botones por permisos; `/admin/trabajadores` con matriz de permisos (controles segmentados) y plantillas Creador, Publicador, Gestor de eventos, Gestor de directorio, Publicidad; `/admin/cuenta`; `/admin/usuarios` redirige.
- **Antes de migrar en el VPS:** backup obligatorio (`scripts/backup.sh`); las sesiones abiertas antes de V50 piden volver a iniciar sesión.

- **Cierre (Fase 0 de la hoja de ruta, 2026-10-07):** panel con commit (`34a9d46`), backend 297/297 tests, Docker reconstruido. Unido a `main` **en local, sin push** (`0dce210`), junto con `feat/sitio-red-social`: 2a nació de esa rama, así que no se pueden separar. El rediseño público sigue a medias (se termina en la Fase 10). El e2e de trabajadores requiere `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` con la clave actual del dueño (la de `BOOTSTRAP_ADMIN_PASSWORD` ya no vale).
- **Decisiones del dueño para la hoja de ruta:** Inter se mantiene; validación con zod + react-hook-form; orden de fases según el plan (F1 → F2 → F3 → F4…). Pendientes: estados simplificados, guardado automático, renombrar Article → Publication.

## 46.6f Fase 1 — Sistema de diseño moderno (rama `feat/sistema-diseno`, 2026-10-07)

Spec y plan en `docs/superpowers/` (local). El panel cambia de aspecto, no solo de orden.

- **Tokens** (`globals.css`): campo (`--field`, `--field-border`, `--ring`), estados `success`/`warning`/`info` con fondo `-soft`, `--danger-ink` (texto rojo legible en oscuro), sombras `shadow-card`/`shadow-pop`/`shadow-overlay`, radios `rounded-control` (10) / `rounded-card` (16) / `rounded-modal` (20), `text-title` y `text-label`, `color-scheme` por tema. El foco global pasó a `@layer base` para que gane el anillo suave de los componentes.
- **Componentes** en `src/components/ui/` (compartidos; el sitio público los adopta en F10): `Button`/`LinkButton`/`IconButton` (cargando con `aria-busy`), `Field` (etiqueta, ayuda y error conectados por `aria-describedby`/`aria-invalid`; cliente; conecta nativos y controles marcados con `markFieldControl`), `TextInput` (inicio/final, el final acepta botones), `TextArea` (contador), `Select`, `Checkbox`/`Radio`, `DateTimeInput` (lectura absoluta "vie 12 dic, 7:00 p. m."), `Combobox` (rol combobox), `Badge`, `Card`/`CollapsibleCard`.
- **Borrados:** `AdminButton`, `FormField`/`formInputClass`, `StatusPill`, `SectionCard`; **`lucide-react` desinstalado** (todo Phosphor; menú con ícono relleno en el activo).
- **Validación:** zod + react-hook-form, piloto en Mi cuenta → cambiar contraseña. `@hookform/resolvers` fijado en `~5.5` (la 5.9 choca en npm por un peer opcional que pide zod 3).
- **Muestra:** `/admin/muestra`, solo en desarrollo y sin sesión (el proxy la deja pasar fuera de producción; en producción es 404).
- **Siguiente (prioridad del dueño):** el compositor de publicaciones (F5 flujo + F6) antes de F2–F4.

## 46.6g Simulación de uso real y carga (k6, 2026-10-07)

`frontend/tests/load/k6-simulacion.js`: personas distintas (IP, navegador, visitorId propios) que entran al inicio, bajan por el feed (scroll infinito), abren posts, dan y quitan «me gusta» (también doble toque simultáneo), buscan con sugerencias y ven anuncios — contra el sitio (Next), no solo la API. Perfiles `humo` / `normal` (50) / `pico` (200) / `quiebre` (600); `PAGINAS_EN_CACHE=1` modela la caché de páginas de nginx de producción (solo llega al origen lo que nginx no cachea). Scripts: `npm run test:api` (contrato), `test:load`, `test:peak`, `test:stress`. Antes de correrla: respaldo de `engagement.content_likes` y `advertising.campaign_daily_stats` (las impresiones y me gusta son datos reales) y comparación al terminar.

Resultados en esta PC (6 CPU para Docker; k6 en la misma máquina):

| Escenario | Antes | Después |
|---|---|---|
| Día normal, 50 personas | 0 errores de servidor; p95 páginas 196 ms, API 316 ms | — |
| Feed, una petición | 54 ms (43 consultas con 18 ítems) | 16 ms (candidatos en memoria) |
| Backend directo, 200 personas | ~86 pet/s, p95 4,1 s | ~191 pet/s, p95 1,2 s |
| Pico 200 con páginas en caché de nginx | — | 82 pet/s por Next, p95 1,3 s, backend al 75 % de CPU |
| Quiebre 600 | — | 0 errores 5xx, nada se cayó; 0,72 % de esperas > 60 s en Next |

Arreglado con TDD: **N+1 del feed** (`default_batch_fetch_size`), **«me gusta» con doble toque** daba 500 por la restricción única (borrar-o-insertar atómico con `ON CONFLICT`), **candidatos del feed en memoria** (`FeedCandidateCache`, válidos mientras no cambie la versión del contenido; me gusta y eventos terminados cada 30 s). También: smoke de contrato actualizado (sin Reseñas ni Geografía, ya retirados); `k6-load`/`k6-stress` reemplazados por la simulación.

**Límite actual:** el servidor de Next (un solo proceso Node) hace de intermediario de feed, me gusta, anuncios y sugerencias y es lo primero que se satura (~80 pet/s aquí). Opciones cuando haga falta (no antes): 2+ instancias de Next detrás de nginx según los núcleos del VPS, o que nginx enrute las rutas de solo-paso directo al backend.

## 46.6h Flujo de plataforma y compositor (F5 + F6, 2026-10-07)

Spec: `docs/superpowers/specs/2026-10-07-compositor-y-flujo-design.md` (local).

- **Estados** (los 5 tipos): Borrador → Pendiente de aprobación → Programado → Publicado → Archivado. Sin «Aprobado» ni «Rechazado». Quien publica publica o programa desde Borrador o Pendiente, o **devuelve a borrador con nota** (`POST /{tipo}/{id}/return-to-draft`); quien solo crea **envía para aprobar**. Quien publica edita todo menos lo archivado (antes no podía editar lo publicado ni lo programado).
- **Backend:** una sola máquina de estados `shared.publishing.PublishableContent` (`@MappedSuperclass`, mismos nombres de campo → los repositorios no cambian). Se borraron 5 enums, 9 excepciones y 10 DTO duplicados. Migración **V52** (`rejection_reason` → `review_note`, CHECK nuevo). Errores en castellano llano («No se puede publicar: está Archivado.»).
- **Frontend:** una regla de permisos (`lib/admin/publication.ts`), una acción de servidor (`publication-actions.ts`, tipo y paso validados contra lista cerrada), una función del cliente (`runPublicationStep`); se borraron 5 archivos de permisos y 60 funciones/acciones duplicadas. `PublishPanel` compartido (Lugares, Eventos, Galerías, Directorio).
- **Compositor de Publicaciones** (`article-composer.tsx`, reemplaza `article-form`): fotos y videos primero, título grande, «Descripción corta» y «Texto», panel Publicar fijo (en celular al final del flujo), tema y formato, vista previa en el feed, «Cómo se ve al compartir» (Google y redes, autocompletado; canónica y robots en Avanzado). zod + react-hook-form; guardado automático del borrador cada 10 s (crea el borrador y cambia la URL sin recargar; nunca lo publicado); aviso al salir con cambios. Muestra sin sesión en desarrollo: `/admin/muestra/compositor`.
- **Pendiente:** compositor completo para Lugar, Evento, Galería y Directorio (hoy con `PublishPanel` dentro del formulario anterior); selector de fotos con arrastrar y soltar (F8).

## 46.6i CI en GitHub, seguridad y zona horaria (2026-10-07)

- **Lo pesado corre en GitHub Actions** (la laptop se recalentaba): rama + PR en borrador (#22) → backend, frontend, build y CodeQL en ~3 min. En local solo las pruebas de lo que se cambia (`vitest` con 2 procesos; Docker con 4 CPU en `.wslconfig`). El push lo hace el dueño (`! git push`).
- **El CI de main fallaba desde 2026-09**: `tsc` corría antes de que Next generara `PageProps`/`LayoutProps`; ahora `next typegen && tsc`.
- **CodeQL encontró un XSS real**: `VideoJsonLd` escapaba `<` con `"<"` escrito como `"<"` (que ES `<`); un título de video con `</script>` podía inyectar HTML en la página pública. Arreglado con prueba. También: ReDoS en `Slugify`, chequeo de texto vacío sin regex, escape completo en un e2e. La alerta «CSRF desactivado» es un falso positivo (API sin estado con token en cabecera).
- **Zona horaria**: las fechas salían en la zona de la máquina; el servidor (Docker) está en UTC → un evento de las 11 p. m. de Lima se veía al día siguiente. `SITE_TIME_ZONE` (`NEXT_PUBLIC_SITE_TIME_ZONE`, por defecto `America/Lima`) en todas las fechas; las estadísticas (días UTC) caían en el día anterior en Lima. Las pruebas corren en UTC como el CI.
- **Vercel** está vinculado al repositorio y arma vistas previas que fallan (no es el despliegue real, que es el VPS): decisión del dueño si se desconecta.

## 46.6j Fase 2 — Estructura del panel (2026-10-07)

- `components/admin/shell/AdminShell` (lo usa el layout del panel y la muestra `/admin/muestra/panel`, solo desarrollo).
- **Escritorio:** menú lateral plegable a solo íconos (cookie `admin_sidebar`, path `/admin`: el servidor lo dibuja ya plegado), acordeón con el grupo actual abierto; barra superior con **«Buscar o ir a… Ctrl K»**, **Crear** (según permisos, `createItems()` en `lib/admin/nav.ts`) y la **cuenta** (Mi cuenta, Ver el sitio, Cerrar sesión).
- **Paleta de comandos** (cmdk, Ctrl/⌘+K o «/»): ir a cualquier sección permitida o crear; filtra al escribir, Enter abre.
- **Celular:** barra inferior con nombre en cada acción (Inicio, primera sección de contenido, Crear, Buscar, Menú) y cajón con todas las secciones abiertas.
- `loading.tsx` (esqueleto), `error.tsx` (Next 16: `retry`, sin mensaje técnico, con código) y `not-found.tsx` del panel; el error público también usa `retry`.
- Crear/editar de los 5 tipos con «← Lista» sobre el título (un nivel, sin migas de pan).
- **Pendiente para F3:** contador de pendientes en el menú (necesita el endpoint liviano del inicio; contarlos hoy cargaría todas las listas). El e2e de trabajadores esperaba todos los ítems visibles en el menú; con el acordeón solo se ve el grupo actual — revisar al poder correrlo con credenciales.

## 46.6k Sesión 2026-10-15 — plataforma de contenidos moderna (pausa para continuar)

**Estado al pausar:** rama `feat/sistema-diseno`, PR borrador #22, **todo subido y CI en verde** (último commit `b5d19f1`, backend + frontend). Nada local sin subir. Docker apagado (la laptop se recalienta: lo pesado corre en GitHub Actions; en local solo lint, tipos, pruebas de lo tocado y `mvnw test-compile`).

**Visión del dueño (manda sobre todo lo demás):** startup de contenidos moderna — no una redacción ni periodismo («eso es del pasado»). Referencias: Luisito Comunica, Manolo (TV Perú), Mr Beast, Animal Planet, National Geographic, Reddit, Instagram, X. Todos los temas (tecnología, historia, animales, curiosidades, lugares…). Video y podcast **viven en YouTube** y se ven en el sitio; el VPS nunca aloja video. Monetización: AdSense + publicidad directa. Personas: **1 Dueño** (super admin), **trabajadores** (plantilla **Administrador** = todo menos Actividad), visitantes anónimos.

### Hecho en la sesión (en orden)
| Área | Qué | Commits |
|---|---|---|
| Visitas | Conteo anónimo sin cookies ni IP (Redis → `engagement.content_views_daily`, V53) + `ViewBeacon` en cada contenido | 5d52d50 |
| Inicio CRM | `GET /api/v1/admin/dashboard` (una llamada, por permisos, caché 60 s) + inicio con 7/30/90 días, indicadores, visitas por día, lo más visto | 2b6def5, 2bb0439 |
| Listados | Paginación en servidor de los 5 tipos (`AdminListQuery`), estado en la URL, filtro por estado, miniatura + visitas + me gusta por fila, vacíos con acción | 961d823, af8ddad |
| Imágenes | Subida múltiple arrastrando | 633cb5e |
| Actividad | Línea de tiempo en español con «antes → después»; filtro de fechas en día de Lima; accesos denegados auditados | b6483bc, 877ad0a, f1d3186 |
| Seguridad | Contraseñas > 72 bytes (BCrypt) ya no dan 500; **CSP permitía cero iframes de YouTube** (todos los videos se bloqueaban al tocar) | 2727f7c, 05bff93 |
| Sin redacción | Roles editor/autor fuera de código y pruebas (`TestProfile`); **todos publican directo** (sin IN_REVIEW ni «Creador», V54); formato Entrevista retirado (V56) | c13c147, fe1dbe5, 212b2e8, cb94a1e |
| Equipo | Plantilla **Administrador**: módulos Trabajadores y Configuración asignables (V55); solo Actividad es del dueño | 3cdfe67 |
| Series | Serie = lista de reproducción de YouTube; episodios llegan solos cada 30 min (feed RSS público, sin clave, XXE bloqueado); notas propias por episodio; módulo SERIES (V57) | e8a88ad, 5fb6a14 |
| Series fase 2 | Episodios en el feed, me gusta (por id), visitas, inicio del panel; portada fija por serie (V58) | 2c540f5, 5dd5429, ae1194a |
| En vivo | Transmisión de YouTube dentro del sitio (+ chat en escritorio); «Estamos en vivo» / «Terminar» en el panel; aviso «En vivo ahora» en el inicio; se apaga sola a las 12 h (V59) | 4311e7b, b5d19f1 |

### Pendiente — en este orden recomendado
**A. Verificar a la vista (primero, nada de esto se ha visto en el navegador)**
1. Reconstruir Docker (`infra`: `docker compose build frontend backend && docker compose up -d`) y revisar en Edge, en celular y escritorio, claro y oscuro: inicio CRM del panel, listados con filtros, Actividad, Imágenes (arrastrar), Series (panel y sitio), En vivo (panel, aviso del inicio, `/en-vivo` con chat), y que **el reproductor de YouTube ya carga al tocar** (corrección CSP 05bff93).
2. Probar con una lista de reproducción real del dueño: crear serie, «Sincronizar ahora», escribir notas de un episodio, portada.
3. Probar una transmisión real: programar, «Estamos en vivo», ver el aviso en el inicio, «Terminar».

**B. Historias tipo Instagram (lo único que falta del plan de Series)**
4. Diseñar con el dueño antes de construir: qué es una historia (foto o video corto de YouTube Shorts), duración (¿24 h como Instagram o fija?), quién la publica (módulo), dónde se ve (círculos arriba del feed — hoy esos círculos son los **temas**; decidir si conviven o se reemplazan).

**C. Coherencia del backend (F9, autorizado por el dueño: «todo lo editorial sacarlo»)**
5. Renombrar en el código `Article` → `Publication` (clases, tablas `content.articles`, rutas `/api/v1/articles` y `/api/v1/admin/articles`, tipos del frontend, ~140 archivos). Hacerlo en un paso propio con CI verde antes y después.
6. Errores uniformes RFC 9457 (Problem Details) con códigos estables en español.
7. Un solo dueño garantizado en la base (índice único parcial sobre `role = 'OWNER'`): **antes** cambiar las ~8 clases de prueba que crean su propio dueño en la base compartida a un dueño único de fixture.
8. ~~Guardado de permisos en lote~~ — **hecho** 2026-10-15 (4743195): un DELETE en bloque + solo INSERT (`WorkerPermission` es `Persistable`).

**D. Series y En vivo — mejoras siguientes**
9. ~~Sección de anuncios propia~~ — **hecho** (c730329): `AdSection.SERIES` «Series y En vivo», `/series` y `/en-vivo` la usan.
10. ~~Episodios en el buscador~~ — **hecho** (969f40c, V60): por título, notas y nombre del programa; filtro «Episodios»; buscar un tema también trae sus episodios.
11. ~~Etiqueta «Administrador»~~ — **hecho** (47269ad): `accountLabel()` la deduce de los permisos (la plantilla no se guarda).
12. Duración de episodios: el feed de YouTube no la trae; solo con clave de la API de datos (decisión del dueño: por ahora no).

**E. Pantallas y listados (F7/F8)**
13. Vista en cuadrícula para Galerías en el panel.
14. Revisar Trabajadores, Mi cuenta, Configuración y Login contra el sistema de diseño (los formularios ya lo usan; falta una pasada visual).
15. ~~Reporte de campaña con los gráficos nuevos~~ — **hecho** 2026-10-16: período 7/30/90 en la URL, tarjetas con variación vs. período anterior y minigráfico, gráfico de área con selector de métrica (una a la vez, un solo eje), total desde el inicio y tabla. KpiCard/RangeNav compartidos con el inicio (components/admin/kpi.tsx); se borraron CampaignStatsChart y StatCard.

**F. Sitio público (F10)**
16. ~~Retomar el rediseño estilo red social~~ — **hecho** 2026-10-16: revisión completa en Edge de las 19 pantallas públicas (escritorio 1366 y celular 390, sin desborde horizontal). Arreglado: mapa de Lugares bloqueado por la CSP, «Inicio» marcado en Series/En vivo/páginas de información, título duplicado en Series. Los algoritmos de §45.2 siguen esperando su condición de activación (datos reales).

**G. Calidad y cierre (F11)**
17. ~~E2E~~ — **hecho** 2026-10-16: suite al día (119 casos en local) y en CI con contenido sembrado (`scripts/e2e-seed.mjs`) y el dueño de prueba de la base efímera.
18. ~~axe por pantalla, Lighthouse en CI, tabla de cumplimiento~~ — **hecho** 2026-10-16: WCAG 2.2 AA en 78 casos, Lighthouse en CI, tabla en §46.8.

### Decisiones pendientes del dueño
- ¿Unir el PR #22 a `main`? (nada va al VPS todavía).
- ¿Desconectar Vercel?
- Descartar el falso positivo de CodeQL (CSRF).
- Credenciales para las E2E.
- La cuenta trabajadora «Fray Luis» en la base local parece de prueba: ¿se queda?
- Comunidad tipo Reddit (comentarios/votos) requeriría cuentas de lectores, que se descartaron antes: ¿se reabre?

### 46.6l Sesión 2026-10-16 — anuncio nativo del feed (estilo Instagram/Facebook)
Pedido del dueño: «los anuncios se tienen que mostrar como lo hacen las grandes empresas», con video de YouTube. Diseño: `docs/superpowers/specs/2026-10-16-anuncio-nativo-feed.md` (solo en disco).

| Qué | Commits |
|---|---|
| Backend: `Campaign.format` BANNER/NATIVE; nativo solo en `en-feed`; texto ≤ 500, titular ≤ 60, botón de lista cerrada (`CallToAction`), un medio: foto de la biblioteca 1:1, 4:5 o 1.91:1 (≥ 600 px) **o** video de YouTube (Shorts = 9:16); destino solo http(s); logo del anunciante; `POST /ads/campaigns/{id}/play` + `plays` diarios (V61) | 41d4b32 |
| Sitio: `NativeAdPost` — logo y nombre, «Patrocinado», menú ⋯ («Ocultar este anuncio», recordado en el navegador; «¿Por qué veo este anuncio?»: contextual, sin datos personales), medio a todo el ancho sin márgenes, video que carga al tocar (nocookie) y cuenta la reproducción, barra dominio + titular + botón, texto con «más». Sin me gusta ni compartir | 204d1a7 |
| Panel: formato «Post en el feed» / «Banner», vista previa en vivo al lado (como el Administrador de anuncios de Meta), logo en el anunciante, reproducciones y tasa en el reporte. **Corregido**: el formulario de campañas se caía (`Field` con varios hijos) | 70c6c62 |

Pendiente de esto: verlo en Docker/Edge (nada visto en navegador aún); cuartiles del video (API JS de YouTube), reproducción automática en silencio, carrusel de varias fotos, Shorts a pantalla completa.

### 46.6m Sesión 2026-10-16 — la Agenda pasa a ser de Fechas
Decisión del dueño: los eventos comerciales (conciertos, Mistura) eran **publicidad gratis**; lo comercial entra solo pagando (post «Patrocinado»). La Agenda queda hecha de **Fechas**: efemérides que se repiten cada año (28 de julio, Batalla de Ayacucho, Canción Criolla) o únicas (un eclipse). Se reutilizó el módulo Eventos (tabla `events.events`, rutas `/admin/eventos` y `/api/v1/events` sin cambiar) en vez de duplicarlo.

| Qué | Commits |
|---|---|
| «Eventos» → «Agenda»: `/agenda` con redirección 301 desde `/eventos`; plantilla «Gestor de agenda» | f00623e |
| Backend: `recurs_yearly`, `all_day`, `since_year`, `next_occurrence` (V62); `NextOccurrence` en la zona del sitio (el mismo día cuenta como hoy, 29-feb → 28); tarea 00:01 Lima; `GET /api/v1/events/today` | 791c67a |
| Sitio y panel: compositor de Fechas con la regla «pago o canje = anuncio», «Hoy se celebra» (inicio y Agenda), «Próximas fechas», Agendar con RRULE anual, Event JSON-LD solo en únicas, «Evento» → «Fecha» | b43a2ee |

**Después (mismo día): modelo Google, «Celebraciones».** El dueño eligió el modelo de Google: la portada cambia el día que toca («Hoy se celebra») y hay un archivo. La sección se llama **Celebraciones** (`/celebraciones`; `/agenda` y `/eventos` redirigen), cada ítem «Celebración», **sin pestaña** en la barra inferior (queda en Secciones del riel y en «Más»); se borró el contador semanal de Agenda (`agenda-count`). Eventos de prueba borrados de la base local; quedan 5 celebraciones reales sin foto (Lavado de Manos, Alimentación, Canción Criolla, Batalla de Ayacucho, Fiestas Patrias).

Pendiente: celebraciones por geografía del visitante (ver propuesta en la sesión); renombrar en el código `Event` → `Celebration` junto con `Article` → `Publication` (C.5).

### 46.6n PAUSA 2026-10-16 — pendiente detallado para continuar
**Estado:** rama `feat/sistema-diseno`, árbol limpio, **12 commits locales sin subir** (desde 4743195). El dueño ejecuta `! git push` y luego revisar `gh pr checks 22`: ahí corren por primera vez las pruebas de integración de anuncio nativo (NativeCampaignIntegrationTest), Fechas/«Hoy se celebra» (EventWorkflowIntegrationTest) y búsqueda de episodios. Vercel falla siempre (no se usa; decisión pendiente de desconectarlo). Docker apagado. Base local: 5 celebraciones reales sin foto + campaña nativa de demo «Pollería El Inca (demo)» (borrar cuando el dueño diga).

**En este orden:**
1. ~~**Celebraciones por geografía**~~ — **hecho** 2026-10-16 (ver §46.6o). Diseño original en `docs/superpowers/specs/2026-10-16-celebraciones-geografia.md`. Plan:
   - V63: `events.events.scope_country` (ISO-2, null = mundial) y `scope_region` (texto, exige país); `platform_settings.home_country` (default 'PE', editable en Configuración).
   - Sacar `CampaignTargeting.normalizeRegion` a `shared` y usarlo en anuncios y celebraciones (sin duplicar).
   - `GET /api/v1/events/today` lee `CF-IPCountry`/`CF-Region`/`CF-Region-Code` (como CampaignPublicController): filtra mundial + país + región del visitante y ordena región > país > mundial; sin ubicación: mundial + `home_country`, sin regiones.
   - «Hoy se celebra» pasa a pedirse desde el navegador (proxy `/api/celebrations/today` con `visitorHeaders`, como los anuncios) para que las páginas sigan en caché.
   - Panel: campo «Alcance» (Mundial / País / Región) en el compositor; la página de la celebración dice «Se celebra en Ayacucho, Perú» o «En todo el mundo». Archivo `/celebraciones` y «Próximas celebraciones» muestran todo (como el archivo de Doodles).
2. ~~Ver en Edge el anuncio nativo con foto y el panel con sesión~~ — **hecho** 2026-10-16: anuncio nativo 4:5 con CTA de WhatsApp, «Hoy se celebra», página de celebración, panel de anunciantes, compositor «Dónde se celebra» y «País del sitio» verificados en Edge (Playwright, canal msedge). Para entrar al panel sin la contraseña del dueño hay un trabajador de prueba **solo en la base local** (`verificacion-temporal@dev.local`, permisos de Administrador; credenciales en `frontend/.env.e2e`, fuera de git). Se creó una 2.ª campaña nativa de demo con foto de prueba marcada «DEMO» (borrar junto con «Pollería El Inca (demo)»). Hallazgo arreglado: `SegmentedControl` desplazaba todo el panel al elegir una opción (radio `sr-only` sin contenedor `relative`).
3. ~~Fotos para las 5 celebraciones y más fechas reales~~ — **hecho** 2026-10-16 en la base local: cada celebración tiene foto de Wikimedia Commons con licencia libre (dominio público, CC0, CC BY o CC BY-SA), subida a la biblioteca y con autor + licencia en el pie («Foto: … · CC BY 2.0 · Wikimedia Commons», obligatorio para CC BY/BY-SA). Alcance: Fiestas Patrias, Batalla de Ayacucho y Canción Criolla → Perú; Alimentación y Lavado de Manos → todo el mundo. Nuevas y publicadas: Día de la Bandera (7 jun, Perú), Inti Raymi (24 jun, Cusco, desde 1944), Semana Santa en Ayacucho 2027 (única, 21–28 mar, Ayacucho). **Falta**: «Canción Ayacuchana» — no se cargó porque no hay una fecha verificada; el dueño tiene que confirmarla. Las fotos son de referencia: el dueño puede reemplazarlas por fotos propias cuando las tenga.
4. Lo que seguía de §46.6k: ~~C.5 renombre `Article`→`Publication` y `Event`→`Celebration`~~ — **hecho** 2026-10-16 (c126c1f, b90b34f; CI verde en ambos): clases, paquete `celebrations`, rutas `/api/v1/publications` y `/api/v1/celebrations`, panel `/admin/celebraciones`, tipos del frontend, valores `PUBLICATION(S)`/`CELEBRATION(S)`. V64/V65 renombran tablas, esquema `events`→`celebrations`, columnas, índices y restricciones, y migran los valores guardados (me gusta, visitas, secciones de campañas, permisos). La auditoría vieja (`ARTICLE_*`, `EVENT_*`, `ARTICLES`, `EVENTS`) no se toca (inmutable); `lib/admin/audit.ts` la sigue nombrando bien. Se conservan a propósito: `<article>` de HTML, schema.org `Article`/`Event`, OpenGraph `article`, `VEVENT`, `AuditEvent`, eventos del DOM y la clave de posición de anuncio `article`. Hallado y arreglado en el camino (7a70347): las fechas anuales con año de origen antiguo (1821, 1824) caían un día antes por la hora solar de Lima anterior a 1908; textos visibles que aún decían «evento». **Pendiente menor**: `scripts/seed_dev_data.py` estaba desactualizado desde antes (rol EDITOR, tipo RANKING). ~~C.6 RFC 9457~~ — **hecho** 2026-10-16: todos los errores de la API en `application/problem+json` (`title` en español, `status`, `detail`, `instance`; `code` estable para permisos y seguridad: MODULE_ACCESS_DENIED, OWNER_MANAGEMENT_DENIED, INVALID_PERMISSION, ACCOUNT_DISABLED, PASSWORD_CHANGE_REQUIRED, AUTHENTICATION_REQUIRED, ACCESS_DENIED; `errors` por campo en la validación). `shared/api/Problems` + `ApiExceptionHandler` (ResponseEntityExceptionHandler) reemplazan 15 records ApiError e InvalidParameterExceptionHandler; la API fija el idioma en español (`spring.web.locale: es`) para los mensajes de validación; el frontend lee `detail` (lib/api/problem.ts). Los códigos de estado no cambiaron (sin sesión sigue siendo 403). ~~C.7 dueño único~~ — **hecho** 2026-10-16: V66 índice único parcial (como máximo una fila `role = OWNER`); las pruebas usan un solo dueño compartido (`TestOwner`, en las pruebas de identity) y ya no existe el perfil de prueba DUENO. Sigue: ~~E.13 cuadrícula de Galerías~~ (hecho 2026-10-16: DataTable con vista Lista/Cuadrícula en ?vista, Galerías abre en cuadrícula), ~~E.14 revisión visual~~ (hecho 2026-10-16: Configuración sin jerga interna y con Card del sistema, Mi cuenta en dos columnas con «Qué puedes hacer», Trabajadores a todo el ancho con columnas; Login sin cambios. «Tema» quitado de Configuración a pedido del dueño (V67): el sitio sigue al dispositivo, sin selector.), F.16 rediseño social, G.17–18 E2E y axe/Lighthouse.
5. Pendientes de anuncios: cuartiles de video, autoplay en silencio, carrusel de fotos.
6. Legal (no es código): revisión con abogado antes de vender el primer anuncio; RUC y régimen con contador (AdSense = renta de tercera categoría; posible exportación de servicios); actualizar la política de privacidad al reglamento D.S. 016-2024-JUS.

### 46.6o Sesión 2026-10-16 (cont.) — celebraciones por geografía
CI verde en los 12 commits de §46.6n (Vercel sigue fallando; no se usa). Construido el punto 1:
- **V63**: `events.events.scope_country` (ISO-2, null = todo el mundo) y `scope_region` (exige país, CHECK en la base); `configuration.platform_settings.home_country` (default 'PE').
- **`shared/RegionNames`**: normalización de regiones (antes `CampaignTargeting.normalizeRegion`), `matches`, `visitorCountry` (descarta "XX" y "T1" de Cloudflare) y `countryCode`. Anuncios y celebraciones usan el mismo código; prueba unitaria `RegionNamesTest`.
- **`GET /api/v1/events/today`** lee `CF-IPCountry`/`CF-Region`/`CF-Region-Code`, filtra con `Event.closenessTo` y ordena región > país > mundial; sin ubicación usa `home_country` sin regiones. Responde `no-store`. País inválido o región sin país → 400 (`InvalidEventScopeException`).
- **Frontend**: la página trae en su HTML en caché lo del visitante sin ubicación (mundial + país del sitio); `TodayCelebrations` (ahora componente de cliente) lo reemplaza con lo de su lugar vía el proxy `/api/celebrations/today` (`visitorHeaders`). La forma de tarjeta se arma en el servidor (`lib/today-celebrations.ts`). Página de la celebración: dato «Se celebra en · Ayacucho, Perú / Perú / Todo el mundo». Compositor: tarjeta «Dónde se celebra» (Un país / Una región / Todo el mundo; país con buscador, nombres por `Intl.DisplayNames` en `lib/countries.ts`). Una celebración nueva es por defecto del país del sitio: lo mundial se elige a propósito. Configuración › Identidad: «País del sitio».
- Las pruebas de integración (`todayShowsOnlyWhatIsCelebratedWhereTheVisitorIs`, `scopeMustBeACountryCodeAndARegionNeedsItsCountry`) corren en CI.
- **Pendiente del dueño**: las 5 celebraciones de la base local quedaron como «Todo el mundo» (null). Las peruanas (Fiestas Patrias, etc.) hay que pasarlas a «Perú» en el panel; si no, un visitante de México las vería.
- **Compromiso aceptado**: un visitante fuera del país del sitio, o de una región con fecha propia, ve un cambio en la tarjeta al cargar (de lo general a lo suyo). Es el precio de mantener las páginas en caché; para la mayoría (Perú sin fecha regional) no cambia nada.

### 46.6p Sesión 2026-10-16 (cont.) — publicidad legal y paquete de 5 arreglos de Publicaciones
Ingreso principal por ahora: **AdSense**; la publicidad directa, cuando el sitio sea conocido (dueño, 2026-10-16). Análisis en Claude Docs: «Directorio y publicidad» (decisión pendiente: «Recomendados» o quitarlo) y «Publicaciones: qué le falta».
- **Publicidad pagada** (V68): rubro del anunciante con advertencia por ley y confirmación de condiciones en cada guardado. Ver la tabla «Publicidad pagada» en §46.8.
- **1. Imagen al compartir (bug)**: la página pública solo enviaba `ogImageUrl`; sin él, WhatsApp/Facebook mostraban el enlace sin foto. `lib/share-image.ts` aplica una sola regla a los 5 tipos: imagen elegida, si no la portada, si no la miniatura del video. Además agrega `max-image-preview:large` (Google Discover) a lo indexable. También quita los tres `resolveImageUrl` duplicados.
- **2. «actualizado hace …»** en el encabezado de una publicación editada al menos 24 h después de publicarse (`updatedTimeFor`).
- **3. Shorts verticales** (V69): `vertical` en los videos de publicaciones, lugares, celebraciones y directorio; se detecta por el enlace `/shorts/` y se muestran en 9:16. Los videos ya cargados quedan horizontales hasta volver a guardarlos. Todo video vive en YouTube; el sitio solo guarda la referencia.
- **4. «También te puede interesar»** a mitad de una publicación larga (≥ 6 bloques, `lib/split-body.ts`, nunca corta listas ni citas). Ese contenido sale de «Más como esto» para no repetirse.
- **Directorio quitado entero** (V71, dueño 2026-10-17: «se ve feo, parece publicidad gratis»). Respaldo previo: `docs/respaldos/directorio-2026-10-17.sql` (fuera de git; 9 fichas). Se borró el módulo en backend (paquete `directory`, tipo BUSINESS, módulo DIRECTORY, plantilla «Gestor de directorio») y frontend (rutas, compositor, tabla, chips, menú, búsqueda, sitemap, estadísticas, e2e). La migración limpia «me gusta», visitas, permisos y la segmentación de anuncios. De paso: el panel de inicio ahora también abre para un trabajador solo de Series (antes mostraba series pero se lo negaba).
- **«Agendar» → «Recordarme»** en la tarjeta y en el detalle de las celebraciones (antes «Agendar» y «Google Calendar»): guarda la fecha en el calendario del visitante; no usa ninguna API ni cuenta de Google.
- **Loop 1 de diseño (inicio/feed)**: ver commit fa4df32 (feed sin líneas, tokens `like`/`live`, `lib/prose.ts`, bug de hidratación con `window.location`).
- **5. «Síguenos en WhatsApp»** al final de cada publicación (V70, Configuración › Contacto › Canal de WhatsApp; solo enlaces `whatsapp.com/channel/…`; vacío = sin botón).

### 46.6q PAUSA 2026-10-17 — todo lo que falta, en orden
Estado: todo subido hasta `dd11734` (PR #22). Hecho en esta sesión: §46.6p.
1. **Verificar CI** de los últimos commits (`gh pr checks 22`); las pruebas de integración del backend solo corren allí.
2. **Docker local**: reconstruir el backend para aplicar V71 (`cd infra && docker compose --env-file ../.env up -d --build backend`) y comprobar que `/directorio` da 404 y el feed carga.
3. **Loops de diseño por pantalla** (procedimiento en `DESIGN.md` › Iteration Guide). Hecho: inicio/feed. Faltan, en orden: detalle de publicación (y ver en vivo los 5 arreglos de §46.6p) → explorar → celebraciones → lugares → galerías → series y en vivo → buscar → páginas legales y contacto → panel completo. Ya detectado: `rounded-2xl`/`rounded-xl` y sombras sueltas fuera de los tokens; colores sueltos en los degradados de temas y del riel.
4. **Bugs, inconsistencias y logs**: anotarlos en cada loop. Logs del frontend (route handlers `/api/*`, server actions, `error.tsx`) con un logger mínimo en JSON y el id de petición; revisar en el backend los jobs programados sin log de error.
5. **Revisión del backend** por módulo, después del frontend.
6. **Tareas del dueño**: «Semana Santa en Ayacucho 2027» tiene hora 00:00 en vez de «todo el día»; enlace del canal de WhatsApp en Configuración; volver a guardar las publicaciones con Shorts; fecha de la Canción Ayacuchana; avisar cuándo borrar las campañas demo y el trabajador temporal; abogado y RUC/contador.
7. **Técnico de antes**: LCP (meta 2,5 s), anuncios (cuartiles, autoplay silenciado, carrusel nativo), CSP con nonce, backups con copia externa, campos sin uso de Configuración.
8. **En espera**: UTM y visitas por origen, embeds de redes, series de publicaciones, gestor de consentimiento europeo.

## 46.8 Tabla de cumplimiento (G.18, 2026-10-16)

Estado real de cada control, con su evidencia en el repositorio. ✅ cumple · ⚠️ parcial · ⏳ pendiente.
No reemplaza una auditoría externa ni la revisión legal (§46.6n.6).

### Accesibilidad — WCAG 2.2 AA

| Control | Estado | Evidencia |
|---|---|---|
| Páginas completas sin violaciones axe (A, AA, 2.1 AA, 2.2 AA) | ✅ | `e2e/accessibility.spec.ts`: 14 pantallas públicas, detalle de los 5 tipos, un tema, login y 17 pantallas del panel, en escritorio y celular (78 casos). Corre en CI. |
| Componentes | ✅ | `vitest-axe` en las pruebas de componentes. |
| 2.5.8 Tamaño del objetivo (≥ 24 px) | ✅ | Puntos del carrusel (`media-carousel.tsx`), casillas de selección de 44 px. |
| 2.1.1 Teclado | ✅ | Prueba de recorrido con Tab; foco visible global; controles nativos. |
| Contraste en claro y oscuro | ✅ | axe en ambos esquemas (regresión visual claro/oscuro); el sitio sigue al dispositivo. |

### Calidad del producto — ISO/IEC 25010

| Característica | Estado | Evidencia |
|---|---|---|
| Adecuación funcional | ✅ | pruebas de integración del backend (Testcontainers) y unitarias del frontend en cada CI; e2e en CI con contenido sembrado. |
| Eficiencia de desempeño | ⚠️ | Lighthouse CI en cada cambio (perfil de celular): rendimiento 85–97, CLS 0, TBT < 150 ms (bloqueantes, pasan). **LCP 2,8–4,2 s contra la meta de 2,5 s** (advertencia por decisión del dueño, 2026-10-16). Ver «LCP» abajo. |
| Usabilidad | ✅ | WCAG 2.2 AA (arriba); revisión visual en Edge de las 19 pantallas públicas y del panel. |
| Fiabilidad | ⚠️ | Health checks, reintentos y topes de memoria en Docker. ⏳ Backups: falta la copia externa a R2 y corregir `scripts/backup.sh` (§46.7.5). |
| Seguridad | ✅/⚠️ | Ver OWASP ASVS. |
| Mantenibilidad | ✅ | knip (cero código sin uso) y ESLint en CI; tipos estrictos; módulos por dominio; nombres coherentes con la interfaz (Publication, Celebration). |
| Portabilidad | ✅ | Todo en Docker Compose; configuración por variables de entorno. |

**LCP — qué se hizo y qué falta (2026-10-16).** Hecho y medido en CI: foto principal visible sin esperar a JavaScript (`SkeletonImage` sin fundido con `priority`), foto del detalle y de «Hoy se celebra» con prioridad, borrado de `app/loading.tsx` raíz (envolvía todo el sitio en un segmento de streaming), sonner solo en el panel, Radix de Buscar/Más/Información cargado al primer toque, semilla de CI con foto realista. Descartado tras medirlo: quitar los esqueletos `loading.tsx` del sitio (≈ −0,5 s en algunas pantallas, peor en el inicio; no compensa perder el esqueleto al navegar). Lo que queda: ~3 s de «Render Delay» con 257 KB de JS comprimido y ~1,4 s de CPU en el inicio. **Siguiente paso**: analizar el paquete (`next build` con análisis) y el tamaño del RSC en línea, pasar a Server Components lo que no necesita estado, y medir en el VPS con datos reales (CrUX/Search Console es lo que cuenta para Google).

### Seguridad de aplicaciones — OWASP ASVS (nivel 2, controles principales)

| Capítulo | Estado | Evidencia |
|---|---|---|
| V2 Autenticación | ⚠️ | BCrypt; política de contraseñas (12+ caracteres); límite de intentos de login por IP; contraseña temporal con cambio obligatorio. **Sin MFA** por decisión del dueño (riesgo aceptado, §46.6d). |
| V3 Sesiones | ✅ | Cookies `httpOnly`, `SameSite=Lax`, `Secure` en producción; tokens de refresco revocables; las sesiones caen al restablecer la contraseña o desactivar la cuenta. |
| V4 Control de acceso | ✅ | Permisos por módulo verificados en el servidor en cada petición; rutas del dueño por rol; un solo dueño garantizado en la base (V66). Prueba: `AuthorizationMatrixIntegrationTest`. |
| V5 Validación y codificación | ✅ | Bean Validation; HTML saneado en el backend (`HtmlSanitizer`); escape de `<` en todo JSON-LD (prueba `json-ld-escape.test.ts`). |
| V7 Errores y registros | ✅ | Errores RFC 9457 sin trazas internas; id de petición en cada log; auditoría de toda acción del panel y de los accesos denegados. |
| V8 Protección de datos | ✅ | Sin cuentas de lectores; «me gusta» con un UUID aleatorio; IP de anuncios solo como hash por 26 h. |
| V12 Archivos | ✅ | Subida de imágenes validada por tipo real y tamaño, con límite por usuario. |
| V14 Configuración | ⚠️ | CSP, HSTS (nginx), `nosniff`, `Referrer-Policy`, `Permissions-Policy`; `npm audit` y CodeQL en CI. ⏳ CSP con *nonce* para quitar `'unsafe-inline'` (§46.7.2). |

### Seguridad de la información — ISO/IEC 27001:2022 (Anexo A, controles técnicos aplicables)

| Control | Estado | Evidencia |
|---|---|---|
| A.5.15 / A.8.2 / A.8.3 Control y restricción de accesos | ✅ | Dueño + trabajadores con módulos asignados; el dueño no puede ser administrado por un trabajador. |
| A.8.5 Autenticación segura | ⚠️ | Ver V2 (sin MFA). |
| A.8.12 Prevención de fuga de datos | ✅ | Datos mínimos; nada personal de lectores. |
| A.8.13 Copias de seguridad | ⏳ | `scripts/backup.sh` con dos fallas conocidas; falta copia externa (§46.7.5–16). |
| A.8.15 / A.8.16 Registro y monitoreo | ✅ | Auditoría inmutable (nunca se reescribe; los renombres V64/V65 la dejaron intacta), logs JSON con rotación, retención de 365 días. |
| A.8.25–A.8.29 Desarrollo y pruebas seguros | ✅ | Ramas y PR con CI obligatorio (backend, frontend, e2e, a11y, Lighthouse, CodeQL, `npm audit`). |
| A.8.9 Gestión de la configuración | ✅ | Infraestructura como código (`infra/`); secretos fuera del repositorio. |

### Protección de datos personales — Ley N.º 29733 y su reglamento (D.S. 016-2024-JUS)

| Obligación | Estado | Evidencia |
|---|---|---|
| Inventario y finalidad de los datos | ✅ | Tabla de §46.6d. |
| Información al titular (política de privacidad) | ⚠️ | `/privacidad` vigente (actualizada 2026-10-16); ⏳ revisarla contra el reglamento D.S. 016-2024-JUS con un abogado. |
| Consentimiento para cookies no necesarias | ✅ | Aviso con «Aceptar» y «Rechazar» del mismo peso; nada de terceros sin aceptar. |
| Derechos ARCO | ⚠️ | Explicados en `/privacidad`; ⏳ falta publicar el correo de contacto (Configuración). |
| Conservación limitada | ✅ | Auditoría 365 días; frecuencia de anuncios 26 h; intentos de login 15 min. |
| Inscripción del banco de datos (ANPD) | ⏳ | Trámite del dueño, no de código. |

### Publicidad pagada — D.L. 1044 y leyes de advertencias (2026-10-16)

| Obligación | Estado | Evidencia |
|---|---|---|
| Autenticidad: el anuncio se reconoce como publicidad (art. 16) | ✅ | Banner rotulado «Publicidad» y post nativo «Patrocinado», siempre (`native-ad-post.tsx`, `direct-campaign-banner.tsx`). |
| Promociones con vigencia, stock y condiciones (art. 17.3.f) | ✅ | Casilla obligatoria en cada guardado de campaña; el backend rechaza sin ella (`CAMPAIGN_COMPLIANCE_REQUIRED`) y guarda la fecha (`compliance_confirmed_at`, V68). |
| Advertencias por rubro: alimentos (Ley 30021), alcohol (Ley 28681), apuestas (Ley 31557) | ✅ | Rubro del anunciante (`AdvertiserIndustry`, V68); el formulario muestra la advertencia exigida (`lib/ads/industry.ts`). La creatividad la arma el anunciante; el panel no puede leer la imagen. |
| Contrato y comprobante de pago (SUNAT) | ⏳ | Trámite del dueño, fuera del software. |
| Revisión legal de los textos | ⏳ | Resumen práctico, no asesoría; revisarlo con un abogado antes de la primera campaña cobrada. |
| Directorio: fichas que parecían avisos | ✅ | Quitado entero (V71, 2026-10-17); respaldo fuera de git. |

## 46.7 Mejoras técnicas — frontend y backend (fuera del rediseño)

Ordenadas por prioridad.

### Seguridad (primero)
1. ~~Next.js 16.3.3 con vulnerabilidad crítica~~ — **hecho**: el proyecto ya usa **16.3.8** y el `npm audit` del CI pasa (ver §46.6d).
2. CSP con *nonce* para quitar `'unsafe-inline'` de `script-src` (pendiente anotado en `next.config.ts`).
3. Permisos de trabajadores aplicados en el servidor (proyecto 2).
4. MFA quedó retirado por decisión del dueño (2026-09-14); reconsiderar antes de tener trabajadores con acceso al panel.

### Backend
5. `scripts/backup.sh`: la retención de 14 días borra backups viejos aunque sean los únicos; no respalda las imágenes reales (volumen Docker `media_data`). Respaldar el volumen con `docker compose exec backend tar …` y no borrar el último backup.
6. Medios en Object Storage (Cloudflare R2): `StorageService` ya es una interfaz; falta la implementación (README "Pendiente para un MVP completo").
7. ~~Visitas anónimas por contenido~~ — **hecho** 2026-10-15 (§46.6k); falta "también vieron".
8. Campos sin uso en Configuración (`primaryColor`, `secondaryColor`, `backgroundColor`, `fontFamily`): quitarlos o conectarlos.
9. Roles `MODERATOR`, `COLLABORATOR`, `USER` sin uso → se eliminan con el proyecto 2; "editorial" aparece solo en comentarios internos de 7 archivos Java (no visible) → limpiar al tocar esos archivos.
10. CORS y auto-registro público: **no aplican** (no hay cuentas de visitantes; el panel usa Server Actions).
10b. **SOLID — registro de tipos de contenido** (hecho 2026-10-22): el módulo `catalog` tiene `ContentType` (antes en `engagement`), `ContentSource` (ficha de una tabla de contenido: tipo, módulo de permisos, columna de título, fila de lectura, `createdInPanel`, `categorized`, `versionsFeed`, fotos y columnas con URLs de imágenes) y `ContentRegistry` (reúne las fichas; falla al arrancar si dos reclaman el mismo tipo o tabla). Cada módulo declara la suya (`content/PublicationContentSource`, `places/PlaceContentSource`, `celebrations/…`, `galleries/…`, `series/SeriesContentSource` con serie + episodios). Leen de ahí: `DashboardService`, `FeedCandidateCache`, `ContentViewFlushJob`, `ImageUsages`, `CategoriesWithContent`. **Tipo nuevo = declarar su ficha en su módulo**, sin editar a esos lectores. `ContentRegistryIntegrationTest` exige una ficha por `ContentType`. Siguiente: partir `CampaignService` / `admin-client.ts`.
10c. **SOLID — límites entre módulos con Spring Modulith 2.1.2** (hecho 2026-10-22): `ModularityTest` (`ApplicationModules.verify()`) falla el CI si un módulo usa lo interno de otro o si aparece un ciclo. Cada paquete de primer nivel es un módulo y su paquete raíz es su API; los subpaquetes son internos salvo que se declaren. Decisiones: `shared` es módulo **abierto** (núcleo compartido, `package-info`); `identity.permission` expuesto como interfaz `identity::permission` (a nivel de paquete — **no** anotar clases con `@NamedInterface`: Modulith arrastra sus dependencias y exponía `User`/`UserRepository`, comprobado con una violación de prueba); `User`, `UserRepository`, `WorkerPermission` y su repositorio pasan a `identity.internal`; otros módulos piden el correo con `identity.UserDirectory.emailOf(id)`; `UserPrincipal` e `IdentityHttpSecurity` (instala los filtros de token y estado de cuenta en `config.SecurityConfig`) quedan en la raíz de identity, y `JwtService`, filtros y `RefreshTokenService` son internos; `YouTubeUrlParser` pasó de `content` a `shared` (lo usaban 5 módulos). Verificado: 3 violaciones de prueba detectadas y el código limpio pasa. Pendiente de mirar: `feed` y `search` leen entidades de los 5 módulos de contenido (modelos de lectura; aceptable, revisar si crecen).
10d. **SOLID — `CampaignService` partido** (hecho 2026-10-22): tenía 469 líneas y cuatro responsabilidades. Ahora `CampaignService` (106 l., gestión del panel), `CampaignDraftValidator` (reglas del borrador: condiciones, fechas, monto, temas, destino web, banner a la medida de su posición, nativo con un solo medio), `AdInventory` (cupo de `MAX_COMPETING_CAMPAIGNS` por público), `AdDeliveryService` (qué campañas ve el visitante: segmentación, ponderación, tope diario) y `CampaignTrackingService` (impresión visible, clic válido, reproducción, cifras diarias). `Campaign.getDisplayDomain()` y `NativeAd.FEED_PLACEMENT_KEY` quedan en el dominio. Sin cambio de comportamiento (mismas transacciones); nuevas pruebas unitarias del validador cubren destino web, medida del banner y tema inexistente, que no tenían prueba. Siguiente: `admin-client.ts` (670 l.) en el frontend.

### Frontend
11. Dependencias: actualizaciones menores de Radix, Tiptap y tipos; `@tanstack/react-table` 9 es versión mayor (evaluar en el proyecto 2).
12. Pruebas E2E existentes (`e2e/accessibility`, `admin-auth`, `public-navigation`, `visual-regression`): `public-navigation` y las capturas de `visual-regression` **quedarán desactualizadas** con el rediseño → actualizar al cerrar el proyecto 1.
13. Agregar las E2E del plan: `seo-urls.spec.ts` y `no-editorial-patterns.spec.ts`.
14. Componentes viejos a retirar (46.3-F) cuando nada los use.

### Infraestructura / lanzamiento
15. Despliegue real en el VPS (Contabo) con dominio, HTTPS, Cloudflare y el timer de backups instalado (`infra/DESPLIEGUE.md`).
16. Copia externa de backups a R2 (credenciales y bucket reales).

---

## Índice de secciones

```text
1-2   Descripción y objetivo             23    Redis
3     Tipos de contenido                 24    Patrones de diseño
4     Categorías                         25    Infraestructura inicial
5     Estructura geográfica              26    CI/CD
6     Lugares                            27    Testing
7     Historias y cultura                28    Observabilidad
8     Multimedia (YouTube)               29    Backups
9     Videos propios (futuro)            30    Monetización
10    Imágenes                           31    Distribución de contenido
11    CMS / Panel administrativo         32    Principio de escalabilidad
12    Sistema editorial                  33    Principio fundamental
13    Usuarios y roles (base RBAC)       34    MVP recomendado
14    Identidad de plataforma (marca)    35    Cumplimiento normativo / ISO / legal
15    SEO                                36    Trabajadores y administradores
16    Búsqueda                           37    Logs
17    Seguridad                          38    Arquitectura → microservicios (detalle)
18    Auditoría                          39    Middlewares
19    Arquitectura (monolito modular)    40    WebSockets (detalle)
20    Preparación para microservicios    41    Metodología Scrum + XP
21    Stack tecnológico                  42    Flujo de trabajo con agentes de IA
22    WebSockets                         43    Estándar de diseño y frontend
                                          44    Modelo de negocio (en validación)
                                          45    Algoritmos de contenido y pendientes
                                          46    Rediseño estilo red social (pendientes)
```
