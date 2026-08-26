import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { UserCreateForm } from "@/components/admin/user-create-form";

export const metadata: Metadata = {
  title: "Nuevo usuario",
  robots: "noindex,nofollow",
};

export default async function NewUserPage() {
  const { user } = await requireAdminUser();

  return (
    <div>
      <h1 className="font-serif text-2xl font-medium text-foreground">Nuevo usuario</h1>
      <div className="mt-6">
        <UserCreateForm viewerRole={user.role} />
      </div>
    </div>
  );
}
