import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StoryComposer } from "./story-composer";

const upload = vi.fn();
const createStories = vi.fn();
vi.mock("@/app/admin/(protected)/imagenes/actions", () => ({ uploadImageInlineAction: (...args: unknown[]) => upload(...args) }));
vi.mock("@/app/admin/(protected)/historias/actions", () => ({ createStoriesAction: (...args: unknown[]) => createStories(...args) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const categories = [
  { id: "c1", name: "Gastronomía" },
  { id: "c2", name: "Historia" },
];

function files(n: number) {
  return Array.from({ length: n }, (_, i) => new File([`img${i}`], `foto${i}.jpg`, { type: "image/jpeg" }));
}

function pickPhotos(n: number) {
  const input = screen.getByLabelText("Elegir fotos", { selector: "input" });
  fireEvent.change(input, { target: { files: files(n) } });
}

beforeEach(() => {
  upload.mockReset();
  createStories.mockReset();
  let i = 0;
  upload.mockImplementation(async () => ({ ok: true, data: { id: `img-${i++}`, url: "/api/v1/images/x/file" } }));
  createStories.mockResolvedValue({ ok: true });
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:preview"), revokeObjectURL: vi.fn() }));
});

describe("StoryComposer", () => {
  it("más de 10 fotos: se quedan 10 y avisa", async () => {
    render(<StoryComposer categories={categories} />);
    pickPhotos(11);
    expect(await screen.findByText("Máximo 10 por vez: se agregaron las primeras.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByRole("group", { name: /^Historia \d+$/ })).toHaveLength(10));
  });

  it("sin tema no se puede publicar", async () => {
    render(<StoryComposer categories={categories} />);
    fireEvent.click(screen.getByRole("button", { name: "Solo texto" }));
    fireEvent.change(screen.getByLabelText("Texto", { selector: "textarea" }), { target: { value: "Hola" } });
    expect(screen.getByRole("button", { name: /Publicar/ })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Tema"), { target: { value: "c1" } });
    expect(screen.getByRole("button", { name: /Publicar/ })).toBeEnabled();
  });

  it("una foto que falló bloquea publicar y deja reintentar o quitarla", async () => {
    upload.mockResolvedValueOnce({ ok: true, data: { id: "img-ok", url: "/x" } }).mockResolvedValueOnce({ ok: false, error: "Muy pesada" });
    render(<StoryComposer categories={categories} />);
    fireEvent.change(screen.getByLabelText("Tema"), { target: { value: "c1" } });
    pickPhotos(2);
    const failed = await screen.findByRole("group", { name: "Historia 2" });
    expect(within(failed).getByText(/No se pudo subir: Muy pesada/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Publicar/ })).toBeDisabled();

    upload.mockResolvedValueOnce({ ok: true, data: { id: "img-retry", url: "/x" } });
    fireEvent.click(within(failed).getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Publicar 2 historias" })).toBeEnabled());

    fireEvent.click(within(screen.getByRole("group", { name: "Historia 2" })).getByRole("button", { name: "Quitar" }));
    expect(screen.getByRole("button", { name: "Publicar 1 historia" })).toBeEnabled();
  });

  it("el texto cuenta hasta 140", () => {
    render(<StoryComposer categories={categories} />);
    fireEvent.click(screen.getByRole("button", { name: "Solo texto" }));
    fireEvent.change(screen.getByLabelText("Texto", { selector: "textarea" }), { target: { value: "a".repeat(20) } });
    expect(screen.getByText("20/140")).toBeInTheDocument();
    expect(screen.getByLabelText("Texto", { selector: "textarea" })).toHaveAttribute("maxLength", "140");
  });

  it("enlace a contenido y video de YouTube no van juntos", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      items: [{ contentType: "PUBLICATION", id: "p1", slug: "diez-platos", title: "Diez platos" }],
    }))));
    render(<StoryComposer categories={categories} />);
    fireEvent.click(screen.getByRole("button", { name: "Solo texto" }));
    fireEvent.change(screen.getByLabelText("Buscar contenido"), { target: { value: "platos" } });
    fireEvent.click(await screen.findByRole("button", { name: /Diez platos/ }));
    expect(screen.getByText("Lleva a: Diez platos")).toBeInTheDocument();
    expect(screen.getByLabelText("Video de YouTube (opcional)")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Quitar enlace" }));
    expect(screen.getByLabelText("Video de YouTube (opcional)")).toBeEnabled();
    vi.unstubAllGlobals();
  });

  it("publica todo en un solo lote, en orden, y el botón dice cuántas", async () => {
    render(<StoryComposer categories={categories} />);
    fireEvent.change(screen.getByLabelText("Tema"), { target: { value: "c2" } });
    pickPhotos(2);
    fireEvent.click(screen.getByRole("button", { name: "Solo texto" }));
    fireEvent.change(within(screen.getByRole("group", { name: "Historia 3" })).getByLabelText("Texto", { selector: "textarea" }), {
      target: { value: "Dato curioso" },
    });
    const publish = await screen.findByRole("button", { name: "Publicar 3 historias" });
    await waitFor(() => expect(publish).toBeEnabled());
    await act(async () => {
      fireEvent.click(publish);
    });
    expect(createStories).toHaveBeenCalledTimes(1);
    const [categoryId, items] = createStories.mock.calls[0];
    expect(categoryId).toBe("c2");
    expect(items.map((item: { imageId: string | null; caption: string | null }) => item.imageId ?? item.caption)).toEqual([
      "img-0",
      "img-1",
      "Dato curioso",
    ]);
  });
});
