"use client";

import { useState } from "react";
import type { Role } from "@/lib/api/admin-types";
import { roleLabel } from "@/lib/admin/role-labels";
import { createUserAction } from "@/app/admin/(protected)/usuarios/actions";
import { AdminButton, Combobox, FormField, formInputClass } from "@/components/admin/ui";

// MODERATOR/COLLABORATOR/USER existen en el enum del backend pero todavía no
// tienen ninguna regla de autorización conectada (SecurityConfig no los
// menciona en ningún endpoint) — ofrecerlos acá crearía una cuenta que no
// puede entrar a ninguna sección del admin. Se quitan de este selector
// hasta que ese día llegue; el enum se queda intacto para entonces.
const ALL_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"];

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
    <div className="max-w-md space-y-4 rounded-xl border border-border/60 bg-surface p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Nombres" name="firstName">
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={formInputClass} />
        </FormField>

        <FormField label="Apellidos" name="lastName">
          <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={formInputClass} />
        </FormField>
      </div>

      <FormField label="Correo electrónico" name="email">
        <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={formInputClass} />
      </FormField>

      <FormField label="Contraseña (mínimo 12 caracteres)" name="password">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className={formInputClass}
        />
      </FormField>

      <FormField label="Rol" name="role">
        <Combobox
          options={availableRoles.map((r) => ({ id: r, label: roleLabel(r) }))}
          value={role}
          onSelect={(id) => id && setRole(id as Role)}
        />
      </FormField>

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
