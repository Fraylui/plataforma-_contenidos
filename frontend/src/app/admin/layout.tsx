import { Toaster } from "sonner";

/**
 * Todo el panel (login incluido). Los avisos emergentes (sonner) solo se usan
 * acá: van en este layout y no en el raíz, para que el sitio público no
 * descargue esa librería (LCP, 2026-10-16).
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
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
