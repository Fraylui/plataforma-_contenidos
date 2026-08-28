import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Acceso administrador",
  robots: "noindex,nofollow",
};

export default async function AdminLoginPage(props: PageProps<"/admin/login">) {
  const searchParams = await props.searchParams;
  const from = typeof searchParams.from === "string" ? searchParams.from : null;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-semibold text-foreground">Panel administrativo</h1>
        <p className="mt-2 text-center text-sm text-muted">Acceso restringido al equipo editorial y técnico.</p>
        <div className="mt-8 rounded-lg border border-border bg-surface p-6 shadow-sm">
          <LoginForm redirectTo={from} />
        </div>
      </div>
    </div>
  );
}
