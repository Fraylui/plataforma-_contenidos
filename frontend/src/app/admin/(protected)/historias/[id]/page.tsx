import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/auth";
import { getAdminStory } from "@/lib/api/admin/stories";
import { AdminApiError } from "@/lib/api/admin/http";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader } from "@/components/admin/ui";
import { StoryEditForm } from "@/components/admin/stories/story-edit-form";

export const metadata: Metadata = {
  title: "Editar historia",
  robots: "noindex,nofollow",
};

export default async function EditStoryPage({ params }: PageProps<"/admin/historias/[id]">) {
  const { accessToken } = await requireAdminUser();
  const { id } = await params;
  const result = await fetchOrAccessDenied(() =>
    getAdminStory(accessToken, id).catch((error: unknown) => {
      if (error instanceof AdminApiError && error.status === 404) notFound();
      throw error;
    }),
  );
  if ("denied" in result) return <AccessDenied />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <AdminPageHeader title="Editar historia" back={{ href: "/admin/historias", label: "Historias" }} />
      <StoryEditForm story={result.data} />
    </div>
  );
}
