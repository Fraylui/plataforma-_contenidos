// Trabajadores: solo el dueño (WorkerAdminController, spec 2a §5).
import "server-only";
import type { CreateWorkerInput, ModulePermissions, Worker } from "../admin-types";
import { authedJson } from "./http";

export function listWorkers(accessToken: string): Promise<Worker[]> {
  return authedJson("/api/v1/admin/workers", accessToken);
}

export function createWorker(accessToken: string, input: CreateWorkerInput): Promise<{ worker: Worker; temporaryPassword: string }> {
  return authedJson("/api/v1/admin/workers", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateWorkerPermissions(accessToken: string, id: string, permissions: ModulePermissions): Promise<Worker> {
  return authedJson(`/api/v1/admin/workers/${encodeURIComponent(id)}/permissions`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ permissions }),
  });
}

export function resetWorkerPassword(accessToken: string, id: string): Promise<{ temporaryPassword: string }> {
  return authedJson(`/api/v1/admin/workers/${encodeURIComponent(id)}/reset-password`, accessToken, { method: "POST" });
}

export function setWorkerActive(accessToken: string, id: string, active: boolean): Promise<Worker> {
  return authedJson(`/api/v1/admin/workers/${encodeURIComponent(id)}/${active ? "activate" : "deactivate"}`, accessToken, {
    method: "POST",
  });
}
