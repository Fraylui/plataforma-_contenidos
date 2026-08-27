# Sistema de diseño — panel administrativo

## Dirección y sensación

Panel editorial de un medio de contenidos local (Perú/Ayacucho, CONTEXTO.md
sección 1). Para pantallas de **datos/visualización** (no formularios ni
tablas CRUD), el lenguaje visual es el de una redacción de diario: cierre de
edición, línea de producción editorial, índice de sección, colofón/staff —
no un dashboard SaaS genérico de tarjetas con íconos.

Las tablas CRUD (Categorías, Geografía, Usuarios) y los formularios
(Configuración, crear artículo) siguen el patrón simple ya establecido:
Tailwind directo sobre tokens, tabla con `border-border`/`bg-surface`,
formularios con `input`/`select` estándar. Esta sección es solo para
pantallas nuevas de **datos agregados/visualización** (ej. futuras
pantallas de auditoría, analítica).

## Tokens (ya existentes en globals.css — no se agregan nuevos)

```
--background --surface --foreground --muted --border
--accent --accent-foreground --accent-soft
```

Un solo acento (hoy terracota/adobe, placeholder de marca — sección 14).
Nunca introducir un segundo hue: variar solo **intensidad** vía opacidad
(`bg-accent/20` … `bg-accent`) para comunicar progresión/orden, no colores
distintos por categoría.

## Tipografía

- `font-serif` (Newsreader) para headings Y para cifras destacadas
  (`tabular-nums`) — las cifras de "cierre de edición" se leen como un
  titular, no como una etiqueta de UI.
- `font-sans` (Inter, default) para labels, texto de apoyo, navegación.
- Labels de sección en mayúsculas trackeadas: `text-xs font-medium
  tracking-wide text-muted uppercase`.

## Depth / bordes

Solo bordes (`border-border`), sin sombras. Consistente con el resto del
panel admin (tablas, cards de geografía/categorías).

## Patrones de componente (reutilizables cuando se repita el caso)

**Barra de proceso/pipeline** (ver `stats-dashboard.tsx`, sección "Línea
editorial"): segmentos horizontales proporcionales a conteos, orden real
del proceso de negocio (no alfabético), intensidad de acento creciente
hacia el estado "final deseado". Usar para cualquier flujo con estados
secuenciales (editorial, moderación, etc.), nunca un donut/pie genérico.

**Fila de índice** (`IndexRow` en `stats-dashboard.tsx`): `label —
guía de puntos (border-dotted) — valor en font-serif tabular-nums`. Para
listas cortas de "conteo total / activos" tipo sumario.

**Roster/staff con barras** (`RoleRoster`): label fijo + barra
proporcional (`bg-border` de fondo, `bg-accent` relleno) + valor numérico
a la derecha. Para desgloses por categoría (roles, tipos) cuando hay
pocas filas (<10) y el orden importa más que la exactitud de un chart.

**Cifras de cierre de edición**: grid con `divide-x divide-border`,
número grande `font-serif text-3xl tabular-nums`, label debajo en
mayúsculas pequeñas. Para 3–4 KPIs destacados al tope de una pantalla de
datos.

## Referencia de implementación

`frontend/src/components/admin/stats-dashboard.tsx` — primera pantalla
que aplica este sistema. Punto de partida para la próxima pantalla de
datos/visualización del panel.
