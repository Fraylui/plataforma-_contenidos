/**
 * Montos de campañas en el panel. Cada campaña tiene su propia moneda (ISO
 * 4217, la escribe quien la crea): un total no puede sumar soles con dólares,
 * así que se agrupa por moneda. Con el código válido, Intl pone el símbolo
 * («S/ 390.00»); si no lo es, queda «código + número».
 */
const PLAIN = new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatMoney(amount: number, currency: string | null): string {
  const code = currency?.trim().toUpperCase() ?? "";
  if (/^[A-Z]{3}$/.test(code)) {
    try {
      return new Intl.NumberFormat("es-PE", { style: "currency", currency: code }).format(amount);
    } catch {
      // Código con forma válida pero desconocido para Intl: cae al formato simple.
    }
  }
  return code ? `${code} ${PLAIN.format(amount)}` : PLAIN.format(amount);
}

/** «S/ 390.00 + US$ 50.00»: un total por moneda, en el orden en que aparecen; null si no hay montos. */
export function formatBilledTotal(campaigns: { amount: number | null; currency: string | null }[]): string | null {
  const totals = new Map<string, number>();
  for (const { amount, currency } of campaigns) {
    if (amount == null) continue;
    const code = currency?.trim().toUpperCase() ?? "";
    totals.set(code, (totals.get(code) ?? 0) + amount);
  }
  const parts = [...totals].filter(([, total]) => total > 0).map(([code, total]) => formatMoney(total, code || null));
  return parts.length > 0 ? parts.join(" + ") : null;
}
