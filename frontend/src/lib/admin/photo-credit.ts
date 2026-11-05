/** Mismas reglas que ContentImageInput.hasValidCredit en el backend. */
export const CREDIT_MAX = 120;

/** ¿Falta algo para usar esta foto? null si está bien (propia, o ajena con nombre y permiso). */
export function photoCreditError(credit: string | null | undefined, rightsConfirmed: boolean | undefined): string | null {
  if (credit === null || credit === undefined) return null;
  if (!credit.trim()) return "Escribe de quién es la foto.";
  if (credit.trim().length > CREDIT_MAX) return `El nombre admite hasta ${CREDIT_MAX} letras.`;
  if (!rightsConfirmed) return "Confirma que tienes su permiso por escrito o una licencia libre.";
  return null;
}

