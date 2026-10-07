import type { Module, ModulePermissions } from "@/lib/api/admin-types";

export interface WorkerTemplate {
  id: string;
  label: string;
  description: string;
  permissions: ModulePermissions;
}

/** Plantillas de trabajador: deben coincidir con Templates.java (spec 2a §3.4). Solo precargan la matriz. */
export const WORKER_TEMPLATES: WorkerTemplate[] = [
  {
    id: "CREADOR",
    label: "Creador",
    description: "Crea en todo y lo envía a revisión",
    permissions: { ARTICLES: "CREATE", PLACES: "CREATE", EVENTS: "CREATE", GALLERIES: "CREATE", DIRECTORY: "CREATE" },
  },
  {
    id: "PUBLICADOR",
    label: "Publicador",
    description: "Revisa y publica todo; temas y estadísticas",
    permissions: {
      ARTICLES: "PUBLISH",
      PLACES: "PUBLISH",
      EVENTS: "PUBLISH",
      GALLERIES: "PUBLISH",
      DIRECTORY: "PUBLISH",
      CATEGORIES: "ACCESS",
      STATS: "ACCESS",
    },
  },
  { id: "GESTOR_EVENTOS", label: "Gestor de eventos", description: "Eventos y lugares", permissions: { EVENTS: "PUBLISH", PLACES: "PUBLISH" } },
  { id: "GESTOR_DIRECTORIO", label: "Gestor de directorio", description: "Directorio y lugares", permissions: { DIRECTORY: "PUBLISH", PLACES: "PUBLISH" } },
  { id: "PUBLICIDAD", label: "Publicidad", description: "Anunciantes, campañas y espacios", permissions: { ADVERTISING: "ACCESS", STATS: "ACCESS" } },
];

function samePermissions(a: ModulePermissions, b: ModulePermissions): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<Module>;
  return [...keys].every((k) => a[k] === b[k]);
}

/** Nombre de la plantilla que coincide exactamente, «Personalizado» o «Sin permisos». */
export function detectTemplate(permissions: ModulePermissions): string {
  if (Object.keys(permissions).length === 0) return "Sin permisos";
  return WORKER_TEMPLATES.find((t) => samePermissions(t.permissions, permissions))?.label ?? "Personalizado";
}

export const MODULE_LABELS: Record<Module, string> = {
  ARTICLES: "Publicaciones",
  PLACES: "Lugares",
  EVENTS: "Eventos",
  GALLERIES: "Galerías",
  DIRECTORY: "Directorio",
  CATEGORIES: "Temas",
  STATS: "Estadísticas",
  ADVERTISING: "Publicidad",
};

export const CONTENT_MODULES: Module[] = ["ARTICLES", "PLACES", "EVENTS", "GALLERIES", "DIRECTORY"];
export const ACCESS_MODULES: Module[] = ["CATEGORIES", "STATS", "ADVERTISING"];
