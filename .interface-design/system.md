# Sistema de diseño — panel administrativo

Regenerado 2026-09-15 desde el código real tras el pase de modernización
(paleta Slate + acento verde, formularios de dos columnas). La versión
anterior de este documento describía un sistema (acento terracota/adobe,
tipografía serif Newsreader) que ya no existe en el código — no usarla como
referencia.

## Dirección y sensación

Panel de gestión de una plataforma de contenidos operada por una sola
persona (fundador solo, sin redacción con múltiples periodistas) — moderno,
funcional, sin ornamento editorial de "sala de redacción". Los 5 tipos de
contenido (Publicaciones, Eventos, Lugares, Directorio, Galerías) comparten
exactamente el mismo lenguaje de formulario; ningún tipo debe sentirse como
un apéndice.

## Tokens (`frontend/src/app/globals.css`)

```
--background --surface --foreground --muted --border
--accent --accent-foreground --accent-soft
```

Un solo acento: verde (`#166534` en modo claro, `#4ade80` en modo oscuro).
Nunca introducir un segundo hue — variar solo intensidad vía opacidad
(`accent/15`…`accent`, o el derivado `--accent-soft`) para jerarquía, no
color por categoría.

## Tipografía

Sans (Inter) en todo el panel — labels, headings, cifras, texto de cuerpo.
No hay uso de `font-serif` en el admin (a diferencia de una iteración
anterior de este sistema). Labels de sección en mayúsculas trackeadas:
`text-xs font-medium tracking-wide text-muted uppercase`.

## Depth / bordes

Regla base: **solo bordes** (`border-border`, 71 usos) en superficies en
reposo — cards, tablas, inputs, formularios. Sin sombra en estos casos.

**Excepción documentada** (no es una regla rota): elementos flotantes/overlay
que se posicionan *sobre* el contenido sí usan sombra para leerse como capa
elevada — `combobox.tsx` (`shadow-lg`), `dropdown-menu.tsx` (`shadow-lg`),
`dialog.tsx`/`alert-dialog.tsx` (`shadow-xl`), tarjeta de login
(`shadow-sm`). Aplica solo a overlays/popovers/modales, nunca a una card o
tabla en el flujo normal de la página.

## Radios

- `rounded-md` — el más usado (52), para inputs, botones, filas de tabla.
- `rounded-xl` — cards contenedoras (`SectionCard`, diálogos, tarjeta de
  login) — 16 usos.
- `rounded-lg` — overlays flotantes (combobox, dropdown-menu) — 13 usos.
- `rounded-full` — pills de estado (`StatusPill`), avatares, badges — 9 usos.

## Espaciado

- Cards: `p-5` (patrón dominante, 8 usos) para el padding interior de una
  `SectionCard`; `p-6`/`p-8` solo para diálogos modales y la tarjeta de
  login (contenedores centrados, no parte del flujo de formulario).
- Ritmo vertical entre secciones de un formulario: `space-y-6` (17 usos).
- Ritmo vertical dentro de una card/sección: `space-y-4` (patrón de
  `SectionCard`) o `space-y-2`/`space-y-3` para grupos más apretados
  (label + input, filas de lista).
- Gaps horizontales: `gap-2` (más común, botones/badges en fila), `gap-4`
  (grids de formulario), `gap-6` (columnas del layout de dos columnas).

## Patrones de componente reutilizables

**Card de sección** (`SectionCard`, `frontend/src/components/admin/ui/section-card.tsx`
— extraído del duplicado que existía en 5 formularios de contenido):
`rounded-xl border border-border/60 bg-surface p-5 space-y-4`, título
`text-sm font-semibold text-foreground`. Es el bloque base de cualquier
agrupación de campos.

**Sección colapsable** (`CollapsibleSection`, mismo archivo): igual
contenedor que `SectionCard` pero cerrado por defecto con toggle
(`ChevronDown` rotable) — para lo avanzado/opcional (SEO) que no debe
competir visualmente con el contenido principal.

**Formulario de contenido de dos columnas** (referencia:
`frontend/src/components/admin/article-form.tsx`, mismo patrón en
event-form/place-form/business-form/gallery-form): `grid grid-cols-1 gap-6
lg:grid-cols-[1fr_340px] lg:items-start` — columna principal (Contenido +
SEO colapsable) a la izquierda, columna angosta (Publicar + Organización +
Medios) a la derecha, visible sin scrollear todo el formulario.

**Combobox en vez de `<select>` nativo** (`components/admin/ui/combobox.tsx`):
usado en todos los formularios de contenido para selects con estilo
consistente. Excepción legítima: formularios GET server-rendered sin estado
de cliente (ej. filtro de `/admin/auditoria`) siguen usando `<select>`
nativo por necesidad técnica, no por inconsistencia — si se retoma ese caso,
al menos alinear el estilo visual (chevron custom) aunque siga siendo nativo.

**Barra de proceso/pipeline, fila de índice, roster con barras** (ver
`stats-dashboard.tsx`): patrones específicos de pantallas de datos/analítica
(hoy solo Estadísticas) — no aplican a formularios ni tablas CRUD. Ver el
propio archivo como referencia si se agrega una nueva pantalla de datos
agregados.

## Referencia de implementación

`frontend/src/components/admin/article-form.tsx` +
`frontend/src/components/admin/ui/section-card.tsx` — el par formulario +
primitivas compartidas más reciente y más reutilizado (5 formularios de
contenido lo siguen). Punto de partida para cualquier formulario nuevo.
