/**
 * Estilo del texto largo (HTML del editor, ya saneado en el backend) en las
 * páginas de detalle: el mismo en todos los tipos, para que leer una
 * celebración se sienta igual que leer una publicación. Cita destacada con
 * borde de acento; imágenes y subtítulos sin líneas ni sombras (la
 * separación es el espacio, como el resto del sitio).
 */
export const PROSE = `prose prose-theme sm:prose-lg max-w-none
  prose-headings:font-bold prose-headings:tracking-tight
  prose-h2:mt-10 prose-h2:text-2xl
  prose-h3:mt-8 prose-h3:text-xl
  prose-a:text-accent
  prose-blockquote:border-l-accent prose-blockquote:not-italic prose-blockquote:font-semibold
  prose-blockquote:text-xl prose-blockquote:leading-snug prose-blockquote:text-foreground
  prose-blockquote:before:content-none prose-blockquote:after:content-none
  prose-img:rounded-card`;
