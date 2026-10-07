import { Plus } from "@phosphor-icons/react/dist/ssr";
import { LinkButton } from "@/components/ui";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  action?: { href: string; label: string };
}

export function AdminPageHeader({ title, description, action }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-title font-bold text-foreground">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-[15px] text-muted">{description}</p> : null}
      </div>
      {action ? (
        <LinkButton href={action.href} size="lg" icon={<Plus weight="bold" aria-hidden="true" />}>
          {action.label}
        </LinkButton>
      ) : null}
    </div>
  );
}
