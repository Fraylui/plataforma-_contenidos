/** Menos bloques que esto = texto corto: el enlace del medio estorbaría más de lo que ayuda. */
const MIN_BLOCKS = 6;

/**
 * Parte el HTML de una publicación (ya saneado en el backend) en dos
 * mitades por un borde de párrafo de primer nivel, para meter entre ellas
 * «También te puede interesar». Nunca corta dentro de una lista o una cita
 * (Tiptap pone <p> dentro de <li> y <blockquote>). null = texto corto o sin
 * un borde seguro: se muestra entero.
 */
export function splitBodyInHalf(html: string): [string, string] | null {
  const boundaries: number[] = [];
  let depth = 0;
  const tag = /<(\/?)(ul|ol|blockquote|p|h2|h3)\b[^>]*>/gi;
  for (let match = tag.exec(html); match; match = tag.exec(html)) {
    const closing = match[1] === "/";
    const name = match[2].toLowerCase();
    if (name === "ul" || name === "ol" || name === "blockquote") {
      depth += closing ? -1 : 1;
      if (closing && depth === 0) boundaries.push(tag.lastIndex);
    } else if (closing && depth === 0) {
      boundaries.push(tag.lastIndex);
    }
  }
  if (boundaries.length < MIN_BLOCKS) return null;
  // Tras un párrafo (no tras un subtítulo, que quedaría separado de su texto).
  const middle = boundaries.length / 2;
  const candidates = boundaries.filter((end) => /<\/p>$/i.test(html.slice(0, end)));
  if (candidates.length === 0) return null;
  const cut = candidates.reduce((best, end) =>
    Math.abs(boundaries.indexOf(end) + 1 - middle) < Math.abs(boundaries.indexOf(best) + 1 - middle) ? end : best,
  );
  return [html.slice(0, cut), html.slice(cut)];
}
