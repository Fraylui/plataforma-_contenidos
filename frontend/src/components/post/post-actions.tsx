import { CalendarPlus, NavigationArrow, type Icon } from "@phosphor-icons/react";
import type { HomeItem } from "@/lib/home-items";
import { calendarLinks } from "./calendar-link";

export interface TypeAction {
  label: string;
  href: string;
  icon: Icon;
  external: boolean;
}

export function mapsDirections(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

/**
 * Acción útil según el tipo, solo si hay datos (nada inventado): Recordarme
 * (celebración) y Cómo llegar (lugar con coordenadas). Publicaciones y
 * galerías no tienen.
 */
export function typeActions(item: HomeItem, absoluteUrl: string): TypeAction[] {
  const actions: TypeAction[] = [];
  if (item.kind === "celebracion" && item.startsAt) {
    actions.push({ label: "Recordarme", href: calendarLinks({ title: item.title, startsAt: item.startsAt, url: absoluteUrl, allDay: Boolean(item.allDay), recursYearly: Boolean(item.recursYearly) }).google, icon: CalendarPlus, external: true });
  }
  if (item.kind === "lugar" && item.latitude != null && item.longitude != null) {
    actions.push({ label: "Cómo llegar", href: mapsDirections(item.latitude, item.longitude), icon: NavigationArrow, external: true });
  }
  return actions;
}
