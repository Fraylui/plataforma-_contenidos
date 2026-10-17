import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/auth";
import { AdminApiError, getAdminLive, listActiveCategoriesFresh, listAdminSeries } from "@/lib/api/admin-client";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader } from "@/components/admin/ui";
import { LiveForm } from "@/components/admin/live-form";

export const metadata: Metadata = {
  title: "Editar transmisión",
  robots: "noindex,nofollow",
};

export default async function EditLivePage(props: PageProps<"/admin/en-vivo/[id]">) {
  const { id } = await props.params;
  const { accessToken } = await requireAdminUser();

  let stream;
  try {
    stream = await getAdminLive(accessToken, id);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) notFound();
    if (error instanceof AdminApiError && error.status === 403) return <AccessDenied />;
    throw error;
  }
  const [categories, series] = await Promise.all([listActiveCategoriesFresh(), listAdminSeries(accessToken, { page: 0 })]);

  return (
    <div className="space-y-6">
      <AdminPageHeader title={stream.title} back={{ href: "/admin/en-vivo", label: "En vivo" }} />
      <LiveForm categories={categories} series={series.items} stream={stream} />
    </div>
  );
}
