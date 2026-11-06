import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import type { ReactNode } from "react";
import { PhonePreview, previewImageUrls } from "./phone-preview";

function WithForm({ children, values }: { children: ReactNode; values: Record<string, unknown> }) {
  const form = useForm({ defaultValues: values });
  return <FormProvider {...form}>{children}</FormProvider>;
}

describe("vista previa en celular", () => {
  it("toma las fotos subidas y los enlaces que ya estaban, en orden", () => {
    const urls = previewImageUrls(
      [
        { imageId: "a", externalUrl: null, title: null, caption: null },
        { imageId: null, externalUrl: "https://ejemplo.pe/f.jpg", title: null, caption: null },
        { imageId: "no-existe", externalUrl: null, title: null, caption: null },
      ],
      [{ id: "a", url: "/api/v1/images/a/file" } as never],
    );
    expect(urls).toHaveLength(2);
    expect(urls[0]).toMatch(/\/api\/v1\/images\/a\/file$/);
    expect(urls[1]).toBe("https://ejemplo.pe/f.jpg");
  });

  it("muestra el post con lo escrito ahora, aunque sea borrador", async () => {
    render(
      <WithForm
        values={{
          title: "Atardecer en Paracas",
          excerpt: "Así se ve desde la playa.",
          categoryId: "c1",
          body: "<p>Llegamos temprano.</p>",
          images: [],
          videos: [{ url: "https://www.youtube.com/watch?v=abcdefghijk", title: null, caption: null }],
        }}
      >
        <PhonePreview siteName="Ecos" categories={[{ id: "c1", name: "Viajes" } as never]} allImages={[]} />
      </WithForm>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Ver como en el celular" }));
    const dialog = await screen.findByRole("dialog", { name: "Así se verá en el celular" });
    expect(dialog).toHaveTextContent("Atardecer en Paracas");
    expect(dialog).toHaveTextContent("Así se ve desde la playa.");
    expect(dialog).toHaveTextContent("Llegamos temprano.");
    expect(dialog).toHaveTextContent("Viajes");
    expect(dialog.querySelector('img[src*="i.ytimg.com/vi/abcdefghijk"]')).not.toBeNull();
  });
});
