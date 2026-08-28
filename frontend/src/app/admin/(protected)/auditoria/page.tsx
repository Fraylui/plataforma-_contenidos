import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminAuditLog } from "@/lib/api/admin-client";
import type { AuditResult } from "@/lib/api/admin-types";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminButton, AdminPageHeader, StatusPill, type StatusTone } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Auditoría",
  robots: "noindex,nofollow",
};

const PAGE_SIZE = 30;

const RESULT_LABELS: Record<AuditResult, string> = {
  SUCCESS: "Éxito",
  FAILURE: "Fallo",
};

const RESULT_TONE: Record<AuditResult, StatusTone> = {
  SUCCESS: "success",
  FAILURE: "danger",
};

// Tipos de recurso realmente emitidos hoy por AuditService.record(...) en
// los distintos módulos (ver grep de "auditService.record(" en el backend).
// Es solo para el <select> de filtro — el backend acepta cualquier valor.
const RESOURCE_TYPES = ["article", "place", "image", "user", "platform_settings", "refresh_token"];

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

/** Convierte un <input type="date"> ("YYYY-MM-DD") al Instant que espera el backend. */
function dateParamToInstant(value: string | undefined, endOfDay: boolean): string | undefined {
  if (!value) return undefined;
  return `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`;
}

function buildPageHref(params: Record<string, string | undefined>, page: number): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  query.set("page", String(page));
  return `/admin/auditoria?${query.toString()}`;
}

export default async function AdminAuditPage(props: PageProps<"/admin/auditoria">) {
  const { accessToken } = await requireAdminUser();
  const sp = await props.searchParams;
  const get = (key: string) => {
    const value = sp[key];
    return typeof value === "string" && value.length > 0 ? value : undefined;
  };

  const actorEmail = get("actorEmail");
  const action = get("action");
  const resourceType = get("resourceType");
  const result = get("result") as AuditResult | undefined;
  const from = get("from");
  const to = get("to");
  const page = Number.parseInt(get("page") ?? "0", 10) || 0;

  const result_ = await fetchOrAccessDenied(() =>
    listAdminAuditLog(accessToken, {
      actorEmail,
      action,
      resourceType,
      result,
      from: dateParamToInstant(from, false),
      to: dateParamToInstant(to, true),
      page,
      size: PAGE_SIZE,
    }),
  );
  if ("denied" in result_) return <AccessDenied />;
  const auditPage = result_.data;
  const filterParams = { actorEmail, action, resourceType, result, from, to };

  return (
    <div>
      <AdminPageHeader
        title="Auditoría"
        description="Registro de acciones administrativas y de seguridad (solo lectura, no editable)."
      />

      <form
        method="get"
        className="mt-6 grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-3 lg:grid-cols-6"
      >
        <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
          <label htmlFor="actorEmail" className="text-xs font-medium text-muted">
            Correo del usuario
          </label>
          <input
            id="actorEmail"
            name="actorEmail"
            type="text"
            defaultValue={actorEmail ?? ""}
            placeholder="correo@ejemplo.com"
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus-visible:border-accent"
          />
        </div>
        <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
          <label htmlFor="action" className="text-xs font-medium text-muted">
            Acción
          </label>
          <input
            id="action"
            name="action"
            type="text"
            defaultValue={action ?? ""}
            placeholder="LOGIN_FAILURE…"
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus-visible:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="resourceType" className="text-xs font-medium text-muted">
            Recurso
          </label>
          <select
            id="resourceType"
            name="resourceType"
            defaultValue={resourceType ?? ""}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus-visible:border-accent"
          >
            <option value="">Todos</option>
            {RESOURCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="result" className="text-xs font-medium text-muted">
            Resultado
          </label>
          <select
            id="result"
            name="result"
            defaultValue={result ?? ""}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus-visible:border-accent"
          >
            <option value="">Todos</option>
            <option value="SUCCESS">Éxito</option>
            <option value="FAILURE">Fallo</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="from" className="text-xs font-medium text-muted">
            Desde
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={from ?? ""}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus-visible:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="to" className="text-xs font-medium text-muted">
            Hasta
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={to ?? ""}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus-visible:border-accent"
          />
        </div>
        <div className="col-span-2 flex items-end gap-2 sm:col-span-3 lg:col-span-6">
          <AdminButton type="submit">Filtrar</AdminButton>
          <Link href="/admin/auditoria" className="text-sm text-muted underline underline-offset-2 hover:text-accent">
            Limpiar filtros
          </Link>
        </div>
      </form>

      <p className="mt-4 text-sm text-muted">{auditPage.totalElements} evento(s) encontrado(s)</p>

      {auditPage.items.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No hay eventos que coincidan con los filtros.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Acción</th>
                <th className="px-4 py-3 font-medium">Recurso</th>
                <th className="px-4 py-3 font-medium">IP</th>
                <th className="px-4 py-3 font-medium">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {auditPage.items.map((event) => (
                <tr key={event.id} className="border-b border-border last:border-0 hover:bg-surface">
                  <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDateTime(event.occurredAt)}</td>
                  <td className="px-4 py-3 text-foreground">{event.actorEmail ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{event.action}</td>
                  <td className="px-4 py-3 text-muted">
                    {event.resourceType ? `${event.resourceType}${event.resourceId ? ` #${event.resourceId.slice(0, 8)}` : ""}` : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{event.ipAddress ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={RESULT_TONE[event.result]} label={RESULT_LABELS[event.result]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {auditPage.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>
            Página {auditPage.page + 1} de {auditPage.totalPages}
          </span>
          <div className="flex gap-2">
            {auditPage.page > 0 && (
              <Link
                href={buildPageHref(filterParams, auditPage.page - 1)}
                className="rounded-md border border-border px-3 py-1.5 hover:bg-surface"
              >
                Anterior
              </Link>
            )}
            {auditPage.page + 1 < auditPage.totalPages && (
              <Link
                href={buildPageHref(filterParams, auditPage.page + 1)}
                className="rounded-md border border-border px-3 py-1.5 hover:bg-surface"
              >
                Siguiente
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
