import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
const uploadImageAction = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/admin/(protected)/imagenes/actions", () => ({
  uploadImageAction: (formData: FormData) => uploadImageAction(formData),
}));

import { ImageUploadForm } from "./image-upload-form";

function image(name: string) {
  return new File(["x"], name, { type: "image/png" });
}

describe("ImageUploadForm", () => {
  beforeEach(() => {
    refresh.mockReset();
    uploadImageAction.mockReset();
  });

  it("sube varias imágenes soltadas, una por una, y muestra el estado de cada una", async () => {
    uploadImageAction.mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({ ok: false, error: "Archivo muy grande" });
    render(<ImageUploadForm />);

    fireEvent.drop(screen.getByRole("button", { name: /subir imágenes/i }), {
      dataTransfer: { files: [image("a.png"), image("b.png"), new File(["x"], "nota.txt", { type: "text/plain" })] },
    });

    await waitFor(() => expect(screen.getByText("Archivo muy grande")).toBeInTheDocument());
    expect(uploadImageAction).toHaveBeenCalledTimes(2);
    expect((uploadImageAction.mock.calls[0][0] as FormData).get("file")).toHaveProperty("name", "a.png");
    expect(screen.getByText("Subida")).toBeInTheDocument();
    expect(screen.queryByText("nota.txt")).not.toBeInTheDocument();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("no refresca la página si ninguna se subió", async () => {
    uploadImageAction.mockResolvedValue({ ok: false, error: "Sin permiso" });
    render(<ImageUploadForm />);

    fireEvent.drop(screen.getByRole("button", { name: /subir imágenes/i }), { dataTransfer: { files: [image("a.png")] } });

    await waitFor(() => expect(screen.getByText("Sin permiso")).toBeInTheDocument());
    expect(refresh).not.toHaveBeenCalled();
  });
});
