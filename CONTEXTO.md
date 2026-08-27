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
Perú
├── Ley N.º 29733 — Ley de Protección de Datos Personales
├── Reglamento de la Ley 29733 (D.S. 003-2013-JUS)
├── Ley N.º 30096 — Ley de Delitos Informáticos
├── Indecopi — protección al consumidor (publicidad, comercio electrónico)
└── Ley N.º 29571 — Código de Protección y Defensa del Consumidor

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
                  mínimo posible (1-2 personas), con MFA obligatorio.
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

```text
1. Nunca se usa para trabajo diario (se usa una cuenta ADMIN normal).
2. MFA obligatorio, sin excepción.
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
```
