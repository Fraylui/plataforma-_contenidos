"use client";

import { useState } from "react";
import type { Role } from "@/lib/api/admin-types";
import { roleLabel } from "@/lib/admin/role-labels";
import { createUserAction } from "@/app/admin/(protected)/usuarios/actions";
import { AdminButton } from "@/components/admin/ui";

const ALL_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR", "MODERATOR", "COLLABORATOR", "USER"];

export function UserCreateForm({ viewerRole }: { viewerRole: Role }) {
  // CONTEXTO.md sección 36.4: un ADMIN no puede crear cuentas SUPER_ADMIN
  // (el backend también lo exige — esto es solo para no ofrecerlo en la UI).
  const availableRoles = ALL_ROLES.filter((role) => role !== "SUPER_ADMIN" || viewerRole === "SUPER_ADMIN");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<Role>(availableRoles[availableRoles.length - 1] ?? "USER");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setPending(true);
    setError(null);
    const result = await createUserAction({ email, password, firstName, lastName, role });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
    }
    // Éxito: la Server Action redirige a /admin/usuarios.
  }

  return (
    <div className="max-w-md space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-foreground">
          Nombres
          <input
            type="text"
            name="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent"
          />
        </label>

        <label className="block text-sm font-medium text-foreground">
          Apellidos
          <input
            type="text"
            name="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent"
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-foreground">
        Correo electrónico
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent"
        />
      </label>

      <label className="block text-sm font-medium text-foreground">
        Contraseña (mínimo 12 caracteres)
        <input
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent"
        />
      </label>

      <label className="block text-sm font-medium text-foreground">
        Rol
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent"
        >
          {availableRoles.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
      </label>

      {role === "SUPER_ADMIN" && (
        <p className="text-xs text-muted">
          MFA será obligatorio para esta cuenta desde su primer login (CONTEXTO.md §36.5).
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <AdminButton
        type="button"
        disabled={pending || !email || password.length < 12 || !firstName.trim() || !lastName.trim()}
        onClick={handleSubmit}
      >
        {pending ? "Creando…" : "Crear usuario"}
      </AdminButton>
    </div>
  );
}
