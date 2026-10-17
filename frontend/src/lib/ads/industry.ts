import type { AdvertiserIndustry } from "@/lib/api/admin-types";

/**
 * Rubros del anunciante (ver AdvertiserIndustry.java). Los regulados llevan
 * una advertencia obligatoria en el propio anuncio: el formulario de campaña
 * la recuerda antes de guardar. Resumen práctico, no asesoría legal.
 */
export const INDUSTRY_OPTIONS: { value: AdvertiserIndustry; label: string }[] = [
  { value: "GENERAL", label: "General (sin advertencia obligatoria)" },
  { value: "PROCESSED_FOOD", label: "Alimentos y bebidas procesados" },
  { value: "ALCOHOL", label: "Bebidas alcohólicas" },
  { value: "BETTING", label: "Apuestas y casinos en línea" },
];

export interface IndustryWarning {
  law: string;
  text: string;
}

const WARNINGS: Partial<Record<AdvertiserIndustry, IndustryWarning>> = {
  PROCESSED_FOOD: {
    law: "Ley 30021",
    text: "Si el producto lleva octógonos («Alto en azúcar», «Alto en sodio», «Alto en grasas saturadas», «Contiene grasas trans»), el anuncio tiene que mostrarlos.",
  },
  ALCOHOL: {
    law: "Ley 28681",
    text: "El anuncio tiene que mostrar, bien visible, «TOMAR BEBIDAS ALCOHÓLICAS EN EXCESO ES DAÑINO» y no puede dirigirse a menores de edad.",
  },
  BETTING: {
    law: "Ley 31557",
    text: "Solo operadores autorizados por el Mincetur. El anuncio tiene que indicar que es solo para mayores de 18 años e incluir un mensaje de juego responsable.",
  },
};

export function industryWarning(industry: AdvertiserIndustry): IndustryWarning | null {
  return WARNINGS[industry] ?? null;
}
