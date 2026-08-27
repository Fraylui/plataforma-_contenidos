import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { getAdminStats } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { StatsDashboard } from "@/components/admin/stats-dashboard";

export const metadata: Metadata = {
  title: "Estadísticas",
  robots: "noindex,nofollow",
};

export default async function AdminStatsPage() {
  const { accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => getAdminStats(accessToken));
  if ("denied" in result) return <AccessDenied />;

  return <StatsDashboard stats={result.data} />;
}
