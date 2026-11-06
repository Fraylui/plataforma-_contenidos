// Estadísticas, inicio y calendario del panel (StatsController, DashboardController, CalendarController).
import "server-only";
import type { CalendarMonth, CalendarToday, DashboardRange, DashboardSummary, PlatformStats } from "../admin-types";
import { authedJson } from "./http";

export function getAdminStats(accessToken: string): Promise<PlatformStats> {
  return authedJson("/api/v1/admin/stats", accessToken);
}

export function getAdminDashboard(accessToken: string, range: DashboardRange): Promise<DashboardSummary> {
  return authedJson(`/api/v1/admin/dashboard?range=${range}`, accessToken);
}

export function getAdminCalendar(accessToken: string, month: string): Promise<CalendarMonth> {
  return authedJson(`/api/v1/admin/calendar?month=${encodeURIComponent(month)}`, accessToken);
}

export function getAdminToday(accessToken: string): Promise<CalendarToday> {
  return authedJson("/api/v1/admin/calendar/today", accessToken);
}
