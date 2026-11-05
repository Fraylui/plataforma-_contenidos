import Link from "next/link";
import { REACTIONS, topReactions, type ReactionKey } from "@/components/content/reaction-bar";
import { cn } from "@/lib/utils";

/**
 * Resumen de reacciones en la tarjeta del feed: los íconos más usados
 * encimados y cuántas personas reaccionaron, como en Facebook. Lleva a las
 * reacciones dentro del post. Sin reacciones no se muestra nada.
 */
export function ReactionPeek({ href, counts }: { href: string; counts?: Partial<Record<ReactionKey, number>> }) {
  if (!counts) return null;
  const full = Object.fromEntries(REACTIONS.map((r) => [r.key, counts[r.key] ?? 0])) as Record<ReactionKey, number>;
  const total = REACTIONS.reduce((sum, r) => sum + full[r.key], 0);
  if (total === 0) return null;
  const top = topReactions(full);
  const names = top.map((key) => REACTIONS.find((r) => r.key === key)!.label).join(", ");

  return (
    <Link
      href={`${href}#reacciones`}
      className="inline-flex min-h-8 items-center gap-1.5 rounded-full text-[13px] text-muted outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring"
    >
      <span className="flex -space-x-1.5" aria-hidden="true">
        {top.map((key) => {
          const r = REACTIONS.find((x) => x.key === key)!;
          const ReactionIcon = r.icon;
          return (
            <span key={key} className={cn("flex size-5 items-center justify-center rounded-full bg-linear-to-br text-white ring-2 ring-surface", r.color)}>
              <ReactionIcon weight="fill" className="size-3" />
            </span>
          );
        })}
      </span>
      <span>
        <span className="font-semibold tabular-nums text-foreground">{total}</span> {total === 1 ? "reacción" : "reacciones"}
      </span>
      <span className="sr-only">: {names}</span>
    </Link>
  );
}
