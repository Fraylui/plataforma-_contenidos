import { describe, expect, it } from "vitest";
import { pageTitle } from "./page-title";

describe("pageTitle", () => {
  it("pestañas y secciones: solo el título", () => {
    expect(pageTitle("/")).toEqual({ title: "Inicio", back: null });
    expect(pageTitle("/explorar")).toEqual({ title: "Explorar", back: null });
    expect(pageTitle("/eventos")).toEqual({ title: "Agenda", back: null });
    expect(pageTitle("/lugares")).toEqual({ title: "Lugares", back: null });
  });

  it("detalle: título del tipo y flecha a su sección", () => {
    expect(pageTitle("/lugares/mirador")).toEqual({ title: "Lugar", back: "/lugares" });
    expect(pageTitle("/eventos/feria")).toEqual({ title: "Evento", back: "/eventos" });
    expect(pageTitle("/publicaciones/ruta")).toEqual({ title: "Publicación", back: "/publicaciones" });
    expect(pageTitle("/categorias/turismo")).toEqual({ title: "Tema", back: "/" });
  });

  it("páginas legales y desconocidas", () => {
    expect(pageTitle("/privacidad")).toEqual({ title: "Privacidad", back: "/" });
    expect(pageTitle("/algo-raro")).toEqual({ title: "", back: "/" });
  });
});
