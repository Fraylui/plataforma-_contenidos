// Cliente de datos para Server Components. Corre en el servidor de Next.js,
// nunca en el navegador -- por eso puede llamar directo al backend sin
// preocuparse por CORS (eso solo hace falta para mutaciones desde el
// navegador, que hoy no existen: no hay panel admin todavía).
import "server-only";
import type { Article, ArticleSummary, Category, GeographicUnit, PageResponse, Tag } from "./types";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8080";

export class NotFoundError extends Error {}

async function apiFetch<T>(path: string, revalidateSeconds: number): Promise<T> {
  const res = await fetch(`${BACKEND_API_URL}${path}`, {
    next: { revalidate: revalidateSeconds },
  });

  if (res.status === 404) {
    throw new NotFoundError(`No encontrado: ${path}`);
  }
  if (!res.ok) {
    throw new Error(`Error del backend (${res.status}) en ${path}`);
  }
  return res.json() as Promise<T>;
}

export function listPublishedArticles(params?: {
  categoryId?: string;
  geographyId?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<ArticleSummary>> {
  const query = new URLSearchParams();
  if (params?.categoryId) query.set("categoryId", params.categoryId);
  if (params?.geographyId) query.set("geographyId", params.geographyId);
  query.set("page", String(params?.page ?? 0));
  query.set("size", String(params?.size ?? 20));

  // Listado: revalidación corta, cambia seguido (nuevas publicaciones).
  return apiFetch(`/api/v1/articles?${query.toString()}`, 60);
}

export function getPublishedArticleBySlug(slug: string): Promise<Article> {
  // Detalle: revalidación más larga, un artículo publicado rara vez cambia.
  return apiFetch(`/api/v1/articles/${encodeURIComponent(slug)}`, 300);
}

export function listActiveCategories(): Promise<Category[]> {
  return apiFetch(`/api/v1/categories`, 300);
}

export function getCategoryById(id: string): Promise<Category> {
  return apiFetch(`/api/v1/categories/${encodeURIComponent(id)}`, 300);
}

export function listGeographyChildren(params?: {
  level?: string;
  parentId?: string;
}): Promise<GeographicUnit[]> {
  const query = new URLSearchParams();
  if (params?.level) query.set("level", params.level);
  if (params?.parentId) query.set("parentId", params.parentId);
  return apiFetch(`/api/v1/geography?${query.toString()}`, 300);
}

export function getGeographyUnitById(id: string): Promise<GeographicUnit> {
  return apiFetch(`/api/v1/geography/${encodeURIComponent(id)}`, 300);
}

export function listAllTags(): Promise<Tag[]> {
  return apiFetch(`/api/v1/tags`, 300);
}
