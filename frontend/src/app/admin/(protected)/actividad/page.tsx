import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminAuditLog } from "@/lib/api/admin-client";
import type { AuditResult } from "@/lib/api/admin-types";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader } from "@/components/admin/ui";
import { AuditTimeline } from "@/components/admin/audit-timeline";
import { siteDayBoundary } from "@/lib/site-time-zone";
import { RESOURCE_LABELS } from "@/lib/admin/audit";
import { Button, DateTimeInput, Field, LinkButton, Select, TextInput } from "@/components/ui";

export const metadata: Metadata = {
  title: "Registro de actividad",
  robots: "noindex,nofollow",
};

const PAGE_SIZE = 30;

/** Convierte un <input type="date"> ("YYYY-MM-DD", día del sitio) al Instant que espera el backend. */
function dateParamToInstant(value: string | undefined, endOfDay: boolean): string | undefined {
  return value ? siteDayBoundary(value, endOfDay) : undefined;
}

function buildPageHref(params: Record<string, string | undefined>, page: number): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  query.set("page", String(page));
  return `/admin/actividad?${query.toString()}`;
}

export default async function AdminAuditPage(props: PageProps<"/admin/actividad">) {
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
        title="Registro de actividad"
        description="Registro de acciones administrativas y de seguridad (solo lectura, no editable)."
      />

      <form method="get" className="mt-6 grid grid-cols-2 gap-4 rounded-card bg-surface p-5 shadow-card sm:grid-cols-3 lg:grid-cols-6">
        <Field label="Correo del usuario" name="actorEmail" className="col-span-2 sm:col-span-1">
          <TextInput type="text" defaultValue={actorEmail ?? ""} placeholder="correo@ejemplo.com" />
        </Field>
        <Field label="Acción" name="action" className="col-span-2 sm:col-span-1">
          <TextInput type="text" defaultValue={action ?? ""} placeholder="EVENT_PUBLISHED…" />
        </Field>
        <Field label="Recurso" name="resourceType">
          <Select defaultValue={resourceType ?? ""}>
            <option value="">Todos</option>
            {Object.entries(RESOURCE_LABELS).map(([type, label]) => (
              <option key={type} value={type}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Resultado" name="result">
          <Select defaultValue={result ?? ""}>
            <option value="">Todos</option>
            <option value="SUCCESS">Éxito</option>
            <option value="FAILURE">Fallo</option>
          </Select>
        </Field>
        <Field label="Desde" name="from">
          <DateTimeInput type="date" defaultValue={from ?? ""} />
        </Field>
        <Field label="Hasta" name="to">
          <DateTimeInput type="date" defaultValue={to ?? ""} />
        </Field>
        <div className="col-span-2 flex items-center gap-2 sm:col-span-3 lg:col-span-6">
          <Button type="submit">Filtrar</Button>
          <LinkButton href="/admin/actividad" variant="ghost">
            Limpiar filtros
          </LinkButton>
        </div>
      </form>

      <p className="mt-4 text-sm text-muted">{auditPage.totalElements} {auditPage.totalElements === 1 ? "acción registrada" : "acciones registradas"}</p>

      {auditPage.items.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No hay eventos que coincidan con los filtros.</p>
      ) : (
        <div className="mt-4 rounded-card bg-surface p-5 shadow-card">
          <AuditTimeline events={auditPage.items} detailed />
        </div>
      )}

      {auditPage.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>
            Página {auditPage.page + 1} de {auditPage.totalPages}
          </span>
          <div className="flex gap-2">
            {auditPage.page > 0 && (
              <LinkButton href={buildPageHref(filterParams, auditPage.page - 1)} variant="secondary">
                Anterior
              </LinkButton>
            )}
            {auditPage.page + 1 < auditPage.totalPages && (
              <LinkButton href={buildPageHref(filterParams, auditPage.page + 1)} variant="secondary">
                Siguiente
              </LinkButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
