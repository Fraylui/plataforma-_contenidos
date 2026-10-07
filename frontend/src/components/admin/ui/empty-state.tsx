import { Plus, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { LinkButton } from "@/components/ui";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { href: string; label: string };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="mt-6 flex flex-col items-center gap-2 rounded-card bg-surface px-6 py-14 text-center shadow-card">
      <span className="mb-1 flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Sparkle weight="fill" className="size-6" aria-hidden="true" />
      </span>
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description ? <p className="max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? (
        <div className="mt-3">
          <LinkButton href={action.href} icon={<Plus weight="bold" aria-hidden="true" />}>
            {action.label}
          </LinkButton>
        </div>
      ) : null}
    </div>
  );
}
