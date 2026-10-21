import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CelebrationStamp } from "./celebration-stamp";

afterEach(() => vi.useRealTimers());

describe("CelebrationStamp", () => {
  it("muestra el día y el mes en grande y cuánto falta", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-21T15:00:00Z"));
    render(<CelebrationStamp nextAt="2026-11-01T05:00:00Z" />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("nov")).toBeInTheDocument();
    expect(screen.getByText("Faltan 11 días")).toBeInTheDocument();
  });

  it("si ya pasó, solo la fecha", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-21T15:00:00Z"));
    render(<CelebrationStamp nextAt="2026-10-01T05:00:00Z" />);
    expect(screen.queryByText(/Faltan|Es hoy|Mañana/)).toBeNull();
  });
});
