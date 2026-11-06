import { describe, expect, it } from "vitest";
import { countryStamps, milestone, parsePassport, stamps, withStatus } from "./passport";

const place = { name: "Mirador de Acuchimay", href: "/lugares/mirador", region: "AYACUCHO" };

describe("Mis viajes", () => {
  it("«Ya fui» da el sello de la región; tocarlo otra vez lo quita", () => {
    const been = withStatus({}, "mirador", place, "BEEN", new Date("2026-11-05T10:00:00Z"));
    expect(stamps(been).get("AYACUCHO")).toEqual({ place: "Mirador de Acuchimay", at: "2026-11-05T10:00:00.000Z" });
    expect(stamps(withStatus(been, "mirador", place, "BEEN")).size).toBe(0);
  });

  it("«Quiero ir» no da sello y cambia a «Ya fui» al tocarlo", () => {
    const want = withStatus({}, "mirador", place, "WANT");
    expect(stamps(want).size).toBe(0);
    expect(withStatus(want, "mirador", place, "BEEN").mirador.status).toBe("BEEN");
  });

  it("dos lugares de la misma región cuentan un solo sello; sin región, ninguno", () => {
    let p = withStatus({}, "a", place, "BEEN");
    p = withStatus(p, "b", { ...place, name: "Pampa de la Quinua" }, "BEEN");
    p = withStatus(p, "c", { ...place, region: null }, "BEEN");
    expect(stamps(p).size).toBe(1);
  });

  it("los países suman aparte; el Perú cuenta como país y lo guardado sin país con región es Perú", () => {
    let p = withStatus({}, "a", place, "BEEN");
    p = withStatus(p, "uyuni", { name: "Salar de Uyuni", href: "/lugares/uyuni", region: null, country: "BO" }, "BEEN");
    expect([...countryStamps(p).keys()].sort()).toEqual(["BO", "PE"]);
    expect(stamps(p).size).toBe(1);
  });

  it("datos dañados no rompen la página", () => {
    expect(parsePassport("{no es json")).toEqual({});
    expect(parsePassport("[1,2]")).toEqual({});
  });

  it("celebra los hitos", () => {
    expect(milestone(1)).toBe("¡Primer sello!");
    expect(milestone(25)).toBe("¡Conoces todo el Perú!");
    expect(milestone(2)).toBeNull();
  });
});
