import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname } from "next/navigation";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { CookieConsentBanner } from "./cookie-consent-banner";

describe("CookieConsentBanner (integración de componente con localStorage y ruta)", () => {
  it("se muestra sin consentimiento previo y ofrece rechazo real", async () => {
    const { container } = render(<CookieConsentBanner adsenseEnabled={false} />);
    const region = screen.getByRole("region", { name: "Aviso de cookies" });
    expect(region).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rechazar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aceptar" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Más información" })).toHaveAttribute("href", "/privacidad");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Aceptar persiste la decisión y oculta el banner", async () => {
    const user = userEvent.setup();
    render(<CookieConsentBanner adsenseEnabled />);
    await user.click(screen.getByRole("button", { name: "Aceptar" }));
    expect(localStorage.getItem("cookie-consent")).toBe("accepted");
    expect(screen.queryByRole("region", { name: "Aviso de cookies" })).not.toBeInTheDocument();
  });

  it("Rechazar también persiste y oculta (rechazar es una opción real)", async () => {
    const user = userEvent.setup();
    render(<CookieConsentBanner adsenseEnabled />);
    await user.click(screen.getByRole("button", { name: "Rechazar" }));
    expect(localStorage.getItem("cookie-consent")).toBe("rejected");
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("no vuelve a aparecer si ya hay una decisión guardada", () => {
    localStorage.setItem("cookie-consent", "rejected");
    render(<CookieConsentBanner adsenseEnabled />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("nunca se muestra dentro del panel admin", () => {
    vi.mocked(usePathname).mockReturnValue("/admin/publicaciones");
    render(<CookieConsentBanner adsenseEnabled />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("menciona a Google solo cuando AdSense está activo", () => {
    const { unmount } = render(<CookieConsentBanner adsenseEnabled />);
    expect(screen.getByText(/Google/)).toBeInTheDocument();
    unmount();
    render(<CookieConsentBanner adsenseEnabled={false} />);
    expect(screen.queryByText(/Google/)).not.toBeInTheDocument();
  });
});
