import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import Intro from "./Intro";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

const CurrentPath = () => {
  const { pathname } = useLocation();
  return <span data-testid="current-path">{pathname}</span>;
};

const LeaveIntro = () => {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate("/elsewhere")}>
      Leave intro
    </button>
  );
};

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("Intro", () => {
  test("should render", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Intro />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("intro-page")).toBeInTheDocument();
  });
  test("card should render", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Intro />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("intro-card")).toBeInTheDocument();
  });
  test("'Check it out' button should render", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Intro />
      </MemoryRouter>,
    );
    expect(screen.getByText("Check it out")).toBeInTheDocument();
  });
  describe("fadeOutNavigate function", () => {
    test("applies fadeout transitions and navigates", () => {
      vi.useFakeTimers();
      render(
        <MemoryRouter initialEntries={["/"]}>
          <Intro />
          <CurrentPath />
        </MemoryRouter>,
      );
      const button = screen.getByText("Check it out");
      act(() => {
        button.click();
      });
      expect(button.classList).toContain("animate-intro-fadeout");
      expect(screen.getByTestId("intro-card").classList).toContain(
        "animate-card-fadeout",
      );
      expect(screen.getByAltText("background").classList).toContain(
        "animate-intro-fadeout",
      );
      expect(screen.getByTestId("current-path")).toHaveTextContent("/");
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(screen.getByTestId("current-path")).toHaveTextContent("/home");
    });

    test("cancels pending navigation when Intro unmounts", () => {
      vi.useFakeTimers();
      render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<Intro />} />
            <Route path="/elsewhere" element={<div>Elsewhere</div>} />
            <Route path="/home" element={<div>Home route</div>} />
          </Routes>
          <LeaveIntro />
          <CurrentPath />
        </MemoryRouter>,
      );

      act(() => {
        screen.getByText("Check it out").click();
      });
      act(() => {
        screen.getByText("Leave intro").click();
      });
      expect(screen.getByTestId("current-path")).toHaveTextContent(
        "/elsewhere",
      );

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.getByTestId("current-path")).toHaveTextContent(
        "/elsewhere",
      );
      expect(screen.queryByText("Home route")).not.toBeInTheDocument();
    });

    test("restarts the navigation delay on repeated activation", () => {
      vi.useFakeTimers();
      render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<Intro />} />
            <Route path="/home" element={<div>Home route</div>} />
          </Routes>
          <CurrentPath />
        </MemoryRouter>,
      );

      const button = screen.getByText("Check it out");
      act(() => button.click());
      act(() => vi.advanceTimersByTime(150));
      act(() => button.click());

      act(() => vi.advanceTimersByTime(199));
      expect(screen.getByTestId("current-path")).toHaveTextContent("/");
      act(() => vi.advanceTimersByTime(1));
      expect(screen.getByTestId("current-path")).toHaveTextContent("/home");
    });
  });
});
