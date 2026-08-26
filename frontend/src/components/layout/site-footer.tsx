import { platformPlaceholder } from "@/lib/platform-placeholder";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-muted sm:px-6">
        <p>
          © {year} {platformPlaceholder.name}. Contenido publicado bajo
          revisión editorial.
        </p>
      </div>
    </footer>
  );
}
