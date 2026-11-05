import { sourceName } from "@/lib/admin/sources";

/**
 * «Fuentes: promperu.gob.pe · inei.gob.pe» al final de un post: discreto,
 * sin formato académico (D.Leg. 822 art. 44: autor y fuente). Sin fuentes
 * no se muestra nada.
 */
export function PostSources({ sources }: { sources: string[] | undefined }) {
  if (!sources || sources.length === 0) return null;
  return (
    <p className="not-prose mt-8 text-xs text-muted">
      <span className="font-semibold">Fuentes:</span>{" "}
      {sources.map((url, index) => (
        <span key={url}>
          {index > 0 && " · "}
          <a href={url} target="_blank" rel="noopener noreferrer nofollow" className="underline-offset-2 hover:underline">
            {sourceName(url)}
          </a>
        </span>
      ))}
    </p>
  );
}
