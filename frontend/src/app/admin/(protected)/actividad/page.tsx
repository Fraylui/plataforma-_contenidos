import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminAuditLog } from "@/lib/api/admin-client";
import type { AuditResult } from "@/lib/api/admin-types";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader } from "@/components/admin/ui";
import { Badge, type BadgeTone, Button, DateTimeInput, Field, LinkButton, Select, TextInput } from "@/components/ui";

export const metadata: Metadata = {
  title: "Registro de actividad",
  robots: "noindex,nofollow",
};

const PAGE_SIZE = 30;

const RESULT_LABELS: Record<AuditResult, string> = {
  SUCCESS: "Éxito",
  FAILURE: "Fallo",
};

const RESULT_TONE: Record<AuditResult, BadgeTone> = {
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
          <TextInput type="text" defaultValue={action ?? ""} placeholder="LOGIN_FAILURE…" />
        </Field>
        <Field label="Recurso" name="resourceType">
          <Select defaultValue={resourceType ?? ""}>
            <option value="">Todos</option>
            {RESOURCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
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

      <p className="mt-4 text-sm text-muted">{auditPage.totalElements} evento(s) encontrado(s)</p>

      {auditPage.items.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No hay eventos que coincidan con los filtros.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-card bg-surface shadow-card">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium text-muted">Fecha</th>
                <th className="px-4 py-3 font-medium text-muted">Usuario</th>
                <th className="px-4 py-3 font-medium text-muted">Acción</th>
                <th className="px-4 py-3 font-medium text-muted">Recurso</th>
                <th className="px-4 py-3 font-medium text-muted">IP</th>
                <th className="px-4 py-3 font-medium text-muted">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {auditPage.items.map((event) => (
                <tr key={event.id} className="border-b border-border last:border-0 hover:bg-accent-soft/40">
                  <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDateTime(event.occurredAt)}</td>
                  <td className="px-4 py-3 text-foreground">{event.actorEmail ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{event.action}</td>
                  <td className="px-4 py-3 text-muted">
                    {event.resourceType ? `${event.resourceType}${event.resourceId ? ` #${event.resourceId.slice(0, 8)}` : ""}` : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{event.ipAddress ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={RESULT_TONE[event.result]} dot>{RESULT_LABELS[event.result]}</Badge>
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
