import { connection } from "next/server";
import { Toaster } from "sonner";

/**
 * Todo el panel (login incluido). Los avisos emergentes (sonner) solo se usan
 * acá: van en este layout y no en el raíz, para que el sitio público no
 * descargue esa librería (LCP, 2026-10-16).
 *
 * connection(): todo el panel se genera en cada visita. La CSP del panel usa
 * un nonce por visita (src/proxy.ts) y una página estática no lo tendría en
 * sus <script> — el navegador los bloquearía.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await connection();
  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        theme="system"
        richColors
        toastOptions={{
          style: {
            background: "var(--surface)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
          },
        }}
      />
    </>
  );
}
