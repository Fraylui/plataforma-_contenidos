import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PostDetailMedia } from "./post-detail-media";

vi.mock("@/lib/server-image-url", () => ({ serverImageUrl: (p: string) => p }));

describe("PostDetailMedia", () => {
  it("sin fotos ni videos: bloque de marca con el título, nunca un hueco gris", () => {
    render(<PostDetailMedia images={[]} videos={[]} title="Feria de Santa Ana" />);
    expect(screen.getByTestId("post-detail-fallback")).toHaveTextContent("Feria de Santa Ana");
  });

  it("con solo video no muestra el bloque de marca", () => {
    render(<PostDetailMedia images={[]} videos={[{ videoId: "abc123def45", title: null, caption: null }]} title="Feria" />);
    expect(screen.queryByTestId("post-detail-fallback")).toBeNull();
  });
});
