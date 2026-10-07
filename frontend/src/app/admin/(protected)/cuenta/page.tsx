import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { roleLabel } from "@/lib/admin/role-labels";
import { detectTemplate } from "@/lib/admin/worker-templates";
import { AdminPageHeader } from "@/components/admin/ui";
import { ChangePasswordForm } from "@/components/admin/change-password-form";

export const metadata: Metadata = {
  title: "Mi cuenta",
  robots: "noindex,nofollow",
};

/** Mi cuenta (cualquier usuario del panel): datos propios, alcance y cambio de contraseña. */
export default async function AccountPage() {
  const { user } = await requireAdminUser();

  return (
    <div>
      <AdminPageHeader title="Mi cuenta" />
      <div className="mt-6 flex flex-col gap-6">
        <section className="flex max-w-md items-center gap-4 rounded-card bg-surface shadow-card p-5">
          <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-lg font-black text-accent">
            {user.firstName.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-foreground">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-sm text-muted">
              {user.email} · {roleLabel(user.role)}
              {user.role === "WORKER" ? ` · ${detectTemplate(user.permissions)}` : ""}
            </p>
          </div>
        </section>
        <ChangePasswordForm temporary={user.mustChangePassword} />
      </div>
    </div>
  );
}
