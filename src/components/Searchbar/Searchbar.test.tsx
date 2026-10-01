import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Searchbar from "./Searchbar";
import * as api from "../../api/requests";
import { useBoundStore } from "../../store/store";
import { defaultSearchData } from "../../utils/utils";
import { sampleSearchResults } from "../../api/samples";

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
  useBoundStore.getState().setSearch(defaultSearchData);
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
    render(<Searchbar />);
    input = screen.getByTestId("searchinput") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "" } });
    expect(mockGetSearchResults).not.toHaveBeenCalled();
    expect(useBoundStore.getState().search).toEqual(defaultSearchData);
  });
  test("should not fetch results for whitespace input", async () => {
    useBoundStore.getState().setSearch(sampleSearchResults);
    render(<Searchbar />);
    input = screen.getByTestId("searchinput") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "   " } });
    await waitFor(() => {
      expect(input).toHaveValue("");
      expect(useBoundStore.getState().search).toEqual(defaultSearchData);
    });
    expect(mockGetSearchResults).not.toHaveBeenCalled();
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
  test("runs the request after the debounce delay", async () => {
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

  test("stores successful search results", async () => {
    mockGetSearchResults.mockResolvedValue(sampleSearchResults);
    render(<Searchbar />);
    input = screen.getByTestId("searchinput") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "artist" } });

    await waitFor(() => {
      expect(mockGetSearchResults).toHaveBeenCalledWith(
        "artist",
        expect.any(AbortSignal),
      );
      expect(useBoundStore.getState().search).toEqual(sampleSearchResults);
    });
  });

  test("resets search results when the request returns null", async () => {
    mockGetSearchResults.mockResolvedValue(null);
    useBoundStore.getState().setSearch(sampleSearchResults);
    render(<Searchbar />);
    input = screen.getByTestId("searchinput") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "missing" } });

    await waitFor(() => {
      expect(mockGetSearchResults).toHaveBeenCalled();
      expect(useBoundStore.getState().search).toEqual(defaultSearchData);
    });
  });

  test("resets search results and logs non-abort request errors", async () => {
    const error = new Error("search failed");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetSearchResults.mockRejectedValue(error);
    useBoundStore.getState().setSearch(sampleSearchResults);
    render(<Searchbar />);
    input = screen.getByTestId("searchinput") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "failure" } });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(error);
      expect(useBoundStore.getState().search).toEqual(defaultSearchData);
    });
  });

  test("aborts an in-flight search when unmounted", async () => {
    mockGetSearchResults.mockImplementation(() => new Promise(() => {}));
    const { unmount } = render(<Searchbar />);
    input = screen.getByTestId("searchinput") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "pending" } });
    await waitFor(() => expect(mockGetSearchResults).toHaveBeenCalled());
    const signal = mockGetSearchResults.mock.calls[0][1] as AbortSignal;
    expect(signal.aborted).toBe(false);

    unmount();

    expect(signal.aborted).toBe(true);
  });

  test("aborts the previous request before starting a newer search", async () => {
    mockGetSearchResults.mockImplementation(() => new Promise(() => {}));
    render(<Searchbar />);
    input = screen.getByTestId("searchinput") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "first query" } });
    await waitFor(() => expect(mockGetSearchResults).toHaveBeenCalledTimes(1));
    const firstSignal = mockGetSearchResults.mock.calls[0][1] as AbortSignal;

    fireEvent.change(input, { target: { value: "second query" } });
    await waitFor(() => expect(mockGetSearchResults).toHaveBeenCalledTimes(2));

    const secondSignal = mockGetSearchResults.mock.calls[1][1] as AbortSignal;
    expect(firstSignal.aborted).toBe(true);
    expect(secondSignal).not.toBe(firstSignal);
  });

  test("does not log expected AbortError failures", async () => {
    const abortError = Object.assign(new Error("aborted"), {
      name: "AbortError",
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetSearchResults.mockRejectedValue(abortError);
    render(<Searchbar />);
    input = screen.getByTestId("searchinput") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "aborted" } });
    await waitFor(() => expect(mockGetSearchResults).toHaveBeenCalled());

    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
