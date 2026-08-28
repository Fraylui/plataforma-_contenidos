import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminCategories } from "@/lib/api/admin-client";
import { getCategoryById } from "@/lib/api/client";
import { NotFoundError } from "@/lib/api/client";
import { categoryParentOptions } from "@/lib/admin/category-tree";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { CategoryForm } from "@/components/admin/category-form";

export const metadata: Metadata = {
  title: "Editar categoría",
  robots: "noindex,nofollow",
};

export default async function EditCategoryPage(props: PageProps<"/admin/categorias/[id]">) {
  const { id } = await props.params;
  const { accessToken } = await requireAdminUser();

  let category;
  try {
    category = await getCategoryById(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  const result = await fetchOrAccessDenied(() => listAdminCategories(accessToken));
  if ("denied" in result) return <AccessDenied />;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{category.name}</h1>
      <div className="mt-6">
        <CategoryForm mode="edit" category={category} parentOptions={categoryParentOptions(result.data, category.id)} />
      </div>
    </div>
  );
}
