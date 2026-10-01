import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import ErrorFallback from "./ErrorFallback";

afterEach(() => {
  cleanup();
});

describe("ErrorFallback", () => {
  test("should render", async () => {
    render(<ErrorFallback message="Unexpected error" />);
    expect(await screen.findByTestId("error-fallback")).toBeInTheDocument();
  });
  test("reload button reloads the page", async () => {
    const reloadMock = vi.fn();

    Object.defineProperty(window, "location", {
      value: { reload: reloadMock },
      writable: true,
    });

    render(<ErrorFallback message="Unexpected error!" />);

    fireEvent.click(screen.getByRole("button", { name: /reload/i }));
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});
