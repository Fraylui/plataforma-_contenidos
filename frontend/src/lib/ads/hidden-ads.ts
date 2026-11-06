/**
 * «Ocultar este anuncio» (como Meta y Google): se recuerda en este navegador
 * y la campaña deja de asignarse a sus espacios. Es una comodidad del
 * visitante — sin cuentas ni datos personales — así que si el almacenamiento
 * no está disponible (modo privado, bloqueado) simplemente no se recuerda.
 */
const KEY = "ads:hidden";
const MAX_HIDDEN = 50;

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids.slice(-MAX_HIDDEN)));
  } catch {
    // Sin almacenamiento: el anuncio queda oculto solo en esta vista.
  }
}

export function isAdHidden(campaignId: string): boolean {
  if (typeof window === "undefined") return false;
  return read().includes(campaignId);
}

export function hideAd(campaignId: string) {
  const ids = read();
  if (!ids.includes(campaignId)) write([...ids, campaignId]);
}

export function unhideAd(campaignId: string) {
  write(read().filter((id) => id !== campaignId));
}
