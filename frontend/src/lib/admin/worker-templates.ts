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
    id: "ADMINISTRADOR",
    label: "Administrador",
    description: "Todo, como el dueño, menos el registro de actividad",
    permissions: {
      PUBLICATIONS: "PUBLISH",
      PLACES: "PUBLISH",
      CELEBRATIONS: "PUBLISH",
      GALLERIES: "PUBLISH",
      DIRECTORY: "PUBLISH",
      SERIES: "PUBLISH",
      CATEGORIES: "ACCESS",
      STATS: "ACCESS",
      ADVERTISING: "ACCESS",
      WORKERS: "ACCESS",
      SETTINGS: "ACCESS",
    },
  },
  {
    id: "PUBLICADOR",
    label: "Publicador",
    description: "Publica en todo; temas y estadísticas",
    permissions: {
      PUBLICATIONS: "PUBLISH",
      PLACES: "PUBLISH",
      CELEBRATIONS: "PUBLISH",
      GALLERIES: "PUBLISH",
      DIRECTORY: "PUBLISH",
      SERIES: "PUBLISH",
      CATEGORIES: "ACCESS",
      STATS: "ACCESS",
    },
  },
  { id: "GESTOR_CELEBRACIONES", label: "Gestor de celebraciones", description: "Celebraciones y lugares", permissions: { CELEBRATIONS: "PUBLISH", PLACES: "PUBLISH" } },
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
  PUBLICATIONS: "Publicaciones",
  PLACES: "Lugares",
  CELEBRATIONS: "Celebraciones",
  GALLERIES: "Galerías",
  DIRECTORY: "Directorio",
  SERIES: "Series",
  CATEGORIES: "Temas",
  STATS: "Estadísticas",
  ADVERTISING: "Publicidad",
  WORKERS: "Trabajadores",
  SETTINGS: "Configuración",
};

export const CONTENT_MODULES: Module[] = ["PUBLICATIONS", "PLACES", "CELEBRATIONS", "GALLERIES", "DIRECTORY", "SERIES"];
export const ACCESS_MODULES: Module[] = ["CATEGORIES", "STATS", "ADVERTISING", "WORKERS", "SETTINGS"];
