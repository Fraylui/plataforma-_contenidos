import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listActiveCategoriesFresh, listAdminImages, listAdminPlaces } from "@/lib/api/admin-client";
import { EventForm } from "@/components/admin/event-form";

export const metadata: Metadata = {
  title: "Nuevo evento",
  robots: "noindex,nofollow",
};

export default async function NewEventPage() {
  const { accessToken } = await requireAdminUser();
  const [categories, allImages, places] = await Promise.all([
    listActiveCategoriesFresh(),
    listAdminImages(accessToken),
    listAdminPlaces(accessToken),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Nuevo evento</h1>
      <div className="mt-6">
        <EventForm mode="create" categories={categories} places={places} allImages={allImages} initialGeographyChain={[]} />
      </div>
    </div>
  );
}
