import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminList, AdminListRow } from "./admin-list";

describe("AdminList: filas del panel que caben en el celular", () => {
  it("cada fila tiene título, datos y acciones, sin tabla", () => {
    render(
      <AdminList label="Campañas">
        <AdminListRow title={<a href="/x">Post en el feed</a>} meta={["Activa", "1.204 impresiones"]} actions={<button type="button">Desactivar</button>} />
      </AdminList>,
    );

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    const row = within(screen.getByRole("list", { name: "Campañas" })).getByRole("listitem");
    expect(within(row).getByRole("link", { name: "Post en el feed" })).toBeInTheDocument();
    expect(within(row).getByText("1.204 impresiones")).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "Desactivar" })).toBeInTheDocument();
  });
});
