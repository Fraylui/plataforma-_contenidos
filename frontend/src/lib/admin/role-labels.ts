import type { AdminUser, Role } from "@/lib/api/admin-types";
import { WORKER_TEMPLATES, detectTemplate } from "./worker-templates";

const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Dueño",
  WORKER: "Trabajador",
};

const ADMIN_TEMPLATE_LABEL = WORKER_TEMPLATES.find((t) => t.id === "ADMINISTRADOR")!.label;

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role];
}

/**
 * Cómo se presenta la cuenta en el panel. La plantilla no se guarda (solo los
 * permisos resultantes), así que un trabajador se muestra como «Administrador»
 * cuando sus permisos coinciden exactamente con esa plantilla.
 */
export function accountLabel(user: Pick<AdminUser, "role" | "permissions">): string {
  if (user.role === "WORKER" && detectTemplate(user.permissions) === ADMIN_TEMPLATE_LABEL) {
    return ADMIN_TEMPLATE_LABEL;
  }
  return roleLabel(user.role);
}
