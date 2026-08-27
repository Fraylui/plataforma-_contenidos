import { getPlatformSettings } from "@/lib/api/client";

export async function SiteFooter() {
  const settings = await getPlatformSettings();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-muted sm:px-6">
        <p>
          © {year} {settings.name}. Contenido publicado bajo revisión editorial.
        </p>
      </div>
    </footer>
  );
}
