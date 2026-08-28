import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminImages } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { ImageUploadForm } from "@/components/admin/image-upload-form";
import { ImageCard } from "@/components/admin/image-card";
import { AdminPageHeader, EmptyState } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Medios",
  robots: "noindex,nofollow",
};

const EDITOR_OR_ABOVE = new Set(["SUPER_ADMIN", "ADMIN", "EDITOR"]);

export default async function AdminMediaPage() {
  const { user, accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => listAdminImages(accessToken));
  if ("denied" in result) return <AccessDenied />;
  const sorted = [...result.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const isEditorOrAbove = EDITOR_OR_ABOVE.has(user.role);

  return (
    <div>
      <AdminPageHeader
        title="Medios"
        description="Imágenes disponibles para usar como imagen destacada u Open Graph en un artículo. Copia la URL del archivo desde acá y pégala en el campo correspondiente del formulario de artículo."
      />

      <div className="mt-6">
        <ImageUploadForm />
      </div>

      {sorted.length === 0 ? (
        <EmptyState title="Todavía no hay imágenes" />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((image) => (
            <ImageCard key={image.id} image={image} canManage={isEditorOrAbove || image.uploadedBy === user.id} />
          ))}
        </div>
      )}
    </div>
  );
}
