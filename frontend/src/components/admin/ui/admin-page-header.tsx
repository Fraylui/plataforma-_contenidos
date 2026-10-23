import Link from "next/link";
import { CaretLeft, Plus } from "@phosphor-icons/react/dist/ssr";
import { LinkButton } from "@/components/ui";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  action?: { href: string; label: string };
  /** Volver a la lista (crear y editar): un nivel, sin migas de pan completas. */
  back?: { href: string; label: string };
}

export function AdminPageHeader({ title, description, action, back }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back && (
          <Link
            href={back.href}
            className="mb-1 inline-flex items-center gap-1 rounded-control text-sm font-medium text-muted outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            <CaretLeft weight="bold" aria-hidden="true" className="size-3.5" />
            {back.label}
          </Link>
        )}
        <h1 className="text-title font-bold break-words text-foreground">{title}</h1>
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
