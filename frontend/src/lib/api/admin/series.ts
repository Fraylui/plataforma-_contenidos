// Series de YouTube y sus episodios (SeriesAdminController).
import "server-only";
import { adminListQuery, type AdminListParams } from "@/lib/admin/list-params";
import type { AdminSeries, CreateSeriesInput, SeriesSyncResult, UpdateSeriesInput } from "../admin-types";
import type { Episode, PageResponse } from "../types";
import { authedJson } from "./http";

export function listAdminSeries(accessToken: string, params: AdminListParams): Promise<PageResponse<AdminSeries>> {
  return authedJson(`/api/v1/admin/series?${adminListQuery(params)}`, accessToken);
}

export function getAdminSeries(accessToken: string, id: string): Promise<AdminSeries> {
  return authedJson(`/api/v1/admin/series/${encodeURIComponent(id)}`, accessToken);
}

export function createSeries(accessToken: string, input: CreateSeriesInput): Promise<AdminSeries> {
  return authedJson("/api/v1/admin/series", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateSeries(accessToken: string, id: string, input: UpdateSeriesInput): Promise<AdminSeries> {
  return authedJson(`/api/v1/admin/series/${encodeURIComponent(id)}`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function syncSeries(accessToken: string, id: string): Promise<SeriesSyncResult> {
  return authedJson(`/api/v1/admin/series/${encodeURIComponent(id)}/sync`, accessToken, { method: "POST" });
}

export function listAdminEpisodes(accessToken: string, id: string, page = 0): Promise<PageResponse<Episode>> {
  return authedJson(`/api/v1/admin/series/${encodeURIComponent(id)}/episodes?page=${page}&size=30`, accessToken);
}

export function addEpisode(accessToken: string, id: string, input: { videoUrl: string; title?: string }): Promise<Episode> {
  return authedJson(`/api/v1/admin/series/${encodeURIComponent(id)}/episodes`, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateEpisode(
  accessToken: string,
  id: string,
  episodeId: string,
  input: { title?: string; notes?: string },
): Promise<Episode> {
  return authedJson(`/api/v1/admin/series/${encodeURIComponent(id)}/episodes/${encodeURIComponent(episodeId)}`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function setEpisodeArchived(accessToken: string, id: string, episodeId: string, archived: boolean): Promise<Episode> {
  const step = archived ? "archive" : "restore";
  return authedJson(
    `/api/v1/admin/series/${encodeURIComponent(id)}/episodes/${encodeURIComponent(episodeId)}/${step}`,
    accessToken,
    { method: "POST" },
  );
}
