# Cumplimiento: leyes, normas y marcos

Matriz viva de qué exige cada ley o norma, cómo lo cumple la plataforma y
qué queda pendiente (y de quién). Complementa `CONTEXTO.md` §35 y §45.4.

> Orientación técnica, no asesoría legal. Antes de lanzar y antes de cobrar
> por publicidad, revisarlo con un abogado.

Estado: ✅ cumplido · 🟡 parcial · 👤 trámite del dueño (fuera del código) · ⏸ no aplica todavía

## 1. Leyes (obligatorias en Perú)

| Ley | Exige | Estado | Evidencia / cómo |
|---|---|---|---|
| **Ley 29733** Protección de Datos Personales y su reglamento **D.S. 016-2024-JUS** | Informar qué datos se tratan, para qué, con quién y por cuánto tiempo | ✅ | `/privacidad`: responsable, qué se recopila, cookies, proveedores y flujo transfronterizo, conservación, derechos ARCO y reclamo ante la ANPD |
| | Consentimiento para cookies no necesarias | ✅ | Aviso de cookies con «Aceptar» y «Rechazar» del mismo peso; nada de terceros antes de aceptar |
| | Medidas de seguridad | ✅ | HTTPS, panel con roles por módulo, contraseñas con hash, límite de intentos de login, auditoría inmutable, secretos solo por entorno |
| | Inscribir los bancos de datos ante la ANPD | 👤 | Inventario listo en la §5 de este documento |
| | Atender derechos ARCO | 🟡 | El canal es el correo de contacto (`/contacto`). Falta configurar ese correo en el panel → Configuración |
| | Comunicar a la ANPD los incidentes de seguridad | 🟡 | Procedimiento en la §6; el plazo exacto se confirma con el abogado |
| **Ley 29571** Código de Protección del Consumidor | Publicidad identificable, información veraz | ✅ | Lo pagado va con «Patrocinado»; los anuncios están separados del contenido (`CONTEXTO.md` 43.2) |
| **D. Leg. 1044** Competencia Desleal | Nada de publicidad encubierta (principio de autenticidad) | ✅ | Se quitó el Directorio; reglas «Antes de publicar» en el panel; `CONTEXTO.md` 45.4 |
| **Ley 30021**, **Ley 28681**, **Ley 31557** | Advertencias en anuncios de alimentos procesados, alcohol y apuestas | ✅ | El rubro del anunciante obliga la advertencia (migración V68) |
| **D. Leg. 822** Derechos de Autor | Usar solo obras propias o con permiso | ✅ | Fotos subidas por el dueño (sin enlaces a fotos ajenas); videos del canal propio o con permiso |
| **Ley 30096** Delitos Informáticos | — (ampara a la plataforma si la atacan) | ✅ | Registro de auditoría como evidencia |
| **Ley 27291 / D. Leg. 1412** Firma y Gobierno Digital | Validez de contratos y firmas electrónicas | ⏸ | Solo si se firman contratos digitales con anunciantes |
| **SUNAT** (RUC, comprobantes electrónicos) | Facturar lo cobrado por publicidad | 👤 | La plataforma guarda el monto de cada campaña (V44) como apoyo; la factura se emite fuera del sistema |
| **GDPR** (Unión Europea) | Solo si se dirige a público europeo | ⏸ | El aviso de cookies ya cumple el estándar europeo de rechazo igual de fácil |

## 2. Normas ISO (voluntarias; se usan como guía, sin certificar)

| Norma | Para qué | Cómo se aplica hoy |
|---|---|---|
| **ISO/IEC 27001 / 27002** | Seguridad de la información | Controles: A.5.15 acceso por roles y módulos; A.5.24–5.28 incidentes (§6); A.8.5 autenticación segura; A.8.13 backups; A.8.15 auditoría inmutable con retención; A.8.24 secretos por entorno; A.8.25–8.29 desarrollo seguro y pruebas en CI |
| **ISO/IEC 27701** | Privacidad | Inventario de datos (§5), conservación definida, minimización: los lectores no tienen cuenta y solo hay un id anónimo en el navegador |
| **ISO/IEC 25010** | Calidad del software | Adecuación funcional: pruebas unitarias e integración. Eficiencia: caché, imágenes reducidas, R2. Usabilidad y accesibilidad: WCAG en CI. Seguridad: OWASP. Mantenibilidad: Spring Modulith y `ModularityTest` |
| **ISO/IEC 12207** | Ciclo de vida del software | Ciclo de trabajo de `CONTEXTO.md` 42.1; PR con CI obligatoria |
| **ISO 22301** | Continuidad del negocio | Backups diarios con copia fuera del VPS (`infra/DESPLIEGUE.md` §2.4) y restauración (`scripts/restore.sh`) |
| **ISO 31000** | Riesgos | Riesgos del negocio en `CONTEXTO.md` 44.9; riesgos técnicos se registran en cada PR |
| **ISO/IEC 40500 (WCAG 2.2 AA)** | Accesibilidad | Pruebas axe en CI para todas las pantallas públicas y del panel |
| **ISO 9001**, **ISO/IEC 20000** | Calidad de la empresa y gestión de servicios | ⏸ cuando haya equipo y clientes que lo pidan |

## 3. Marcos de trabajo

| Marco | Aplicación |
|---|---|
| **ITIL 4** | Gestión de cambios: PR con CI y procedimientos reversibles (`infra/DESPLIEGUE.md`). Gestión de incidentes: §6. Problemas: cada fallo se investiga hasta la causa (`CONTEXTO.md` 42.1) |
| **COBIT 2019** | APO12 riesgos, APO13 seguridad, BAI06 cambios, BAI10 configuración (todo por variables de entorno documentadas en `.env.example`), DSS02 incidentes, DSS04 continuidad, MEA03 cumplimiento externo (este documento) |
| **NIST CSF 2.0** | Gobernar (este documento) · Identificar (§5) · Proteger (§2) · Detectar (auditoría y logs estructurados) · Responder y Recuperar (§6 y backups) |
| **OWASP Top 10 / ASVS nivel 1** | Validación y saneamiento de HTML, sin secretos en el código, límites de tamaño y frecuencia, autorización por módulo, CodeQL y `npm audit` en CI |
| **Scrum / XP** | `CONTEXTO.md` §41 |

## 4. Principios de ingeniería

SOLID (por ejemplo, `StorageService` con estrategia local o R2), patrones
Strategy y Repository, monolito modular verificado (Spring Modulith),
12-Factor (configuración por entorno, logs a stdout en JSON) y pruebas en
cada capa.

## 5. Bancos de datos personales (para inscribir ante la ANPD) 👤

Trámite en línea en gob.pe (Autoridad Nacional de Protección de Datos
Personales). Datos para el formulario:

| Banco | Titulares | Datos | Finalidad | Dónde | Conservación |
|---|---|---|---|---|---|
| **Equipo del panel** | Dueño y trabajadores | Nombre, apellido, correo, rol, contraseña (solo hash) | Dar acceso al panel según permisos | Base PostgreSQL en el VPS | Mientras la cuenta exista |
| **Registro de seguridad (auditoría)** | Dueño y trabajadores | Correo, IP, acción, fecha | Seguridad y evidencia ante incidentes | Base PostgreSQL | 365 días (`AUDIT_RETENTION_DAYS`), luego se borra solo |
| **Anunciantes** | Personas de contacto de los negocios | Nombre, correo, teléfono, dirección, montos | Gestionar campañas y facturar | Base PostgreSQL | Mientras dure la relación y lo que exija SUNAT |

No son banco de datos personales: los lectores no se registran. Los «me
gusta» y las vistas usan un id aleatorio guardado en su navegador, sin
nombre ni correo.

Proveedores (encargados), con flujo transfronterizo: Cloudflare (CDN,
seguridad y R2) y el proveedor del VPS. Si se activan: Google (AdSense y
Analytics). YouTube solo carga cuando la persona toca un video.

## 6. Procedimiento ante un incidente de seguridad

1. **Contener:** cambiar contraseñas y secretos afectados (`JWT_SECRET`,
   llaves de R2 y de la base) y desactivar las cuentas comprometidas desde el
   panel → Trabajadores.
2. **Registrar:** qué pasó, cuándo, qué datos y a cuántas personas afecta. El
   registro de auditoría del panel es la fuente.
3. **Comunicar:** a la ANPD, dentro del plazo que fija el reglamento
   (D.S. 016-2024-JUS; confirmar con el abogado), y a las personas
   afectadas si sus datos estuvieron expuestos.
4. **Recuperar:** restaurar desde el último backup sano
   (`scripts/restore.sh`).
5. **Aprender:** buscar la causa raíz, corregirla con prueba automática y
   documentarla en `CONTEXTO.md` (ITIL: gestión de problemas).

## 7. Pendientes del dueño (fuera del código)

- [ ] Configurar el correo de contacto (panel → Configuración): activa el canal ARCO y `/contacto` completo.
- [ ] Inscribir los 3 bancos de datos de la §5 ante la ANPD.
- [ ] RUC y comprobantes electrónicos SUNAT antes de cobrar la primera campaña.
- [ ] Revisión de `/privacidad` y `/terminos` con un abogado antes del lanzamiento.
- [ ] Activar la copia de backups fuera del VPS (`infra/DESPLIEGUE.md` §2.4).
