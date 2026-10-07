import { CalendarPlus, Globe, NavigationArrow, Phone, type Icon } from "@phosphor-icons/react";
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
 * Acción útil según el tipo, solo si hay datos (nada inventado): Agendar
 * (evento), Cómo llegar (lugar/directorio con coordenadas), Llamar y Sitio
 * web (directorio). Publicaciones y galerías no tienen.
 */
export function typeActions(item: HomeItem, absoluteUrl: string): TypeAction[] {
  const actions: TypeAction[] = [];
  if (item.kind === "evento" && item.startsAt) {
    actions.push({ label: "Agendar", href: calendarLinks({ title: item.title, startsAt: item.startsAt, url: absoluteUrl }).google, icon: CalendarPlus, external: true });
  }
  if (item.kind === "directorio" && item.phone) {
    actions.push({ label: "Llamar", href: `tel:${item.phone.replace(/[^\d+]/g, "")}`, icon: Phone, external: false });
  }
  if (item.kind === "directorio" && item.website) {
    actions.push({ label: "Sitio web", href: item.website, icon: Globe, external: true });
  }
  if ((item.kind === "lugar" || item.kind === "directorio") && item.latitude != null && item.longitude != null) {
    actions.push({ label: "Cómo llegar", href: mapsDirections(item.latitude, item.longitude), icon: NavigationArrow, external: true });
  }
  return actions;
}
