// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { classifyRelease, DISMISS_Y, HOLD_MS, useStoryGestures, VELOCITY } from "./story-gestures";

const width = 400;

describe("classifyRelease", () => {
  it("un toque en el tercio izquierdo va atrás; en el resto, adelante", () => {
    expect(classifyRelease({ dx: 0, dy: 0, dt: 120, x: 100, width })).toBe("tapLeft");
    expect(classifyRelease({ dx: 2, dy: 1, dt: 120, x: 300, width })).toBe("tapRight");
  });

  it("un deslizamiento rápido hacia abajo cierra aunque sea corto (por velocidad)", () => {
    expect(40 / 200).toBeGreaterThan(VELOCITY);
    expect(classifyRelease({ dx: 0, dy: 40, dt: 200, x: 200, width })).toBe("dismiss");
  });

  it("uno lento y corto vuelve a su lugar; uno largo cierra aunque sea lento", () => {
    expect(classifyRelease({ dx: 0, dy: 40, dt: 2000, x: 200, width })).toBe("none");
    expect(classifyRelease({ dx: 0, dy: DISMISS_Y + 1, dt: 3000, x: 200, width })).toBe("dismiss");
  });

  it("horizontal cambia de tema por velocidad o por recorrido (30 % del ancho)", () => {
    expect(classifyRelease({ dx: -60, dy: 5, dt: 150, x: 200, width })).toBe("nextTopic");
    expect(classifyRelease({ dx: 130, dy: 5, dt: 2000, x: 200, width })).toBe("prevTopic");
    expect(classifyRelease({ dx: -60, dy: 5, dt: 2000, x: 200, width })).toBe("none");
  });

  it("hacia arriba abre el enlace", () => {
    expect(classifyRelease({ dx: 0, dy: -80, dt: 200, x: 200, width })).toBe("swipeUp");
  });
});

describe("useStoryGestures", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup() {
    const element = document.createElement("div");
    element.getBoundingClientRect = () => ({ left: 0, top: 0, width, height: 700 }) as DOMRect;
    element.setPointerCapture = vi.fn();
    const handlers = {
      onTapLeft: vi.fn(), onTapRight: vi.fn(), onHoldStart: vi.fn(), onHoldEnd: vi.fn(),
      onNextTopic: vi.fn(), onPrevTopic: vi.fn(), onDismiss: vi.fn(), onSwipeUp: vi.fn(), onDrag: vi.fn(), onDragCancel: vi.fn(),
    };
    const { result } = renderHook(() => useStoryGestures(handlers));
    return { element, handlers, bind: result.current };
  }

  const pointer = (type: string, x: number, y: number, pointerId = 1) =>
    ({ type, clientX: x, clientY: y, pointerId, isPrimary: pointerId === 1, currentTarget: undefined }) as unknown as PointerEvent;

  it("mantener presionado más de 180 ms pausa y al soltar sigue, sin contar como toque", () => {
    const { element, handlers, bind } = setup();
    act(() => bind.onPointerDown({ ...pointer("pointerdown", 300, 300), currentTarget: element } as never));
    act(() => vi.advanceTimersByTime(HOLD_MS + 10));
    expect(handlers.onHoldStart).toHaveBeenCalledTimes(1);
    act(() => bind.onPointerUp({ ...pointer("pointerup", 300, 300), currentTarget: element } as never));
    expect(handlers.onHoldEnd).toHaveBeenCalledTimes(1);
    expect(handlers.onTapRight).not.toHaveBeenCalled();
  });

  it("un segundo dedo a mitad del arrastre se ignora", () => {
    const { element, handlers, bind } = setup();
    act(() => bind.onPointerDown({ ...pointer("pointerdown", 200, 200), currentTarget: element } as never));
    act(() => bind.onPointerMove({ ...pointer("pointermove", 200, 260), currentTarget: element } as never));
    act(() => bind.onPointerDown({ ...pointer("pointerdown", 50, 50, 2), currentTarget: element } as never));
    act(() => bind.onPointerMove({ ...pointer("pointermove", 50, 600, 2), currentTarget: element } as never));
    expect(handlers.onDrag).toHaveBeenLastCalledWith(0, 60);
    act(() => bind.onPointerUp({ ...pointer("pointerup", 200, 400), currentTarget: element } as never));
    expect(handlers.onDismiss).toHaveBeenCalledTimes(1);
  });

  it("un toque rápido a la izquierda va atrás", () => {
    const { element, handlers, bind } = setup();
    act(() => bind.onPointerDown({ ...pointer("pointerdown", 60, 300), currentTarget: element } as never));
    act(() => vi.advanceTimersByTime(80));
    act(() => bind.onPointerUp({ ...pointer("pointerup", 61, 300), currentTarget: element } as never));
    expect(handlers.onTapLeft).toHaveBeenCalledTimes(1);
  });
});
