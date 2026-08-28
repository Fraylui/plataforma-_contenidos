import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { MfaSetupFlow } from "./mfa-setup-flow";
import { MfaDisableFlow } from "./mfa-disable-flow";
import { AdminPageHeader } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Autenticación en dos pasos",
  robots: "noindex,nofollow",
};

export default async function MfaSetupPage() {
  const { user } = await requireAdminUser();

  return (
    <div className="max-w-lg">
      <AdminPageHeader
        title="Autenticación en dos pasos (MFA)"
        description="Protege tu cuenta con un código temporal generado por una app como Google Authenticator, Authy o 1Password."
      />

      {user.mfaEnabled ? (
        <div className="mt-6 rounded-md border border-border bg-surface px-4 py-3 text-sm text-foreground">
          <span className="font-medium text-accent">Ya está activa</span> en tu cuenta. Cambiar de dispositivo/app de
          autenticación todavía no está disponible desde el panel — es una operación sensible (ver riesgo conocido en
          el reporte de esta tarea) y por ahora requiere soporte técnico directo.
          {user.role === "SUPER_ADMIN" ? (
            <p className="mt-3 text-muted">
              Como SUPER_ADMIN no puedes desactivar tu propio MFA — es obligatorio sin excepción (CONTEXTO.md
              sección 36.5).
            </p>
          ) : (
            <MfaDisableFlow />
          )}
        </div>
      ) : (
        <div className="mt-6">
          <MfaSetupFlow />
        </div>
      )}
    </div>
  );
}
