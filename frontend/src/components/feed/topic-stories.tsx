import Link from "next/link";
import { cn } from "@/lib/utils";

export interface TopicStory {
  categoryId: string;
  name: string;
  slug: string;
  /** Portada ya resuelta (imagen del contenido más reciente del tema), o null. */
  coverUrl: string | null;
  /** Algo publicado en las últimas 48 h: anillo de color, como una historia sin ver. */
  hasNew: boolean;
}

/**
 * Fila de círculos de temas arriba del feed (lo más reconocible de
 * Instagram). Tocar un tema abre su feed filtrado. El anillo verde marca
 * novedades; sin novedades, anillo gris. Deslizable con el dedo.
 */
export function TopicStories({ topics, activeCategoryId }: { topics: TopicStory[]; activeCategoryId?: string }) {
  if (topics.length === 0) return null;
  return (
    <nav aria-label="Temas" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
      <ul className="flex w-max gap-4 py-2">
        {topics.map((topic) => {
          const active = topic.categoryId === activeCategoryId;
          return (
            <li key={topic.categoryId}>
              <Link
                href={`/categorias/${topic.slug}`}
                aria-current={active ? "page" : undefined}
                className="group flex w-[4.5rem] flex-col items-center gap-1.5"
              >
                <span
                  className={cn(
                    "rounded-full p-[3px] transition-transform group-active:scale-95 motion-reduce:transform-none",
                    topic.hasNew ? "bg-linear-to-tr from-accent-fill via-emerald-400 to-lime-300" : "bg-border",
                    active && "outline-2 outline-offset-2 outline-foreground",
                  )}
                >
                  <span className="block rounded-full bg-surface p-[2px]">
                    {topic.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- miniatura de 60 px (subida o enlace externo)
                      <img src={topic.coverUrl} alt="" className="h-[3.75rem] w-[3.75rem] rounded-full object-cover" />
                    ) : (
                      <span aria-hidden="true" className="flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-full bg-accent-soft text-lg font-black text-accent">
                        {topic.name.charAt(0)}
                      </span>
                    )}
                  </span>
                </span>
                <span className={cn("w-full truncate text-center text-xs", active ? "font-bold text-foreground" : "text-foreground")}>
                  {topic.name}
                  {topic.hasNew && <span className="sr-only"> (nuevo)</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
