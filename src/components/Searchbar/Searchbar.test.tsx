import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Searchbar from "./Searchbar";
import * as api from "../../api/requests";
import { useBoundStore } from "../../store/store";

let input: HTMLInputElement;
let mockGetSearchResults: ReturnType<typeof vi.fn>;

vi.mock("../../api/requests", () => ({
  getSearchResults: vi.fn(),
}));

beforeEach(() => {
  mockGetSearchResults = api.getSearchResults as ReturnType<typeof vi.fn>;
  mockGetSearchResults.mockResolvedValue({
    position: 0,
    results: [],
  });
});

afterEach(() => {
  vi.resetAllMocks();
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Searchbar", () => {
  test("should render", async () => {
    render(<Searchbar />);
    const searchbar = screen.getByTestId("searchbar");
    expect(searchbar).toBeInTheDocument();
  });
  test("should have an input field", async () => {
    render(<Searchbar />);
    input = screen.getByTestId("searchinput") as HTMLInputElement;
    expect(input).toHaveAttribute("type", "search");
    expect(input).toBeInTheDocument();
  });
  test("covers input onChange via userEvent", async () => {
    render(<Searchbar />);
    input = screen.getByTestId("searchinput") as HTMLInputElement;

    act(() => {
      fireEvent.change(input, { target: { value: "new value" } });
    });

    expect(input.value).toBe("new value");

    await waitFor(
      () => {
        expect(mockGetSearchResults).toHaveBeenCalledWith(
          "new+value",
          expect.any(AbortSignal),
        );
      },
      { timeout: 2000 },
    );
  });
  test("should not fetch results for empty input", async () => {
    const user = userEvent.setup();
    render(<Searchbar />);
    input = screen.getByTestId("searchinput") as HTMLInputElement;
    input.value = "";
    await user.click(input);
    expect(useBoundStore.getState().search.topQuery).toEqual({
      position: 0,
      results: [],
    });
  });
  test("should not fetch results for whitespace input", async () => {
    const user = userEvent.setup();
    render(<Searchbar />);
    input = screen.getByTestId("searchinput") as HTMLInputElement;
    input.value = "   ";
    await user.click(input);
    expect(useBoundStore.getState().search.topQuery).toEqual({
      position: 0,
      results: [],
    });
  });
  test("should replace whitespace input with +", async () => {
    render(<Searchbar />);
    input = screen.getByTestId("searchinput") as HTMLInputElement;

    act(() => {
      fireEvent.change(input, { target: { value: "user input" } });
    });

    await waitFor(
      () => {
        expect(mockGetSearchResults).toHaveBeenCalledWith(
          "user+input",
          expect.any(AbortSignal),
        );
      },
      { timeout: 2000 },
    );
  });
  test("debounces calls if query changes", async () => {
    render(<Searchbar />);
    input = screen.getByTestId("searchinput") as HTMLInputElement;

    act(() => {
      fireEvent.change(input, { target: { value: "first" } });
    });

    await waitFor(
      () => {
        expect(mockGetSearchResults).toHaveBeenCalledTimes(1);
        expect(mockGetSearchResults).toHaveBeenCalledWith(
          "first",
          expect.any(AbortSignal),
        );
      },
      { timeout: 2000 },
    );
  });
  test("clears timeout on unmount", async () => {
    const { unmount } = render(<Searchbar />);
    unmount();
    expect(mockGetSearchResults).not.toHaveBeenCalled();
  });
});
