import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminCategories } from "@/lib/api/admin-client";
import { categoryParentOptions } from "@/lib/admin/category-tree";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { CategoryForm } from "@/components/admin/category-form";

export const metadata: Metadata = {
  title: "Nueva categoría",
  robots: "noindex,nofollow",
};

export default async function NewCategoryPage() {
  const { accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => listAdminCategories(accessToken));
  if ("denied" in result) return <AccessDenied />;

  return (
    <div>
      <h1 className="font-serif text-2xl font-medium text-foreground">Nueva categoría</h1>
      <div className="mt-6">
        <CategoryForm mode="create" parentOptions={categoryParentOptions(result.data)} />
      </div>
    </div>
  );
}
