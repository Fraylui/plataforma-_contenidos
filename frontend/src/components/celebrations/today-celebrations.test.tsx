import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TodayCelebrations, type TodayCelebration } from "./today-celebrations";

function date(slug: string, title: string): TodayCelebration {
  return { id: slug, slug, title, coverSrc: null, externalCoverUrl: null, dateLabel: "16 de octubre" };
}

const PERU = date("dia-de-la-cancion-criolla", "Día de la Canción Criolla");
const AYACUCHO = date("semana-santa-ayacuchana", "Semana Santa ayacuchana");

function mockFetch(status: number, body?: TodayCelebration[]) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status, json: () => Promise.resolve(body) }));
}

afterEach(() => vi.unstubAllGlobals());

describe("Hoy se celebra", () => {
  it("cambia lo de la página por lo del lugar del visitante", async () => {
    mockFetch(200, [AYACUCHO, PERU]);
    render(<TodayCelebrations initial={[PERU]} />);
    expect(screen.getByRole("link", { name: /Día de la Canción Criolla/ })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /Semana Santa ayacuchana/ })).toHaveAttribute(
      "href",
      "/celebraciones/semana-santa-ayacuchana",
    );
    expect(screen.getByText(/También hoy/)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/celebrations/today", expect.anything());
  });

  it("si el proxy no responde, se queda lo que vino en la página", async () => {
    mockFetch(204);
    render(<TodayCelebrations initial={[PERU]} />);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.getByRole("link", { name: /Día de la Canción Criolla/ })).toBeInTheDocument();
  });

  it("sin nada que celebrar donde está el visitante, no deja hueco", async () => {
    mockFetch(200, []);
    const { container } = render(<TodayCelebrations initial={[PERU]} />);
    await vi.waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
