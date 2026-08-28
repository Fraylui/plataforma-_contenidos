import { AdminLinkButton } from "./admin-button";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  action?: { href: string; label: string };
}

export function AdminPageHeader({ title, description, action }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {action ? <AdminLinkButton href={action.href}>{action.label}</AdminLinkButton> : null}
    </div>
  );
}
