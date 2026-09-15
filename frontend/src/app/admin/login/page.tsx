import type { Metadata } from "next";
import { getPlatformSettings } from "@/lib/api/client";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Acceso administrador",
  robots: "noindex,nofollow",
};

export default async function AdminLoginPage(props: PageProps<"/admin/login">) {
  const searchParams = await props.searchParams;
  const from = typeof searchParams.from === "string" ? searchParams.from : null;
  const settings = await getPlatformSettings();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex flex-col items-center gap-3">
          {settings.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL de logo definida por el usuario en Configuración, host arbitrario
            <img src={settings.logoUrl} alt="" className="h-9 w-auto" />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-base font-bold text-accent-foreground">
              {settings.name.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="text-sm font-medium tracking-tight text-foreground">{settings.name}</span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-muted">Acceso restringido al equipo de la plataforma.</p>

          <div className="mt-6">
            <LoginForm redirectTo={from} />
          </div>
        </div>
      </div>
    </div>
  );
}
