import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnalyticsLoader } from "./analytics-loader";

vi.mock("next/script", () => ({
  default: ({ id, src }: { id?: string; src?: string }) => <script data-testid="script" data-id={id} data-src={src} />,
}));

afterEach(() => localStorage.clear());

describe("AnalyticsLoader (Ley 29733: nada de analítica sin permiso)", () => {
  it("sin respuesta al aviso de cookies no carga Google Analytics", () => {
    const { queryAllByTestId } = render(<AnalyticsLoader measurementId="G-ABC123" />);
    expect(queryAllByTestId("script")).toHaveLength(0);
  });

  it("si la persona rechazó, tampoco", () => {
    localStorage.setItem("cookie-consent", "rejected");
    const { queryAllByTestId } = render(<AnalyticsLoader measurementId="G-ABC123" />);
    expect(queryAllByTestId("script")).toHaveLength(0);
  });

  it("solo después de «Aceptar» carga Analytics con su ID", () => {
    localStorage.setItem("cookie-consent", "accepted");
    const { getAllByTestId } = render(<AnalyticsLoader measurementId="G-ABC123" />);
    expect(getAllByTestId("script")[0]).toHaveAttribute("data-src", "https://www.googletagmanager.com/gtag/js?id=G-ABC123");
  });

  it("sin ID configurado no hace nada", () => {
    localStorage.setItem("cookie-consent", "accepted");
    const { queryAllByTestId } = render(<AnalyticsLoader measurementId={null} />);
    expect(queryAllByTestId("script")).toHaveLength(0);
  });
});
