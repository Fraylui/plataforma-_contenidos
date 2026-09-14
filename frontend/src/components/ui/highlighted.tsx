/**
 * Minúsculas y sin tildes, para comparar — el buscador tolera acentos
 * (Postgres unaccent, V36__search_unaccent.sql), el resaltado debe seguir
 * el mismo criterio o "peru" no marcaría nada en "Perú".
 */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Resalta la primera coincidencia del término buscado dentro de un texto —
 * usado tanto por las sugerencias en vivo del header (search-box.tsx) como
 * por los resultados de /buscar (search-result-card.tsx), mismo criterio
 * visual en los dos lugares. La comparación ignora acentos (normalize), pero
 * el fragmento resaltado se recorta del texto ORIGINAL (con sus tildes), así
 * que "peru" resalta "Perú" tal cual se ve, no una versión sin acentos.
 */
export function Highlighted({ text, query }: { text: string; query: string }) {
  const trimmed = query.trim();
  if (!trimmed) return <>{text}</>;
  const index = normalize(text).indexOf(normalize(trimmed));
  if (index === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-accent-soft text-accent">{text.slice(index, index + trimmed.length)}</mark>
      {text.slice(index + trimmed.length)}
    </>
  );
}
