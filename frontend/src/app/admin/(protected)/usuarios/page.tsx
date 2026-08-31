import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminUsers } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader } from "@/components/admin/ui";
import { UsersTable } from "@/components/admin/users-table";

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
      <AdminPageHeader title="Usuarios" action={{ href: "/admin/usuarios/nuevo", label: "Nuevo usuario" }} />

      <div className="mt-6">
        <UsersTable users={users} viewer={viewer} />
      </div>
    </div>
  );
}
