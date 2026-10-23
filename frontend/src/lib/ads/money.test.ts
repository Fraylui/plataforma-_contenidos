import { describe, expect, it } from "vitest";
import { formatBilledTotal, formatMoney as format } from "./money";

// Intl separa el símbolo con un espacio de no separación (U+00A0): en pantalla «S/» no queda solo al final de una línea.
const NBSP = new RegExp(String.fromCharCode(0xa0), "g");
const plain = (text: string | null) => text?.replace(NBSP, " ") ?? null;
const formatMoney = (amount: number, currency: string | null) => plain(format(amount, currency));

describe("formatMoney", () => {
  it("usa el símbolo de la moneda cuando el código es válido", () => {
    expect(formatMoney(390, "PEN")).toBe("S/ 390.00");
    expect(formatMoney(390, "pen")).toBe("S/ 390.00");
  });

  it("sin código o con uno inválido no rompe: queda el número", () => {
    expect(formatMoney(390, null)).toBe("390.00");
    expect(formatMoney(390, "SOLES")).toBe("SOLES 390.00");
  });
});

describe("formatBilledTotal", () => {
  it("no suma monedas distintas: un total por moneda", () => {
    expect(
      plain(
        formatBilledTotal([
          { amount: 200, currency: "PEN" },
          { amount: 50, currency: "USD" },
          { amount: 190, currency: "PEN" },
        ]),
      ),
    ).toBe("S/ 390.00 + USD 50.00");
  });

  it("sin montos → null", () => {
    expect(formatBilledTotal([{ amount: null, currency: "PEN" }])).toBeNull();
    expect(formatBilledTotal([])).toBeNull();
  });
});
