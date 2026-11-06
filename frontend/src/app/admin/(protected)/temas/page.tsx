import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminCategories } from "@/lib/api/admin/taxonomy";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState } from "@/components/admin/ui";
import { setCategoryActiveAction } from "./actions";
import { TopicList } from "@/components/admin/topic-list";

export const metadata: Metadata = {
  title: "Temas",
  robots: "noindex,nofollow",
};

export default async function AdminCategoriesPage() {
  const { accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => listAdminCategories(accessToken));
  if ("denied" in result) return <AccessDenied />;

  return (
    <div>
      <AdminPageHeader title="Temas" action={{ href: "/admin/temas/nuevo", label: "Nuevo tema" }} />

      {result.data.length === 0 ? (
        <EmptyState title="Todavía no hay temas" />
      ) : (
        <TopicList topics={result.data} toggleAction={setCategoryActiveAction} />
      )}
    </div>
  );
}
