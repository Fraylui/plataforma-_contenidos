import type { Role } from "@/lib/api/admin-types";

const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Dueño",
  WORKER: "Trabajador",
};

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role];
}
