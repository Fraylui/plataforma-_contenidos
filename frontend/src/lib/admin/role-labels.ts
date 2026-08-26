import type { Role } from "@/lib/api/admin-types";

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super administrador",
  ADMIN: "Administrador",
  EDITOR: "Editor",
  AUTHOR: "Autor",
  MODERATOR: "Moderador",
  COLLABORATOR: "Colaborador",
  USER: "Usuario",
};

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role];
}
