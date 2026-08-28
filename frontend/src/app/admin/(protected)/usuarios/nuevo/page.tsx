import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { UserCreateForm } from "@/components/admin/user-create-form";
import { AdminPageHeader } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Nuevo usuario",
  robots: "noindex,nofollow",
};

export default async function NewUserPage() {
  const { user } = await requireAdminUser();

  return (
    <div>
      <AdminPageHeader title="Nuevo usuario" />
      <div className="mt-6">
        <UserCreateForm viewerRole={user.role} />
      </div>
    </div>
  );
}
