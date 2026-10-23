// Transmisiones en vivo (LiveAdminController).
import "server-only";
import type { LiveInput } from "../admin-types";
import type { LiveStream, PageResponse } from "../types";
import { authedJson } from "./http";

export type LiveStep = "start" | "end" | "cancel";

export function listAdminLive(accessToken: string, page = 0): Promise<PageResponse<LiveStream>> {
  return authedJson(`/api/v1/admin/live?page=${page}&size=30`, accessToken);
}

export function getAdminLive(accessToken: string, id: string): Promise<LiveStream> {
  return authedJson(`/api/v1/admin/live/${encodeURIComponent(id)}`, accessToken);
}

export function createLive(accessToken: string, input: LiveInput): Promise<LiveStream> {
  return authedJson("/api/v1/admin/live", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateLive(accessToken: string, id: string, input: LiveInput): Promise<LiveStream> {
  return authedJson(`/api/v1/admin/live/${encodeURIComponent(id)}`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function runLiveStep(accessToken: string, id: string, step: LiveStep): Promise<LiveStream> {
  return authedJson(`/api/v1/admin/live/${encodeURIComponent(id)}/${step}`, accessToken, { method: "POST" });
}
