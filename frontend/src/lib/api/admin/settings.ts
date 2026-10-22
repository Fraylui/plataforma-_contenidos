// Configuración del sitio (PlatformSettingsAdminController).
import "server-only";
import type { PlatformSettingsInput } from "../admin-types";
import type { PlatformSettings } from "../types";
import { authedJson } from "./http";

export function getAdminPlatformSettings(accessToken: string): Promise<PlatformSettings> {
  return authedJson("/api/v1/admin/platform-settings", accessToken);
}

export function updatePlatformSettings(
  accessToken: string,
  input: PlatformSettingsInput,
): Promise<PlatformSettings> {
  return authedJson("/api/v1/admin/platform-settings", accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
