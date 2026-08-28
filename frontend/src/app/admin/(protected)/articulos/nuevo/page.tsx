import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listActiveCategoriesFresh, listAdminImages } from "@/lib/api/admin-client";
import { ArticleForm } from "@/components/admin/article-form";

export const metadata: Metadata = {
  title: "Nuevo artículo",
  robots: "noindex,nofollow",
};

export default async function NewArticlePage() {
  const { accessToken } = await requireAdminUser();
  const [categories, allImages] = await Promise.all([listActiveCategoriesFresh(), listAdminImages(accessToken)]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Nuevo artículo</h1>
      <div className="mt-6">
        <ArticleForm
          mode="create"
          categories={categories}
          allImages={allImages}
          initialGeographyChain={[]}
          initialTagNames={[]}
        />
      </div>
    </div>
  );
}
