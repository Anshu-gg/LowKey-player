import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Banner from "./Banner";
import { useBoundStore } from "../../store/store";
import { MemoryRouter } from "react-router-dom";

afterEach(() => {
  act(() => {
    useBoundStore.setState({
      greeting: "",
      notifications: false,
      recents: { activity: [], history: [] },
    });
  });
  cleanup();
  vi.useRealTimers();
});

beforeEach(() => {
  useBoundStore.getState().changeGreeting("");
});

describe("Banner", () => {
  test("should render", async () => {
    render(
      <MemoryRouter>
        <Banner />
      </MemoryRouter>,
    );
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByTestId("notifs")).toBeInTheDocument();
  });
  describe("greeting", () => {
    test.each([
      [5, "Jump back in"],
      [6, "Good morning"],
      [12, "Good morning"],
      [13, "Good afternoon"],
      [15, "Good afternoon"],
      [16, "Good evening"],
      [18, "Good evening"],
      [19, "Good night"],
      [23, "Good night"],
    ])("shows the greeting for hour %i", (hour, expectedGreeting) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 0, 1, hour));

      render(
        <MemoryRouter>
          <Banner />
        </MemoryRouter>,
      );

      expect(screen.getByText(expectedGreeting)).toBeInTheDocument();
      expect(useBoundStore.getState().greeting).toBe(expectedGreeting);
    });
  });
  describe("NotificationButton", () => {
    test("should render", async () => {
      render(
        <MemoryRouter>
          <Banner />
        </MemoryRouter>,
      );
      expect(screen.getByTestId("notifs")).toBeInTheDocument();
    });
    test("toggles notifications on button click", async () => {
      render(
        <MemoryRouter>
          <Banner />
        </MemoryRouter>,
      );
      const button = screen
        .getByTestId("notifs")
        .querySelector("button") as HTMLButtonElement;
      const notifs = useBoundStore.getState().notifications;
      expect(button).toBeInTheDocument();
      expect(notifs).toBe(false);
      act(() => {
        fireEvent.click(button);
      });
      expect(useBoundStore.getState().notifications).toBe(true);
      act(() => {
        fireEvent.click(button);
      });
      expect(useBoundStore.getState().notifications).toBe(false);
    });
    test("should contain activity list", async () => {
      render(
        <MemoryRouter>
          <Banner />
        </MemoryRouter>,
      );
      expect(screen.getByRole("list")).toBeInTheDocument();
      expect(useBoundStore.getState().recents.activity.length).toBe(0);
    });
    test("activity list should be hidden when no notifications", async () => {
      render(
        <MemoryRouter>
          <Banner />
        </MemoryRouter>,
      );
      expect(screen.getByRole("list")).toHaveClass("hidden");
    });
    test("activity list should be hidden on mouseLeave", async () => {
      render(
        <MemoryRouter>
          <Banner />
        </MemoryRouter>,
      );
      expect(screen.getByRole("list")).toHaveClass("hidden");

      fireEvent.click(screen.getByTestId("notifs").querySelector("button")!);
      expect(screen.getByRole("list")).toHaveClass("absolute");

      fireEvent.mouseLeave(screen.getByRole("list"));
      expect(screen.getByRole("list")).toHaveClass("hidden");
    });
    test("activity list should be visible when notifications are on", async () => {
      render(
        <MemoryRouter>
          <Banner />
        </MemoryRouter>,
      );
      const button = screen.getByTestId("notifs").querySelector("button");
      expect(screen.getByRole("list")).toHaveClass("hidden");

      if (button) {
        fireEvent.click(button);
        expect(useBoundStore.getState().notifications).toBe(true);
        expect(screen.getByRole("list")).not.toHaveClass("hidden");
      }
    });
    test("activity list should render activities", async () => {
      render(
        <MemoryRouter>
          <Banner />
        </MemoryRouter>,
      );
      const recents = useBoundStore.getState().recents;
      const setActivity = useBoundStore.getState().setActivity;
      expect(recents.activity.length).toBe(0);

      act(() => {
        setActivity("Test activity 1");
      });
      act(() => {
        setActivity("Test activity 2");
      });
      act(() => {
        setActivity("Test activity 3");
      });

      await waitFor(() => {
        expect(
          useBoundStore.getState().recents.activity.length,
        ).toBeGreaterThan(0);
        expect(screen.getAllByRole("list").length).toBeGreaterThan(0);
      });
    });
  });
});
