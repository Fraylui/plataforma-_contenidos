# DESIGN.md — Plataforma de contenidos

Sistema de diseño del sitio público y del panel, en el formato de
[DESIGN.md](https://stitch.withgoogle.com/docs/design-md/overview/) que leen los
agentes de código. La fuente de verdad son los tokens de
`frontend/src/app/globals.css`; este documento explica cómo usarlos. Si el código
y este archivo no coinciden, se corrige uno de los dos en el mismo commit.

## Overview

Una plataforma de contenidos moderna (no un diario, no "editorial") que se usa
como una red social: feed con posts, detalle tipo Instagram/Facebook, reacciones
(solo «me gusta» y compartir), videos que viven en YouTube. Un solo dueño la
opera. El objetivo de cada pantalla es que la persona se quede y vea una página
más: el ingreso es AdSense.

Sensación: limpia, rápida, táctil. Neutros neutros (escala Slate), un solo verde
de marca para acción e identidad, fotos grandes. Sigue el tema del dispositivo
(claro/oscuro) sin selector.

## Colors

Todos los colores son tokens (`bg-surface`, `text-muted`…). Nunca un hex en un
componente.

### Brand & Accent
| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `accent` | `#06752b` | `#0bda51` | Texto, enlaces, íconos activos, bordes de marca |
| `accent-fill` | `#0bda51` | `#0bda51` | Rellenos: botón primario, píldora activa, pestaña activa |
| `accent-foreground` | `#0f172a` | `#0f172a` | Texto sobre `accent-fill` (oscuro, nunca blanco) |
| `accent-soft` | accent 15 % sobre surface | 18 % | Fondos suaves de marca (avisos, chips, tarjeta relacionada) |

Un solo matiz verde. La jerarquía se hace con intensidad, nunca con un segundo color.

### Surface
| Token | Claro | Uso |
|---|---|---|
| `canvas` | `#f0f2f5` | Lienzo del sitio público (gris de Facebook) |
| `canvas-strong` / `canvas-border` | `#e4e6eb` / `#dadde1` | Hover sobre lienzo, separaciones sobre lienzo |
| `background` | `#f8fafc` | Fondo del panel |
| `surface` | `#ffffff` | Tarjetas, menús, hojas |
| `field` / `field-hover` / `field-border` | `#f1f5f9` … | Campos de formulario (un tono bajo la tarjeta, borde translúcido) |

En oscuro el lienzo lleva 6 % del verde sobre slate-900; las tarjetas son slate-800.

### Text
`foreground` (slate-900 / slate-100) y `muted` (slate-600 / slate-400, ≥ 6.7:1 sobre
el lienzo). Prosa larga: `prose prose-theme` (cuerpo al 88 % de foreground).

### Semantic
`success`, `warning`, `info`, `danger` con su `-soft` para el fondo y
`danger-ink` para texto de error. Rojo solo para errores y acciones destructivas.
Estados siempre con texto o ícono, nunca solo color.

## Typography

### Font Family
Inter (`--font-sans`, `next/font`), en todo: sitio y panel. Sin serif.

### Hierarchy
| Rol | Clase |
|---|---|
| Título de página del panel | `text-title` (30/36, −0.02em) |
| Título de post (detalle) | `text-2xl sm:text-3xl font-extrabold tracking-tight text-balance` |
| Título de tarjeta | `font-bold leading-snug` |
| Etiqueta de campo | `text-label font-medium` (13/20) |
| Meta (tipo · tema · tiempo) | `text-xs text-muted` |
| Cuerpo largo | `prose sm:prose-lg` |

### Principles
- Sin antetítulos en mayúsculas ni entradillas en negrita (eso es de diario).
- Fechas: publicaciones en relativo («hace 2 h»); celebraciones, lugares y el resto en absoluto («vie 12 dic, 7 pm»).
- `tabular-nums` en cifras que cambian (contadores, estadísticas).

## Layout

### Spacing System
Escala de Tailwind en pasos de 4 px. Ritmo habitual: `gap-2` entre íconos y
botones, `gap-3`/`gap-4` en tarjetas, `space-y-4` dentro de una tarjeta,
`space-y-6` entre tarjetas del panel. Padding de tarjeta: `p-5` (panel), `px-4 py-3` (encabezado de post).

### Grid & Container
- Shell público: riel izquierdo de íconos (76 px, 1024–1279 px) o con texto
  (`17.5rem`, ≥ 1280 px); barra de pestañas inferior por debajo de 1024 px
  (`--bottom-bar-h`, incluye la zona segura del iPhone).
- Feed: columna de `630px` + barra lateral desde `lg`.
- Detalle: `max-w-[1040px]`; variante visual en dos columnas (medio fijo a la
  izquierda, texto a la derecha); variante texto en columna de `680px`.
- Explorar / cuadrículas: `max-w-[935px]` (medida de Instagram).
- Panel: formularios de dos columnas `lg:grid-cols-[1fr_340px]` con techo `max-w-6xl`.

### Whitespace Philosophy
La separación es el espacio, no las líneas. Sin divisores entre posts ni bordes
duros en reposo; ningún hueco vacío sin propósito (medirlo en el navegador).

## Elevation & Depth
| Token | Uso |
|---|---|
| `shadow-card` | Tarjetas en reposo (sitio y panel) |
| `shadow-pop` | Menús, combobox, popovers |
| `shadow-overlay` | Diálogos y hojas |

En oscuro las sombras suman un borde interior de 4–6 % blanco para separar capas.

## Shapes

### Border Radius Scale
| Token | Valor | Uso |
|---|---|---|
| `rounded-control` | 10 px | Botones, campos, controles |
| `rounded-card` | 16 px | Tarjetas, medios del detalle, bloques |
| `rounded-modal` | 20 px | Diálogos, hojas |
| `rounded-full` | — | Avatares, píldoras, botones de ícono |

### Photography Geometry
Medios de borde a borde en celular; esquinas `rounded-card` desde 640 px.
Proporciones: cuadrado en los tipos visuales, 16:9 en publicaciones, 9:16 para
Shorts. Sin foto: bloque de marca con el título, nunca un hueco gris.

## Components

### Buttons
`components/ui/button.tsx`. Primario: `bg-accent-fill text-accent-foreground`.
Al presionar, respuesta inmediata; foco con anillo `ring-[3px] ring-ring`.

### Cards & Containers
`components/ui/card.tsx` y `SectionCard` (panel): `rounded-card bg-surface shadow-card`.

### Inputs & Forms
`components/ui/field.tsx` + `TextInput`, `TextArea`, `Select` (nativo, abre el
selector del teléfono), `Combobox`, `Checkbox`/`Radio`, `SegmentedControl`,
`DateTimeInput`. Todos comparten `field-styles.ts`.

### Badges & Status
`components/ui/badge.tsx` con tonos `neutral | accent | success | warning | info | danger`.

### Navigation
`components/shell/`: `left-rail`, `bottom-tab-bar`, `top-bar`, buscador lateral
y hoja «Más» cargados al primer toque (`lazy-popup.ts`). Íconos Phosphor; nada de
íconos sin texto ambiguo.

### Signature Components
- `PostCard` / `PostView` (`components/post/`): encabezado con la marca como
  «cuenta» (sin firma de autor), medio, acciones, texto.
- `NativeAdPost`: anuncio con la anatomía de un post, rotulado «Patrocinado».
- `InlineRelated`, `WhatsAppFollow`: caminos para leer una página más o volver.

## Do's and Don'ts

### Do
- Usar tokens semánticos y extender los existentes antes de crear uno nuevo.
- Medir cada pantalla a 390, 768 y 1280 px en claro y oscuro antes de darla por lista.
- Animar solo `transform` y `opacity`, con `ease-out` y 150–250 ms; respetar `prefers-reduced-motion`.
- Mantener el contraste WCAG 2.2 AA (las pruebas axe corren en CI).

### Don't
- Hex o colores de Tailwind sueltos (`bg-red-600`, `text-gray-500`).
- `rounded-2xl`/`rounded-xl` o `shadow-sm/md/lg` cuando existe el token.
- Divisores, barras de desplazamiento visibles o huecos vacíos.
- Lenguaje de diario: «editorial», «artículo», antetítulos, firmas.
- `transition: all`, `scale(0)` o `ease-in` en una entrada.

## Responsive Behavior

### Breakpoints
Los de Tailwind: `sm` 640, `md` 768, `lg` 1024 (aparece el riel, se va la barra
inferior), `xl` 1280 (el riel muestra texto).

### Touch Targets
Mínimo 24 × 24 px (WCAG 2.5.8); acciones principales de 44 px.

### Collapsing Strategy
Debajo de `lg`: barra inferior + barra superior; las acciones del post quedan
fijas sobre la barra inferior. Desde `lg`: riel, feed y barra lateral.

### Image Behavior
`next/image` con `priority` en la primera imagen visible (LCP); sin fundido de
entrada en las prioritarias. Imágenes externas sin optimizador.

## Iteration Guide
1. Revisar con `web-design-guidelines`, `emil-design-eng` y `redesign-existing-projects`.
2. Romper con `break-ui` (datos extremos).
3. Arreglar usando estos tokens.
4. Capturas con `playwright-cli` a 3 anchos, claro y oscuro; mirar y repetir.
5. `tsc`, lint, knip y pruebas; commit por pantalla, borrando lo reemplazado.

## Known Gaps
- `rounded-2xl` (24 usos) y `rounded-xl` (11) conviven con `rounded-card`.
- Sombras de Tailwind sueltas (13 usos) fuera de `shadow-card/pop/overlay`.
- Campos sin uso en Configuración: `primaryColor`, `secondaryColor`, `backgroundColor`, `fontFamily`.
