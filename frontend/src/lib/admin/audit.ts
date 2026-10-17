import type { Module } from "@/lib/api/admin-types";
import { MODULE_LABELS } from "@/lib/admin/worker-templates";

/**
 * Lo que nombra cada tipo de recurso que registra el backend (AuditService.record).
 * El registro es inmutable: las filas anteriores al renombre (V64) dicen
 * «article», ARTICLE_… y ARTICLES, y se siguen mostrando como publicación;
 * las anteriores a V65 dicen «event», EVENT_… y EVENTS (celebración).
 */
export const RESOURCE_LABELS: Record<string, string> = {
  publication: "Publicación",
  article: "Publicación",
  place: "Lugar",
  celebration: "Celebración",
  event: "Celebración",
  gallery: "Galería",
  image: "Imagen",
  worker: "Trabajador",
  user: "Cuenta",
  platform_settings: "Configuración",
  refresh_token: "Sesión",
  owner_only: "Solo del dueño",
};

const SUBJECTS: Record<string, string> = {
  PUBLICATION: "una publicación",
  ARTICLE: "una publicación",
  PLACE: "un lugar",
  CELEBRATION: "una celebración",
  EVENT: "una celebración",
  GALLERY: "una galería",
  IMAGE: "una imagen",
  WORKER: "a un trabajador",
};

const VERBS: Record<string, string> = {
  CREATED: "Creó",
  UPDATED: "Editó",
  SUBMITTED: "Envió para aprobar",
  PUBLISHED: "Publicó",
  SCHEDULED: "Programó",
  RETURNED_TO_DRAFT: "Devolvió a borrador",
  ARCHIVED: "Archivó",
  UPLOADED: "Subió",
  DELETED: "Borró",
  ACTIVATED: "Activó",
  DEACTIVATED: "Desactivó",
};

const FIXED: Record<string, string> = {
  LOGIN_SUCCESS: "Inició sesión",
  LOGIN_FAILURE: "Intento de inicio de sesión fallido",
  LOGIN_BLOCKED_RATE_LIMIT: "Inicio de sesión bloqueado por demasiados intentos",
  PASSWORD_CHANGED: "Cambió su contraseña",
  PASSWORD_CHANGE_FAILED: "Intento fallido de cambiar la contraseña",
  TOKEN_REFRESHED: "Renovó su sesión",
  TOKEN_REFRESH_INVALID: "Sesión inválida o vencida",
  PLATFORM_SETTINGS_UPDATED: "Cambió la configuración del sitio",
  WORKER_PERMISSIONS_CHANGED: "Cambió los permisos de un trabajador",
  WORKER_PASSWORD_RESET: "Restableció la contraseña de un trabajador",
  AUDIT_RETENTION_PURGED: "Limpieza automática del registro antiguo",
  ACCESS_DENIED: "Intentó entrar a algo sin permiso",
};

const METHOD_VERBS: Record<string, string> = { POST: "Acción", PUT: "Cambio", PATCH: "Cambio", DELETE: "Borrado" };

/** Código del backend → frase en español. Lo desconocido se muestra legible, nunca se oculta. */
export function describeAuditAction(action: string): string {
  if (FIXED[action]) return FIXED[action];
  const scheduled = action.match(/^([A-Z]+)_PUBLISHED_FROM_SCHEDULE$/);
  if (scheduled && SUBJECTS[scheduled[1]]) return `Publicó ${SUBJECTS[scheduled[1]]} a la hora programada`;
  const verbMatch = Object.keys(VERBS).find((verb) => action.endsWith(`_${verb}`));
  if (verbMatch) {
    const subject = SUBJECTS[action.slice(0, -(verbMatch.length + 1))];
    if (subject) return `${VERBS[verbMatch]} ${subject}`;
  }
  // Acciones registradas por el interceptor del panel: "POST /api/v1/admin/...".
  const http = action.match(/^(POST|PUT|PATCH|DELETE) \/api\/v1\/admin\/(.+)$/);
  if (http) return `${METHOD_VERBS[http[1]]} en ${http[2].replace(/\/\{[^}]+\}/g, "").replace(/\//g, " › ")}`;
  const words = action.toLowerCase().replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Módulos con su nombre anterior a V64/V65 (filas viejas del registro). */
const LEGACY_MODULES: Record<string, Module> = { ARTICLES: "PUBLICATIONS", EVENTS: "CELEBRATIONS" };

const LEVEL_LABELS: Record<string, string> = { CREATE: "Crear", PUBLISH: "Publicar", ACCESS: "Acceso", "—": "Sin acceso" };

export type AuditDetail = { kind: "change"; label: string; from: string; to: string } | { kind: "text"; text: string };

/**
 * Detalle "antes → después" (hoy: permisos de un trabajador, formato
 * "PUBLICATIONS: CREATE → PUBLISH; STATS: — → ACCESS" de WorkerService.describe;
 * las filas viejas dicen ARTICLES).
 * Lo que no tenga ese formato se muestra tal cual.
 */
export function parseAuditDetails(details: string | null | undefined): AuditDetail[] {
  if (!details) return [];
  return details.split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const m = part.match(/^([A-Z_]+): (\S+) → (\S+)$/);
    if (!m) return { kind: "text", text: part };
    const label = MODULE_LABELS[(LEGACY_MODULES[m[1]] ?? m[1]) as Module] ?? m[1];
    return { kind: "change", label, from: LEVEL_LABELS[m[2]] ?? m[2], to: LEVEL_LABELS[m[3]] ?? m[3] };
  });
}
