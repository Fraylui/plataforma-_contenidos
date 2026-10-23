// Publicaciones, lugares, celebraciones y galerías: listar, leer, crear, editar y pasos de publicación.
import "server-only";
import type { PublicationKind, PublicationStep } from "@/lib/admin/publication";
import { adminListQuery, type AdminListParams } from "@/lib/admin/list-params";
import type {
  AdminContentPage,
  PlaceOption,
  PublicationInput,
  CelebrationInput,
  GalleryInput,
  PlaceInput,
} from "../admin-types";
import type { Publication, Celebration, Gallery, Place } from "../types";
import { authedJson } from "./http";

export function listAdminPublications(accessToken: string, params: AdminListParams): Promise<AdminContentPage<Publication>> {
  return authedJson(`/api/v1/admin/publications?${adminListQuery(params)}`, accessToken);
}

export function getAdminPublication(accessToken: string, id: string): Promise<Publication> {
  return authedJson(`/api/v1/admin/publications/${encodeURIComponent(id)}`, accessToken);
}

export function createPublication(accessToken: string, input: PublicationInput): Promise<Publication> {
  return authedJson("/api/v1/admin/publications", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updatePublication(accessToken: string, id: string, input: PublicationInput): Promise<Publication> {
  return authedJson(`/api/v1/admin/publications/${encodeURIComponent(id)}`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function listAdminPlaces(accessToken: string, params: AdminListParams): Promise<AdminContentPage<Place>> {
  return authedJson(`/api/v1/admin/places?${adminListQuery(params)}`, accessToken);
}

export function getAdminPlace(accessToken: string, id: string): Promise<Place> {
  return authedJson(`/api/v1/admin/places/${encodeURIComponent(id)}`, accessToken);
}

export function createPlace(accessToken: string, input: PlaceInput): Promise<Place> {
  return authedJson("/api/v1/admin/places", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updatePlace(accessToken: string, id: string, input: PlaceInput): Promise<Place> {
  return authedJson(`/api/v1/admin/places/${encodeURIComponent(id)}`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function listAdminCelebrations(accessToken: string, params: AdminListParams): Promise<AdminContentPage<Celebration>> {
  return authedJson(`/api/v1/admin/celebrations?${adminListQuery(params)}`, accessToken);
}

export function getAdminCelebration(accessToken: string, id: string): Promise<Celebration> {
  return authedJson(`/api/v1/admin/celebrations/${encodeURIComponent(id)}`, accessToken);
}

export function createCelebration(accessToken: string, input: CelebrationInput): Promise<Celebration> {
  return authedJson("/api/v1/admin/celebrations", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateCelebration(accessToken: string, id: string, input: CelebrationInput): Promise<Celebration> {
  return authedJson(`/api/v1/admin/celebrations/${encodeURIComponent(id)}`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function listAdminGalleries(accessToken: string, params: AdminListParams): Promise<AdminContentPage<Gallery>> {
  return authedJson(`/api/v1/admin/galleries?${adminListQuery(params)}`, accessToken);
}

export function getAdminGallery(accessToken: string, id: string): Promise<Gallery> {
  return authedJson(`/api/v1/admin/galleries/${encodeURIComponent(id)}`, accessToken);
}

export function createGallery(accessToken: string, input: GalleryInput): Promise<Gallery> {
  return authedJson("/api/v1/admin/galleries", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateGallery(accessToken: string, id: string, input: GalleryInput): Promise<Gallery> {
  return authedJson(`/api/v1/admin/galleries/${encodeURIComponent(id)}`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

/**
 * Un paso del flujo de publicación, igual para los 5 tipos de contenido
 * (POST /api/v1/admin/{tipo}/{id}/{paso}). `scheduledAt` para programar.
 */
export function runPublicationStep(
  accessToken: string,
  kind: PublicationKind,
  id: string,
  step: PublicationStep,
  body?: { scheduledAt?: string },
): Promise<unknown> {
  return authedJson(`/api/v1/admin/${kind}/${encodeURIComponent(id)}/${step}`, accessToken, {
    method: "POST",
    ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
  });
}

/** Lugares para elegir en Celebraciones (no exige el módulo Lugares). */
export function listPlaceOptions(accessToken: string): Promise<PlaceOption[]> {
  return authedJson("/api/v1/admin/place-options", accessToken);
}
