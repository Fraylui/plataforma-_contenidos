import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listActiveCategoriesFresh } from "@/lib/api/admin-client";
import { ArticleForm } from "@/components/admin/article-form";

export const metadata: Metadata = {
  title: "Nuevo artículo",
  robots: "noindex,nofollow",
};

export default async function NewArticlePage() {
  await requireAdminUser();
  const categories = await listActiveCategoriesFresh();

  return (
    <div>
      <h1 className="font-serif text-2xl font-medium text-foreground">Nuevo artículo</h1>
      <div className="mt-6">
        <ArticleForm mode="create" categories={categories} initialGeographyChain={[]} initialTagNames={[]} />
      </div>
    </div>
  );
}
