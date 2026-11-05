import type { Metadata } from "next";
import { PassportView } from "@/components/passport/passport-view";

export const metadata: Metadata = {
  title: "Mi Pasaporte del Perú",
  description: "Junta un sello por cada región del Perú que conoces y arma tu lista de lugares por visitar.",
  alternates: { canonical: "/pasaporte" },
};

/** El pasaporte vive en el navegador de cada persona: la página solo lo muestra (ver lib/passport.ts). */
export default function PassportPage() {
  return <PassportView />;
}
