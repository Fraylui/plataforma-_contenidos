import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { onlyImages, PhotoDropZone } from "./photo-drop-zone";

const { upload } = vi.hoisted(() => ({ upload: vi.fn() }));
vi.mock("@/app/admin/(protected)/imagenes/actions", () => ({ uploadImageInlineAction: upload }));

function photo(name: string) {
  return new File(["x"], name, { type: "image/jpeg" });
}

describe("PhotoDropZone", () => {
  beforeEach(() => {
    upload.mockReset();
  });

  it("sube varias fotos en orden y las entrega juntas al terminar", async () => {
    upload.mockImplementation(async (formData: FormData) => ({ ok: true, data: { id: (formData.get("file") as File).name } }));
    const onUploaded = vi.fn();
    render(<PhotoDropZone onUploaded={onUploaded} />);

    await userEvent.upload(screen.getByLabelText(/Sube tus fotos/), [photo("a.jpg"), photo("b.jpg")]);

    await waitFor(() => expect(onUploaded).toHaveBeenCalledTimes(1));
    expect(onUploaded.mock.calls[0][0].map((image: { id: string }) => image.id)).toEqual(["a.jpg", "b.jpg"]);
  });

  it("si una falla, sigue con las demás y dice cuál falló", async () => {
    upload
      .mockResolvedValueOnce({ ok: false, error: "es demasiado grande" })
      .mockResolvedValueOnce({ ok: true, data: { id: "b" } });
    const onUploaded = vi.fn();
    render(<PhotoDropZone onUploaded={onUploaded} />);

    await userEvent.upload(screen.getByLabelText(/Sube tus fotos/), [photo("grande.jpg"), photo("b.jpg")]);

    expect(await screen.findByRole("alert")).toHaveTextContent("grande.jpg: es demasiado grande");
    expect(onUploaded).toHaveBeenCalledTimes(1);
    expect(onUploaded.mock.calls[0][0]).toEqual([{ id: "b" }]);
  });

  it("solo acepta imágenes", () => {
    const pdf = new File(["x"], "doc.pdf", { type: "application/pdf" });
    expect(onlyImages([photo("a.jpg"), pdf]).map((f) => f.name)).toEqual(["a.jpg"]);
  });
});
