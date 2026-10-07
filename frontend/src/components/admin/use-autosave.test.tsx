import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTOSAVE_INTERVAL_MS, useAutosave } from "./use-autosave";

describe("useAutosave", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("guarda cada 10 s mientras hay cambios", async () => {
    const save = vi.fn().mockResolvedValue(true);
    renderHook(() => useAutosave({ enabled: true, dirty: true, save }));
    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_INTERVAL_MS));
    expect(save).toHaveBeenCalledTimes(1);
    expect(AUTOSAVE_INTERVAL_MS).toBe(10_000);
  });

  it("sin cambios no guarda", async () => {
    const save = vi.fn().mockResolvedValue(true);
    renderHook(() => useAutosave({ enabled: true, dirty: false, save }));
    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_INTERVAL_MS * 3));
    expect(save).not.toHaveBeenCalled();
  });

  it("deshabilitado (lo ya publicado) no guarda nunca solo", async () => {
    const save = vi.fn().mockResolvedValue(true);
    renderHook(() => useAutosave({ enabled: false, dirty: true, save }));
    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_INTERVAL_MS * 3));
    expect(save).not.toHaveBeenCalled();
  });

  it("no empieza otro guardado mientras uno sigue en curso", async () => {
    let finish: (value: boolean) => void = () => {};
    const save = vi.fn(() => new Promise<boolean>((resolve) => (finish = resolve)));
    renderHook(() => useAutosave({ enabled: true, dirty: true, save }));
    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_INTERVAL_MS * 3));
    expect(save).toHaveBeenCalledTimes(1);
    await act(async () => finish(true));
    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_INTERVAL_MS));
    expect(save).toHaveBeenCalledTimes(2);
  });

  it("usa siempre la versión más reciente de save (los valores actuales del formulario)", async () => {
    const first = vi.fn().mockResolvedValue(true);
    const second = vi.fn().mockResolvedValue(true);
    const { rerender } = renderHook(({ save }) => useAutosave({ enabled: true, dirty: true, save }), {
      initialProps: { save: first },
    });
    rerender({ save: second });
    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_INTERVAL_MS));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
