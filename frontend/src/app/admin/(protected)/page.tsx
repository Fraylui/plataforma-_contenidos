import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Clock, Eye, FileText, FolderTree } from "lucide-react";
import { requireAdminUser } from "@/lib/admin/auth";
import {
  getAdminStats,
  listAdminArticles,
  listAdminAuditLog,
  listAdminBusinesses,
  listAdminEvents,
  listAdminGalleries,
  listAdminPlaces,
  listAdminReviews,
} from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { roleLabel } from "@/lib/admin/role-labels";
import { visibleNavItems } from "@/lib/admin/nav";
import { articleStatusLabel, articleStatusTone, formatPublishedDate, humanizeAuditAction } from "@/lib/content-labels";
import { StatCard, StatusPill } from "@/components/admin/ui";
import { CreateNewMenu } from "@/components/admin/create-new-menu";
import type { PlatformStats } from "@/lib/api/admin-types";
import type { ArticleStatus } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Panel administrativo",
  robots: "noindex,nofollow",
};

const QUICK_CREATE: { label: string; href: string; navHref: string }[] = [
  { label: "Publicación", href: "/admin/publicaciones/nuevo", navHref: "/admin/publicaciones" },
  { label: "Lugar", href: "/admin/lugares/nuevo", navHref: "/admin/lugares" },
  { label: "Evento", href: "/admin/eventos/nuevo", navHref: "/admin/eventos" },
  { label: "Galería", href: "/admin/galerias/nuevo", navHref: "/admin/galerias" },
  { label: "Reseña", href: "/admin/resenas/nuevo", navHref: "/admin/resenas" },
  { label: "Ficha de directorio", href: "/admin/directorio/nuevo", navHref: "/admin/directorio" },
];

interface ContentItem {
  id: string;
  title: string;
  typeLabel: string;
  status: ArticleStatus;
  createdAt: string;
  editHref: string;
}

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
  const canSeeAudit = allowedHrefs.has("/admin/auditoria");

  const [statsResult, contentItems, auditResult] = await Promise.all([
    canSeeStats ? fetchOrAccessDenied(() => getAdminStats(accessToken)) : Promise.resolve(null),
    loadContentItems(accessToken, allowedHrefs),
    canSeeAudit ? fetchOrAccessDenied(() => listAdminAuditLog(accessToken, { size: 8 })) : Promise.resolve(null),
  ]);
  const stats = statsResult && "data" in statsResult ? statsResult.data : null;
  const summary = stats ? summarize(stats) : null;
  const auditEvents = auditResult && "data" in auditResult ? auditResult.data.items : [];

  const recentContent = [...contentItems].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  const pendingReview = contentItems
    .filter((item) => item.status === "IN_REVIEW")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Bienvenido, {user.firstName} {user.lastName}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">{roleLabel(user.role)}</span>
            <span>
              {new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}
            </span>
          </p>
        </div>
        <CreateNewMenu items={quickCreate} />
      </div>

      {user.role === "SUPER_ADMIN" && !user.mfaEnabled && <MfaStatusNotice />}

      {pendingReview.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-medium text-accent">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            {pendingReview.length} {pendingReview.length === 1 ? "publicación espera" : "publicaciones esperan"} revisión.
          </p>
          <Link
            href={pendingReview[0].editHref}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition-opacity hover:opacity-90"
          >
            Revisar ahora
          </Link>
        </div>
      )}

      {summary && stats && (
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Publicado" value={summary.published} icon={FileText} />
          <StatCard label="Pendiente de revisión" value={summary.pending} icon={Clock} accent={summary.pending > 0} />
          <StatCard label="Categorías activas" value={stats.activeCategories} icon={FolderTree} />
          <StatCard
            label="Publicado (30 días)"
            value={stats.articlesPublishedLast30Days}
            icon={Eye}
            hint="Solo publicaciones — sin métricas de tráfico todavía"
          />
        </div>
      )}

      {canSeeStats && (
        <Link href="/admin/estadisticas" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
          Ver estadísticas completas →
        </Link>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">Contenido reciente</h2>
          {recentContent.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Todavía no hay contenido creado.</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-lg border border-border/60 bg-surface">
              <table className="w-full min-w-max text-left text-sm">
                <thead className="border-b border-border/60 text-xs text-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Título</th>
                    <th className="px-4 py-2.5 font-medium">Tipo</th>
                    <th className="px-4 py-2.5 font-medium">Estado</th>
                    <th className="px-4 py-2.5 font-medium">Creado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentContent.map((item) => (
                    <tr key={item.editHref} className="border-b border-border/60 last:border-0 hover:bg-accent-soft/40">
                      <td className="px-4 py-2.5">
                        <Link href={item.editHref} className="font-medium text-foreground hover:text-accent hover:underline">
                          {item.title}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-muted">{item.typeLabel}</td>
                      <td className="px-4 py-2.5">
                        <StatusPill tone={articleStatusTone(item.status)} label={articleStatusLabel(item.status)} />
                      </td>
                      <td className="px-4 py-2.5 text-muted">{formatPublishedDate(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {pendingReview.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground">Pendientes de revisión</h2>
              <ul className="mt-3 space-y-2">
                {pendingReview.slice(0, 6).map((item) => (
                  <li key={item.editHref}>
                    <Link
                      href={item.editHref}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-surface px-3 py-2.5 text-sm transition-colors hover:border-accent"
                    >
                      <span className="min-w-0 truncate font-medium text-foreground">{item.title}</span>
                      <span className="shrink-0 text-xs text-muted">{item.typeLabel}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {canSeeAudit && (
            <div>
              <h2 className="text-sm font-semibold text-foreground">Actividad reciente del sistema</h2>
              {auditEvents.length === 0 ? (
                <p className="mt-3 text-sm text-muted">Sin actividad registrada todavía.</p>
              ) : (
                <ul className="mt-3 space-y-3 border-l border-border/60 pl-4">
                  {auditEvents.map((event) => (
                    <li key={event.id} className="relative text-sm">
                      <span className="absolute top-1.5 -left-[1.1rem] h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                      <p className="text-foreground">
                        {event.actorEmail ?? "Sistema"} — {humanizeAuditAction(event.action)}
                      </p>
                      <p className="text-xs text-muted">{formatPublishedDate(event.occurredAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/admin/auditoria" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
                Ver auditoría completa →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

async function loadContentItems(accessToken: string, allowedHrefs: Set<string>): Promise<ContentItem[]> {
  const loaders: Promise<ContentItem[]>[] = [];

  if (allowedHrefs.has("/admin/publicaciones")) {
    loaders.push(
      listAdminArticles(accessToken).then((items) =>
        items.map((a) => ({ id: a.id, title: a.title, typeLabel: "Publicación", status: a.status, createdAt: a.createdAt, editHref: `/admin/publicaciones/${a.id}` })),
      ).catch(() => []),
    );
  }
  if (allowedHrefs.has("/admin/lugares")) {
    loaders.push(
      listAdminPlaces(accessToken).then((items) =>
        items.map((p) => ({ id: p.id, title: p.name, typeLabel: "Lugar", status: p.status, createdAt: p.createdAt, editHref: `/admin/lugares/${p.id}` })),
      ).catch(() => []),
    );
  }
  if (allowedHrefs.has("/admin/eventos")) {
    loaders.push(
      listAdminEvents(accessToken).then((items) =>
        items.map((e) => ({ id: e.id, title: e.title, typeLabel: "Evento", status: e.status, createdAt: e.createdAt, editHref: `/admin/eventos/${e.id}` })),
      ).catch(() => []),
    );
  }
  if (allowedHrefs.has("/admin/galerias")) {
    loaders.push(
      listAdminGalleries(accessToken).then((items) =>
        items.map((g) => ({ id: g.id, title: g.title, typeLabel: "Galería", status: g.status, createdAt: g.createdAt, editHref: `/admin/galerias/${g.id}` })),
      ).catch(() => []),
    );
  }
  if (allowedHrefs.has("/admin/resenas")) {
    loaders.push(
      listAdminReviews(accessToken).then((items) =>
        items.map((r) => ({ id: r.id, title: r.title, typeLabel: "Reseña", status: r.status, createdAt: r.createdAt, editHref: `/admin/resenas/${r.id}` })),
      ).catch(() => []),
    );
  }
  if (allowedHrefs.has("/admin/directorio")) {
    loaders.push(
      listAdminBusinesses(accessToken).then((items) =>
        items.map((b) => ({ id: b.id, title: b.name, typeLabel: "Directorio", status: b.status, createdAt: b.createdAt, editHref: `/admin/directorio/${b.id}` })),
      ).catch(() => []),
    );
  }

  const results = await Promise.all(loaders);
  return results.flat();
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
