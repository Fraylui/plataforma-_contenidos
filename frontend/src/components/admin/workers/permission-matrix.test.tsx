import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { PermissionMatrix } from "./permission-matrix";
import { TemplateChips } from "./template-chips";

describe("PermissionMatrix", () => {
  it("cada módulo de contenido ofrece No / Crear / Publicar y avisa el cambio", async () => {
    const onChange = vi.fn();
    render(<PermissionMatrix value={{}} onChange={onChange} />);
    const eventos = screen.getByRole("radiogroup", { name: "Eventos" });
    expect(within(eventos).getAllByRole("radio").map((r) => r.getAttribute("aria-label") ?? r.textContent)).toEqual(["No", "Crear", "Publicar"]);
    await userEvent.click(within(eventos).getByRole("radio", { name: "Publicar" }));
    expect(onChange).toHaveBeenCalledWith({ EVENTS: "PUBLISH" });
  });

  it("Temas, Estadísticas y Publicidad solo ofrecen No / Sí", async () => {
    const onChange = vi.fn();
    render(<PermissionMatrix value={{ EVENTS: "CREATE" }} onChange={onChange} />);
    const temas = screen.getByRole("radiogroup", { name: "Temas" });
    expect(within(temas).getAllByRole("radio")).toHaveLength(2);
    await userEvent.click(within(temas).getByRole("radio", { name: "Sí" }));
    expect(onChange).toHaveBeenCalledWith({ EVENTS: "CREATE", CATEGORIES: "ACCESS" });
    await userEvent.click(within(screen.getByRole("radiogroup", { name: "Eventos" })).getByRole("radio", { name: "No" }));
    expect(onChange).toHaveBeenLastCalledWith({});
  });

  it("es accesible", async () => {
    const { container } = render(<PermissionMatrix value={{ ARTICLES: "PUBLISH" }} onChange={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("TemplateChips", () => {
  it("una plantilla precarga sus permisos", async () => {
    const onPick = vi.fn();
    render(<TemplateChips onPick={onPick} />);
    await userEvent.click(screen.getByRole("button", { name: "Gestor de eventos" }));
    expect(onPick).toHaveBeenCalledWith({ EVENTS: "PUBLISH", PLACES: "PUBLISH" });
  });
});
