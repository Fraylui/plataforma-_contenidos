import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminUsers } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { roleLabel } from "@/lib/admin/role-labels";
import { formatPublishedDate } from "@/lib/content-labels";
import { setUserActiveAction } from "./actions";

export const metadata: Metadata = {
  title: "Usuarios",
  robots: "noindex,nofollow",
};

export default async function AdminUsersPage() {
  const { user: viewer, accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => listAdminUsers(accessToken));
  if ("denied" in result) return <AccessDenied />;
  const users = [...result.data].sort((a, b) => a.email.localeCompare(b.email));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-medium text-foreground">Usuarios</h1>
        <Link
          href="/admin/usuarios/nuevo"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          Nuevo usuario
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">MFA</th>
              <th className="px-4 py-3 font-medium">Último acceso</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === viewer.id;
              const cannotManage =
                isSelf && user.status === "ACTIVE" // no te puedes desactivar a ti mismo
                  ? true
                  : user.role === "SUPER_ADMIN" && viewer.role !== "SUPER_ADMIN"; // solo SUPER_ADMIN gestiona SUPER_ADMIN

              return (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-surface">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {user.displayName}
                      {isSelf && <span className="ml-1.5 text-xs font-normal text-muted">(tú)</span>}
                    </p>
                    <p className="text-xs text-muted">{user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{roleLabel(user.role)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.status === "ACTIVE" ? "bg-accent-soft text-accent" : "bg-border text-muted"
                      }`}
                    >
                      {user.status === "ACTIVE" ? "Activo" : "Desactivado"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{user.mfaEnabled ? "Sí" : "No"}</td>
                  <td className="px-4 py-3 text-muted">
                    {user.lastLoginAt ? formatPublishedDate(user.lastLoginAt) : "Nunca"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!cannotManage && (
                      <form action={setUserActiveAction.bind(null, user.id, user.status !== "ACTIVE")}>
                        <button
                          type="submit"
                          className="text-xs font-medium text-muted underline underline-offset-2 hover:text-accent"
                        >
                          {user.status === "ACTIVE" ? "Desactivar" : "Activar"}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
