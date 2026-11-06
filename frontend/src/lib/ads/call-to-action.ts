import type { CallToAction } from "@/lib/api/types";

/**
 * Botones del anuncio nativo (CallToAction.java): lista cerrada como en Meta
 * y Google — un verbo claro, nunca texto libre ni botones engañosos.
 */
export const CALL_TO_ACTIONS: { value: CallToAction; label: string }[] = [
  { value: "LEARN_MORE", label: "Más información" },
  { value: "WHATSAPP", label: "Escribir por WhatsApp" },
  { value: "ORDER", label: "Pedir ahora" },
  { value: "BOOK", label: "Reservar" },
  { value: "SHOP_NOW", label: "Comprar" },
  { value: "SIGN_UP", label: "Registrarme" },
];

export function callToActionLabel(value: CallToAction): string {
  return CALL_TO_ACTIONS.find((c) => c.value === value)?.label ?? "Más información";
}

/** CSS aspect-ratio de cada proporción del medio. Los Shorts (9:16) se muestran en 4:5, como hace Instagram en el feed. */
export const NATIVE_ASPECT_RATIO: Record<string, string> = {
  "1:1": "1 / 1",
  "4:5": "4 / 5",
  "1.91:1": "1.91 / 1",
  "16:9": "16 / 9",
  "9:16": "4 / 5",
};
