import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FloatingReactions } from "./floating-reactions";

const base = { contentType: "publications" as const, slug: "mercado", title: "Mercado" };

describe("FloatingReactions", () => {
  it("sin me gusta todavía no muestra «0» (como en el feed)", () => {
    render(<FloatingReactions {...base} initialLikeCount={0} />);
    const like = screen.getByRole("button", { name: /Me gusta/ });
    expect(like).not.toHaveTextContent("0");
    expect(screen.getByRole("button", { name: "Compartir" })).toBeInTheDocument();
  });

  it("con me gusta muestra el número", () => {
    render(<FloatingReactions {...base} initialLikeCount={12} />);
    expect(screen.getByRole("button", { name: /Me gusta/ })).toHaveTextContent("12");
  });
});
