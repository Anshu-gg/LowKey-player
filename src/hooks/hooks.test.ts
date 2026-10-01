import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useResponsiveLayout } from "./useResponsiveLayout";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useResponsiveLayout hook", () => {
  beforeEach(() => {
    globalThis.innerWidth = 1024;
  });

  test("initially sets isMobile correctly", () => {
    globalThis.innerWidth = 400;
    const { result } = renderHook(() => useResponsiveLayout());
    expect(result.current).toBe(true);

    globalThis.innerWidth = 800;
    waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  test("updates isMobile state on globalThis resize", async () => {
    const { result } = renderHook(() => useResponsiveLayout());

    act(() => {
      globalThis.innerWidth = 500;
      globalThis.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe(true);

    act(() => {
      globalThis.innerWidth = 800;
      globalThis.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe(false);
  });
});
