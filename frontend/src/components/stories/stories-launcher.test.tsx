import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { lazy, Suspense, type ComponentType } from "react";
import { usePathname } from "next/navigation";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { ActiveTopic } from "@/lib/api/types";
import { StoriesLauncher } from "./stories-launcher";
import { StoryRing } from "./story-ring";

// next/dynamic no corre en Vitest: se simula con React.lazy + Suspense, con el módulo ya precargado.
vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<ComponentType<object>>) => {
    const Lazy = lazy(async () => ({ default: await loader() }));
    return function Dynamic(props: object) {
      return (
        <Suspense fallback={null}>
          <Lazy {...props} />
        </Suspense>
      );
    };
  },
}));

beforeAll(async () => {
  await import("./story-viewer");
});

const topics: ActiveTopic[] = [
  {
    category: { id: "t1", name: "Gastronomía", slug: "gastronomia" },
    latestAt: new Date().toISOString(),
    stories: [{
      id: "s1", imageId: null, background: "OCEAN", caption: "Hola", captionPosition: "CENTER", link: null, youtubeVideoId: null,
      publishedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3_600_000).toISOString(), highlighted: false, likeCount: 0,
    }],
  },
];
const bubble = { categoryId: "t1", name: "Gastronomía", slug: "gastronomia", coverUrl: null, hasNew: false };

function setup() {
  const pushState = vi.spyOn(window.history, "pushState");
  const back = vi.spyOn(window.history, "back").mockImplementation(() => undefined);
  const view = render(
    <StoriesLauncher topics={topics} imageSrc={{}} recent={[]}>
      <StoryRing topic={bubble} storyIds={["s1"]} />
    </StoriesLauncher>,
  );
  return { pushState, back, ...view };
}

describe("StoriesLauncher", () => {
  it("tocar la burbuja abre el visor y agrega la historia al historial", async () => {
    const { pushState } = setup();
    fireEvent.click(screen.getByRole("link", { name: /Ver historias de Gastronomía/ }));
    expect(await screen.findByRole("dialog", { name: "Historias de Gastronomía" })).toBeInTheDocument();
    expect(pushState).toHaveBeenCalledWith(expect.anything(), "", expect.stringContaining("historia=s1"));
  });

  it("cerrar con el botón vuelve atrás en el historial y devuelve el foco a la burbuja", async () => {
    const { back } = setup();
    const ring = screen.getByRole("link", { name: /Ver historias de Gastronomía/ });
    ring.focus();
    fireEvent.click(ring);
    fireEvent.click(await screen.findByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(back).toHaveBeenCalled();
    await waitFor(() => expect(ring).toHaveFocus());
  });

  it("si la página cambia (se tocó un enlace), el visor se cierra solo", async () => {
    const { rerender } = setup();
    fireEvent.click(screen.getByRole("link", { name: /Ver historias de Gastronomía/ }));
    await screen.findByRole("dialog");
    vi.mocked(usePathname).mockReturnValue("/publicaciones/otra");
    act(() => {
      rerender(
        <StoriesLauncher topics={topics} imageSrc={{}} recent={[]}>
          <StoryRing topic={bubble} storyIds={["s1"]} />
        </StoriesLauncher>,
      );
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Volver al Inicio (Atrás desde el contenido) no reabre el visor.
    vi.mocked(usePathname).mockReturnValue("/");
    act(() => {
      rerender(
        <StoriesLauncher topics={topics} imageSrc={{}} recent={[]}>
          <StoryRing topic={bubble} storyIds={["s1"]} />
        </StoriesLauncher>,
      );
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
