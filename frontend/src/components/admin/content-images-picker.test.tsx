import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ContentImage } from "@/lib/api/types";
import { ContentImagesPicker } from "./content-images-picker";

const { upload } = vi.hoisted(() => ({ upload: vi.fn() }));
vi.mock("@/app/admin/(protected)/imagenes/actions", () => ({ uploadImageInlineAction: upload }));

function Harness() {
  const [value, setValue] = useState<ContentImage[]>([]);
  return <ContentImagesPicker allImages={[]} value={value} onChange={setValue} />;
}

describe("ContentImagesPicker", () => {
  it("subir varias fotos de una vez las agrega todas, en orden", async () => {
    upload.mockImplementation(async (formData: FormData) => {
      const name = (formData.get("file") as File).name;
      return { ok: true, data: { id: name, url: `/api/v1/images/${name}/file`, originalFilename: name, width: 10, height: 10 } };
    });
    render(<Harness />);

    await userEvent.upload(screen.getByLabelText(/Sube tus fotos/), [
      new File(["x"], "a.jpg", { type: "image/jpeg" }),
      new File(["x"], "b.jpg", { type: "image/jpeg" }),
      new File(["x"], "c.jpg", { type: "image/jpeg" }),
    ]);

    await waitFor(() => expect(screen.getByText(/3 imágenes seleccionadas/)).toBeInTheDocument());
  });

  it("ya no ofrece pegar enlaces de otros sitios", () => {
    render(<Harness />);
    expect(screen.queryByText(/pega el enlace/i)).not.toBeInTheDocument();
  });
});
