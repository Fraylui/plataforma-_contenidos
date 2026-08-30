import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/auth";
import { getAdminStats } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { roleLabel } from "@/lib/admin/role-labels";
import { visibleNavItems } from "@/lib/admin/nav";
import type { PlatformStats } from "@/lib/api/admin-types";
import type { ArticleStatus } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Panel administrativo",
  robots: "noindex,nofollow",
};

const QUICK_CREATE: { label: string; href: string; navHref: string }[] = [
  { label: "Publicación", href: "/admin/articulos/nuevo", navHref: "/admin/articulos" },
  { label: "Lugar", href: "/admin/lugares/nuevo", navHref: "/admin/lugares" },
  { label: "Evento", href: "/admin/eventos/nuevo", navHref: "/admin/eventos" },
  { label: "Galería", href: "/admin/galerias/nuevo", navHref: "/admin/galerias" },
  { label: "Reseña", href: "/admin/resenas/nuevo", navHref: "/admin/resenas" },
  { label: "Ficha de directorio", href: "/admin/directorio/nuevo", navHref: "/admin/directorio" },
];

function sumStatus(byStatus: Record<ArticleStatus, number>, statuses: ArticleStatus[]): number {
  return statuses.reduce((total, status) => total + (byStatus[status] ?? 0), 0);
}

function summarize(stats: PlatformStats) {
  const allByStatus = [
    stats.articlesByStatus,
    stats.placesByStatus,
    stats.eventsByStatus,
    stats.galleriesByStatus,
    stats.reviewsByStatus,
    stats.businessesByStatus,
  ];
  const published = allByStatus.reduce((total, byStatus) => total + sumStatus(byStatus, ["PUBLISHED"]), 0);
  const pending = allByStatus.reduce(
    (total, byStatus) => total + sumStatus(byStatus, ["DRAFT", "IN_REVIEW", "APPROVED"]),
    0,
  );
  return { published, pending };
}

export default async function AdminDashboardPage() {
  const { user, accessToken } = await requireAdminUser();
  const allowedHrefs = new Set(visibleNavItems(user.role).map((item) => item.href));
  const quickCreate = QUICK_CREATE.filter((item) => allowedHrefs.has(item.navHref));
  const canSeeStats = allowedHrefs.has("/admin/estadisticas");
  const statsResult = canSeeStats ? await fetchOrAccessDenied(() => getAdminStats(accessToken)) : null;
  const stats = statsResult && "data" in statsResult ? statsResult.data : null;
  const summary = stats ? summarize(stats) : null;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-foreground">Bienvenido, {user.firstName} {user.lastName}</h1>
      <p className="mt-2 text-sm text-muted">
        Sesión activa como <strong className="text-foreground">{roleLabel(user.role)}</strong> ({user.email}).
      </p>

      {user.role === "SUPER_ADMIN" && !user.mfaEnabled && <MfaStatusNotice />}

      {summary && stats && (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <SummaryTile label="Publicado" value={summary.published} />
          <SummaryTile label="Pendiente de revisión" value={summary.pending} accent={summary.pending > 0} />
          <SummaryTile label="Categorías activas" value={stats.activeCategories} />
        </div>
      )}

      {canSeeStats && (
        <Link href="/admin/estadisticas" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
          Ver estadísticas completas →
        </Link>
      )}

      {quickCreate.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-medium tracking-wide text-muted uppercase">Crear contenido</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {quickCreate.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-accent hover:text-accent"
              >
                + {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryTile({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <p className={`text-3xl font-extrabold tabular-nums ${accent ? "text-accent" : "text-foreground"}`}>{value}</p>
      <p className="mt-1 text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
    </div>
  );
}

function MfaStatusNotice() {
  return (
    <div className="mt-4 rounded-md border border-accent/40 bg-accent-soft px-4 py-3 text-sm text-accent">
      Como super administrador, la autenticación en dos pasos es obligatoria (CONTEXTO.md §36.5) y todavía no la
      configuraste.{" "}
      <Link href="/admin/mfa-setup" className="font-medium underline underline-offset-2">
        Actívala ahora
      </Link>
      .
    </div>
  );
}
