import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { MfaSetupFlow } from "./mfa-setup-flow";

export const metadata: Metadata = {
  title: "Autenticación en dos pasos",
  robots: "noindex,nofollow",
};

export default async function MfaSetupPage() {
  const { user } = await requireAdminUser();

  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-2xl font-medium text-foreground">Autenticación en dos pasos (MFA)</h1>
      <p className="mt-2 text-sm text-muted">
        Protege tu cuenta con un código temporal generado por una app como Google Authenticator, Authy o 1Password.
      </p>

      {user.mfaEnabled ? (
        <div className="mt-6 rounded-md border border-border bg-surface px-4 py-3 text-sm text-foreground">
          <span className="font-medium text-accent">Ya está activa</span> en tu cuenta. Cambiar de dispositivo/app de
          autenticación todavía no está disponible desde el panel — es una operación sensible (ver riesgo conocido en
          el reporte de esta tarea) y por ahora requiere soporte técnico directo.
        </div>
      ) : (
        <div className="mt-6">
          <MfaSetupFlow />
        </div>
      )}
    </div>
  );
}
