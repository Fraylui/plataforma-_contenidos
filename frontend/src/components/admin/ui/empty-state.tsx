import { AdminLinkButton } from "./admin-button";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { href: string; label: string };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="mt-6 flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? <p className="text-sm text-muted">{description}</p> : null}
      {action ? (
        <div className="mt-2">
          <AdminLinkButton href={action.href}>{action.label}</AdminLinkButton>
        </div>
      ) : null}
    </div>
  );
}
