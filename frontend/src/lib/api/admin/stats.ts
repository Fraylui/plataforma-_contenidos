// Estadísticas e inicio del panel (StatsController, DashboardController).
import "server-only";
import type { DashboardRange, DashboardSummary, PlatformStats } from "../admin-types";
import { authedJson } from "./http";

export function getAdminStats(accessToken: string): Promise<PlatformStats> {
  return authedJson("/api/v1/admin/stats", accessToken);
}

export function getAdminDashboard(accessToken: string, range: DashboardRange): Promise<DashboardSummary> {
  return authedJson(`/api/v1/admin/dashboard?range=${range}`, accessToken);
}
