// Historias (StoryAdminController).
import "server-only";
import type { AdminStory, AdminStoryTab, StoryItemInput } from "../admin-types";
import { authedJson } from "./http";

export function listAdminStories(accessToken: string, tab: AdminStoryTab): Promise<AdminStory[]> {
  return authedJson(`/api/v1/admin/stories?tab=${tab}`, accessToken);
}

export function getAdminStory(accessToken: string, id: string): Promise<AdminStory> {
  return authedJson(`/api/v1/admin/stories/${encodeURIComponent(id)}`, accessToken);
}

/** Un lote (hasta 10, un tema): se crean todas o ninguna. */
export function createStories(accessToken: string, categoryId: string, items: StoryItemInput[]): Promise<AdminStory[]> {
  return authedJson("/api/v1/admin/stories", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categoryId, items }),
  });
}

export function updateStory(accessToken: string, id: string, item: StoryItemInput): Promise<AdminStory> {
  return authedJson(`/api/v1/admin/stories/${encodeURIComponent(id)}`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
}

export function setStoryHighlighted(accessToken: string, id: string, highlighted: boolean): Promise<AdminStory> {
  return authedJson(`/api/v1/admin/stories/${encodeURIComponent(id)}/highlight`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ highlighted }),
  });
}

export function deleteStory(accessToken: string, id: string): Promise<void> {
  return authedJson(`/api/v1/admin/stories/${encodeURIComponent(id)}`, accessToken, { method: "DELETE" });
}
