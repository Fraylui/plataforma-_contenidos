import Link from "next/link";
import type { ReactNode } from "react";
import type { AdminStory, AdminStoryTab } from "@/lib/api/admin-types";
import { imageUrl } from "@/lib/image-url";
import { STORY_BACKGROUNDS } from "@/lib/stories/backgrounds";
import { cn } from "@/lib/utils";
import { storyTimeLabel } from "./story-time";

const TABS: { tab: AdminStoryTab; label: string; param: string }[] = [
  { tab: "ACTIVE", label: "Activas", param: "activas" },
  { tab: "HIGHLIGHTED", label: "Destacadas", param: "destacadas" },
  { tab: "ENDED", label: "Terminadas (7 días)", param: "terminadas" },
];

/** `?tab=` de la URL → pestaña (por defecto, Activas). */
export function storyTabFromParam(param: string | undefined): AdminStoryTab {
  return TABS.find((t) => t.param === param)?.tab ?? "ACTIVE";
}

export function StoryTabs({ current }: { current: AdminStoryTab }) {
  return (
    <nav aria-label="Historias" className="mt-5 flex gap-1 overflow-x-auto">
      {TABS.map(({ tab, label, param }) => (
        <Link
          key={tab}
          href={`/admin/historias?tab=${param}`}
          aria-current={tab === current ? "page" : undefined}
          className={cn(
            "flex min-h-10 shrink-0 items-center rounded-full px-4 text-sm font-semibold transition-colors",
            tab === current ? "bg-foreground text-background" : "bg-canvas-strong text-foreground hover:bg-border",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Historias del panel en miniaturas 9:16 con su estado y métricas; `renderActions` pone los botones de cada una. */
export function StoryGrid({ stories, now, renderActions }: {
  stories: AdminStory[];
  now: Date;
  renderActions?: (story: AdminStory) => ReactNode;
}) {
  return (
    <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {stories.map((story) => {
        const name = story.caption ?? `Historia de ${story.categoryName}`;
        return (
          <li key={story.id}>
            <article aria-label={name} className="overflow-hidden rounded-card bg-surface shadow-card">
              <div
                className="relative aspect-[9/16] bg-black"
                style={story.imageId ? undefined : { backgroundImage: STORY_BACKGROUNDS[story.background ?? "NIGHT"] }}
              >
                {story.imageId && (
                  // eslint-disable-next-line @next/next/no-img-element -- miniatura del panel, host propio del backend
                  <img src={imageUrl(`/api/v1/images/${story.imageId}/file`)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
                )}
                {story.caption && (
                  <p className="absolute inset-x-0 bottom-0 line-clamp-3 bg-linear-to-t from-black/75 to-transparent p-3 pt-8 text-sm font-semibold break-words text-white">
                    {story.caption}
                  </p>
                )}
                <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                  {storyTimeLabel(story, now)}
                </span>
              </div>
              <div className="space-y-1 p-3">
                <p className="truncate text-sm font-semibold text-foreground">{story.categoryName}</p>
                <p className="text-xs text-muted tabular-nums">
                  {`${plural(story.views, "vista", "vistas")} · ${story.likeCount} me gusta · ${plural(story.ctaClicks, "toque", "toques")}`}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-sm">
                  <Link href={`/admin/historias/${story.id}`} className="font-medium text-accent hover:underline">
                    Editar
                  </Link>
                  {renderActions?.(story)}
                </div>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
