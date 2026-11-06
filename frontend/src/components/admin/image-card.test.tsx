import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminImage } from "@/lib/api/admin-types";

const { updateAlt, toastSuccess } = vi.hoisted(() => ({ updateAlt: vi.fn(), toastSuccess: vi.fn() }));
vi.mock("@/app/admin/(protected)/imagenes/actions", () => ({
  updateImageAltTextAction: updateAlt,
  deleteImageAction: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: toastSuccess } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { ImageCard } from "./image-card";

const image: AdminImage = {
  id: "img-1",
  url: "/api/v1/images/img-1/file",
  originalFilename: "Semana_Santa_en_Ayacucho_.jpg",
  contentType: "image/jpeg",
  sizeBytes: 208_000,
  width: 1214,
  height: 697,
  altText: "Procesión",
  purpose: "CONTENT",
  uploadedBy: "user-1",
  createdAt: "2026-10-01T00:00:00Z",
};

describe("ImageCard: la descripción se guarda solo si cambió, y avisa", () => {
  beforeEach(() => {
    updateAlt.mockReset();
    toastSuccess.mockReset();
  });

  it("no ofrece guardar mientras la descripción no cambie", () => {
    render(<ImageCard image={image} canManage />);
    expect(screen.queryByRole("button", { name: "Guardar" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: /Describe la foto/ }), { target: { value: "Procesión de noche" } });
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
  });

  it("al guardar avisa y vuelve a esconder el botón", async () => {
    updateAlt.mockResolvedValue({ ok: true });
    render(<ImageCard image={image} canManage />);
    fireEvent.change(screen.getByRole("textbox", { name: /Describe la foto/ }), { target: { value: "Procesión de noche" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(updateAlt).toHaveBeenCalledWith("img-1", "Procesión de noche");
    expect(screen.queryByRole("button", { name: "Guardar" })).not.toBeInTheDocument();
  });

  it("eliminar es un botón con nombre aunque solo muestre el ícono", () => {
    render(<ImageCard image={image} canManage />);
    expect(screen.getByRole("button", { name: "Eliminar imagen" })).toBeInTheDocument();
  });
});
