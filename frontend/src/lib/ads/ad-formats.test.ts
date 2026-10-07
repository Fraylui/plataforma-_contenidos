import { describe, expect, it } from "vitest";
import { creativeFit } from "./ad-formats";

describe("creativeFit", () => {
  it("acepta la medida exacta y marca si tiene el doble (retina)", () => {
    expect(creativeFit(300, 250, 300, 250)).toEqual({ ok: true, retina: false });
    expect(creativeFit(600, 500, 300, 250)).toEqual({ ok: true, retina: true });
  });

  it("tolera redondeos de exportación de hasta 2 %", () => {
    expect(creativeFit(1456, 182, 728, 90).ok).toBe(true); // 8.0 vs 8.09
  });

  it("rechaza otra proporción: se vería recortada o con franjas", () => {
    expect(creativeFit(1200, 300, 300, 250)).toEqual({ ok: false, reason: "aspect" });
    expect(creativeFit(1000, 625, 728, 90)).toEqual({ ok: false, reason: "aspect" });
  });

  it("rechaza una imagen más chica que la posición: se vería borrosa", () => {
    expect(creativeFit(150, 125, 300, 250)).toEqual({ ok: false, reason: "small" });
  });
});
