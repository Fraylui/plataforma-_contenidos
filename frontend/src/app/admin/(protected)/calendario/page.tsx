import type { Metadata } from "next";
import { CalendarView } from "@/components/admin/calendar-view";
import { AccessDenied } from "@/components/admin/access-denied";
import { requireAdminUser } from "@/lib/admin/auth";
import { createItems } from "@/lib/admin/nav";
import { currentMonth, parseCalendarMonth, todayIn } from "@/lib/admin/calendar";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { getAdminCalendar } from "@/lib/api/admin/stats";
import { SITE_TIME_ZONE } from "@/lib/site-time-zone";

export const metadata: Metadata = {
  title: "Calendario",
  robots: "noindex,nofollow",
};

/**
 * Calendario de publicaciones: lo publicado, lo programado y las fechas de
 * Celebraciones de un mes, para preparar el contenido antes del día. Mes en
 * la URL (?mes=AAAA-MM) para volver atrás y compartirlo.
 */
export default async function AdminCalendarPage(props: PageProps<"/admin/calendario">) {
  const { user, accessToken } = await requireAdminUser();
  const month = parseCalendarMonth((await props.searchParams).mes) ?? currentMonth(SITE_TIME_ZONE);
  const result = await fetchOrAccessDenied(() => getAdminCalendar(accessToken, month));
  if ("denied" in result) return <AccessDenied />;

  return (
    <CalendarView
      month={month}
      today={todayIn(SITE_TIME_ZONE)}
      entries={result.data.entries}
      canCreate={createItems(user).length > 0}
    />
  );
}
