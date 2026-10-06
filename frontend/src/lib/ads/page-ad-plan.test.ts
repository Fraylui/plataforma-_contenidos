import { describe, expect, it } from "vitest";
import { assignSlot, createPageAdPlan } from "./page-ad-plan";

const tecnoFeed = { id: "c1", advertiserId: "tecno" };
const cafeFeed = { id: "c2", advertiserId: "cafe" };
const tecnoArticle = { id: "c3", advertiserId: "tecno" };
const cafeSidebar = { id: "c4", advertiserId: "cafe" };
const tecnoSidebar = { id: "c5", advertiserId: "tecno" };

describe("assignSlot", () => {
  it("nunca repite una campaña en la página; los espacios sobrantes quedan libres", () => {
    const plan = createPageAdPlan();
    expect(assignSlot(plan, "en-feed#0", [tecnoFeed, cafeFeed])).toBe(tecnoFeed);
    expect(assignSlot(plan, "en-feed#1", [tecnoFeed, cafeFeed])).toBe(cafeFeed);
    expect(assignSlot(plan, "en-feed#2", [tecnoFeed, cafeFeed])).toBeNull();
  });

  it("prefiere otro anunciante aunque esa campaña venga segunda en la rotación", () => {
    const plan = createPageAdPlan();
    assignSlot(plan, "article#0", [tecnoArticle]);
    expect(assignSlot(plan, "listing#0", [tecnoSidebar, cafeSidebar])).toBe(cafeSidebar);
  });

  it("repite anunciante solo si no hay alternativa", () => {
    const plan = createPageAdPlan();
    assignSlot(plan, "article#0", [tecnoArticle]);
    expect(assignSlot(plan, "listing#0", [tecnoSidebar])).toBe(tecnoSidebar);
  });

  it("es estable: un espacio ya asignado no cambia de anuncio", () => {
    const plan = createPageAdPlan();
    const first = assignSlot(plan, "listing#0", [cafeSidebar, tecnoSidebar]);
    assignSlot(plan, "article#0", [tecnoArticle]);
    expect(assignSlot(plan, "listing#0", [tecnoSidebar, cafeSidebar])).toBe(first);
  });
});
