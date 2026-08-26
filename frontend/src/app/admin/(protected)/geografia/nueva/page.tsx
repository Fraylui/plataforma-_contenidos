import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminGeography } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { GeographyCreateForm } from "@/components/admin/geography-create-form";

export const metadata: Metadata = {
  title: "Nueva unidad geográfica",
  robots: "noindex,nofollow",
};

export default async function NewGeographyPage() {
  const { accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => listAdminGeography(accessToken));
  if ("denied" in result) return <AccessDenied />;

  return (
    <div>
      <h1 className="font-serif text-2xl font-medium text-foreground">Nueva unidad geográfica</h1>
      <div className="mt-6">
        <GeographyCreateForm allUnits={result.data} />
      </div>
    </div>
  );
}
