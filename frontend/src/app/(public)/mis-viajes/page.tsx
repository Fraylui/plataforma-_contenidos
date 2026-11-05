import type { Metadata } from "next";
import { PassportView } from "@/components/passport/passport-view";

export const metadata: Metadata = {
  title: "Mis viajes",
  description: "Junta un sello por cada país y cada región del Perú que conoces, y arma tu lista de lugares por visitar.",
  alternates: { canonical: "/mis-viajes" },
};

/** «Mis viajes» vive en el navegador de cada persona: la página solo lo muestra (ver lib/passport.ts). */
export default function MyTripsPage() {
  return <PassportView />;
}
