import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  UseQueryResult,
} from "@tanstack/react-query";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Suspense } from "react";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  Mock,
  test,
  vi,
} from "vitest";
import Home, { TimelyPlaylists, Widget } from "./Home";
import { samplePlaylist, sampleTrack } from "../../api/samples";
import { PlaylistById, PlaylistOfList } from "../../types/GlobalTypes";
const widgetfallback = "/fallbacks/widget-fallback.webp";
import play from "../../assets/svgs/play-icon.svg";
import pause from "../../assets/svgs/pause-icon.svg";
import { IntersectionObserverMock } from "../../helpers/IntersectionObserverMock";
import { useBoundStore } from "../../store/store";
import {
  mockedWidgetData,
  mockedTimelyData,
  obj,
  mockedSectionData,
  mockedPlaylistSuccessData,
} from "../../mocks/mocks";

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as Mock),
    useQuery: vi.fn(),
  };
});
const mockedUseQuery = vi.mocked(useQuery);
let observerInstance: IntersectionObserverMock | null;
const { setIsPlaying, setQueue } = useBoundStore.getState();
const fadeOutNavigate = vi.fn(() => {});

const CurrentPath = () => {
  const { pathname } = useLocation();
  return <span data-testid="current-path">{pathname}</span>;
};

const LeaveHome = () => {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate("/away")}>
      Leave Home
    </button>
  );
};

beforeAll(async () => {
  await import("../../components/Song/Song");
  await import("../../components/Section/Section");
});

beforeEach(() => {
  vi.useFakeTimers();
  act(() => {
    observerInstance?.trigger(true);
    setIsPlaying(false);
    setQueue({
      id: "",
      name: "",
      image: [],
      songs: [],
    });
    useBoundStore.getState().changeGreeting("");
  });
  globalThis.IntersectionObserver = vi.fn(function (this: unknown, cb) {
    observerInstance = new IntersectionObserverMock(cb);
    return observerInstance;
  });
  mockedUseQuery.mockImplementation((options) => {
    const queryKey = options.queryKey[0];
    switch (queryKey) {
      case "widget":
        return mockedWidgetData as UseQueryResult<PlaylistById>;

      case "timely":
        return mockedTimelyData as UseQueryResult<typeof obj>;

      case "section":
        return mockedSectionData as UseQueryResult<PlaylistOfList[]>;

      default:
        return mockedSectionData as UseQueryResult<PlaylistOfList[]>;
    }
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("Home", () => {
  test("should render", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={["/home"]}>
          <Home />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    vi.runAllTimers();
    const home = screen.queryByTestId("home-page");
    waitFor(() => {
      expect(home).not.toHaveClass("home-fadeout");
      expect(home).toHaveClass("home-fadein");
      expect(home).toBeInTheDocument();
    });
  });
  test("should render widget", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={["/home"]}>
          <Home />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    vi.runAllTimers();
    const widget = screen.getByTestId("widget");
    expect(widget).toBeInTheDocument();
  });
  test("should render timely playlists", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={["/home"]}>
          <Home />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    vi.runAllTimers();
    const timely = screen.getByTestId("timely-playlists");
    expect(timely).toBeInTheDocument();
  });
  test("fades out before navigating from a timely playlist", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={["/home"]}>
          <Routes>
            <Route path="/home" element={<Home />} />
            <Route
              path="/playlists/1223482895"
              element={<div>Playlist destination</div>}
            />
          </Routes>
          <CurrentPath />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    act(() => vi.advanceTimersByTime(150));
    const home = screen.getByTestId("home-page");
    fireEvent.click(screen.getByTestId("today-playlist"));

    expect(home).toHaveClass("home-fadeout");
    expect(home).not.toHaveClass("home-fadein");
    expect(screen.getByTestId("current-path")).toHaveTextContent("/home");
    act(() => vi.advanceTimersByTime(299));
    expect(screen.getByTestId("current-path")).toHaveTextContent("/home");
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByTestId("current-path")).toHaveTextContent(
      "/playlists/1223482895",
    );
    expect(screen.getByText("Playlist destination")).toBeInTheDocument();
  });

  test("clears pending navigation when Home unmounts", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={["/home"]}>
          <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/away" element={<div>Other destination</div>} />
            <Route
              path="/playlists/1223482895"
              element={<div>Playlist destination</div>}
            />
          </Routes>
          <LeaveHome />
          <CurrentPath />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    act(() => vi.advanceTimersByTime(150));
    fireEvent.click(screen.getByTestId("today-playlist"));
    fireEvent.click(screen.getByText("Leave Home"));
    expect(screen.getByTestId("current-path")).toHaveTextContent("/away");

    act(() => vi.advanceTimersByTime(300));

    expect(screen.getByTestId("current-path")).toHaveTextContent("/away");
    expect(screen.queryByText("Playlist destination")).not.toBeInTheDocument();
  });

  test("restarts the navigation delay on a second playlist click", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={["/home"]}>
          <Routes>
            <Route path="/home" element={<Home />} />
            <Route
              path="/playlists/1223482895"
              element={<div>Today destination</div>}
            />
            <Route
              path="/playlists/2252904"
              element={<div>Weekly destination</div>}
            />
          </Routes>
          <CurrentPath />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    act(() => vi.advanceTimersByTime(150));
    fireEvent.click(screen.getByTestId("today-playlist"));
    act(() => vi.advanceTimersByTime(150));
    fireEvent.click(screen.getByTestId("weekly-playlist"));

    act(() => vi.advanceTimersByTime(299));
    expect(screen.getByTestId("current-path")).toHaveTextContent("/home");
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByTestId("current-path")).toHaveTextContent(
      "/playlists/2252904",
    );
    expect(screen.getByText("Weekly destination")).toBeInTheDocument();
  });
  describe("Widget", () => {
    test.each([
      { isLoading: true, error: null },
      { isLoading: false, error: new Error("Widget unavailable") },
    ])(
      "shows the widget fallback for unavailable data",
      async ({ isLoading, error }) => {
        vi.useRealTimers();
        mockedUseQuery.mockReturnValue({
          ...mockedWidgetData,
          data: undefined,
          isLoading,
          error,
        } as UseQueryResult<PlaylistById>);

        render(
          <QueryClientProvider client={new QueryClient()}>
            <MemoryRouter initialEntries={["/home"]}>
              <Suspense fallback={null}>
                <Widget fadeOutNavigate={fadeOutNavigate} />
              </Suspense>
            </MemoryRouter>
          </QueryClientProvider>,
        );

        expect(
          await screen.findByTestId("widget-fallback"),
        ).toBeInTheDocument();
      },
    );
    test("should render", async () => {
      render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={["/home"]}>
            <Widget fadeOutNavigate={fadeOutNavigate} />
          </MemoryRouter>
        </QueryClientProvider>,
      );
      vi.runAllTimers();
      const timely = screen.getByTestId("widget");
      expect(timely).toBeInTheDocument();
    });
    describe("image", () => {
      test("should render", async () => {
        render(
          <QueryClientProvider client={new QueryClient()}>
            <MemoryRouter initialEntries={["/home"]}>
              <Widget fadeOutNavigate={fadeOutNavigate} />
            </MemoryRouter>
          </QueryClientProvider>,
        );
        vi.runAllTimers();
        const image = screen.getByTestId("widget-image");
        expect(image).toBeInTheDocument();
      });
      test("should play playlist onClick", async () => {
        render(
          <QueryClientProvider client={new QueryClient()}>
            <MemoryRouter initialEntries={["/home"]}>
              <Widget fadeOutNavigate={fadeOutNavigate} />
            </MemoryRouter>
          </QueryClientProvider>,
        );
        vi.runAllTimers();
        const image = screen.getByTestId("widget-image");
        fireEvent.click(image);
        expect(fadeOutNavigate).toHaveBeenCalledWith("/playlists/ae5fa1Ax");
      });
      test("should play playlist onClick", async () => {
        render(
          <QueryClientProvider client={new QueryClient()}>
            <MemoryRouter initialEntries={["/home"]}>
              <Widget fadeOutNavigate={fadeOutNavigate} />
            </MemoryRouter>
          </QueryClientProvider>,
        );
        vi.runAllTimers();
        const widget = screen.getByTestId("widget");
        const image = screen.getByTestId("widget-image");

        expect(widget).toHaveClass("song-fadeout");
        expect(image).toHaveClass("widget-banner-fadeout");

        fireEvent.load(image);
        act(() => vi.advanceTimersByTime(150));

        expect(widget).toHaveClass("song-fadein");
        expect(image).toHaveClass("widget-banner-fadein");
      });
      test("should contain widgetfallback as image onError", async () => {
        render(
          <QueryClientProvider client={new QueryClient()}>
            <MemoryRouter initialEntries={["/home"]}>
              <Widget fadeOutNavigate={fadeOutNavigate} />
            </MemoryRouter>
          </QueryClientProvider>,
        );
        vi.runAllTimers();
        const image = screen.getByTestId("widget-image");
        fireEvent.error(image);
        expect((image as HTMLImageElement).src).toContain(widgetfallback);
      });
    });
    describe("play button", () => {
      test("should have tabIndex as 0 on having data", async () => {
        render(
          <QueryClientProvider client={new QueryClient()}>
            <MemoryRouter initialEntries={["/home"]}>
              <Widget fadeOutNavigate={fadeOutNavigate} />
            </MemoryRouter>
          </QueryClientProvider>,
        );
        vi.runAllTimers();
        const widgetBtn = screen.getByTestId("widget-btn");
        expect(widgetBtn.tabIndex).toBe(0);
      });
      test("should set playlist as queue & playback onClick", () => {
        const obj = {
          id: "ae5fa1Ax",
          name: "Playlist 13",
          image: [
            {
              quality: "50x50",
              url: "image url",
            },
          ],
          songs: [sampleTrack],
        };
        render(
          <QueryClientProvider client={new QueryClient()}>
            <MemoryRouter initialEntries={["/home"]}>
              <Widget fadeOutNavigate={fadeOutNavigate} />
            </MemoryRouter>
          </QueryClientProvider>,
        );
        vi.runAllTimers();
        const widgetBtn = screen.getByTestId("widget-btn");
        act(() => {
          fireEvent.click(widgetBtn);
        });
        waitFor(() => {
          expect(useBoundStore.getState().nowPlaying.queue).toEqual(obj);
          expect(useBoundStore.getState().nowPlaying.track).toEqual(
            sampleTrack,
          );
          expect(useBoundStore.getState().nowPlaying.isPlaying).toBe(true);
        });
      });
      test("should toggle playlist playback onClick if already set", async () => {
        act(() => {
          setIsPlaying(true);
        });
        render(
          <QueryClientProvider client={new QueryClient()}>
            <MemoryRouter initialEntries={["/home"]}>
              <Widget fadeOutNavigate={fadeOutNavigate} />
            </MemoryRouter>
          </QueryClientProvider>,
        );
        vi.runAllTimers();
        const widgetBtn = screen.getByTestId("widget-btn");
        act(() => {
          fireEvent.click(widgetBtn);
        });
        expect(useBoundStore.getState().nowPlaying.isPlaying).toBe(false);
      });
      test("should set playlist as queue & playback onClick", () => {
        const obj = {
          id: "",
          name: "",
          image: [],
          songs: [],
        };
        render(
          <QueryClientProvider client={new QueryClient()}>
            <MemoryRouter initialEntries={["/home"]}>
              <Widget fadeOutNavigate={fadeOutNavigate} />
            </MemoryRouter>
          </QueryClientProvider>,
        );
        vi.runAllTimers();
        const widgetBtn = screen.getByTestId("widget-btn");
        act(() => {
          fireEvent.click(widgetBtn);
        });
        waitFor(() => {
          expect(useBoundStore.getState().nowPlaying.queue).toEqual(obj);
          expect(useBoundStore.getState().nowPlaying.track).toEqual(
            sampleTrack,
          );
          expect(useBoundStore.getState().nowPlaying.isPlaying).toBe(true);
        });
      });
      test("should have icon as play if isPlaying is false", async () => {
        render(
          <QueryClientProvider client={new QueryClient()}>
            <MemoryRouter initialEntries={["/home"]}>
              <Widget fadeOutNavigate={fadeOutNavigate} />
            </MemoryRouter>
          </QueryClientProvider>,
        );
        vi.runAllTimers();
        const image = screen.getByAltText("play");
        expect((image as HTMLImageElement).src).toContain(play);
      });
      test("should have icon as pause if isPlaying is true", async () => {
        mockedUseQuery.mockReturnValue({
          ...mockedPlaylistSuccessData,
          data: { ...samplePlaylist, image: [] },
        } as UseQueryResult<PlaylistById>);
        act(() => {
          setIsPlaying(true);
          setQueue({
            id: "ae5fa1Ax",
            name: "Playlist 13",
            image: [
              {
                quality: "50x50",
                url: "image url",
              },
            ],
            songs: [sampleTrack],
          });
        });
        render(
          <QueryClientProvider client={new QueryClient()}>
            <MemoryRouter initialEntries={["/home"]}>
              <Widget fadeOutNavigate={fadeOutNavigate} />
            </MemoryRouter>
          </QueryClientProvider>,
        );
        vi.runAllTimers();
        const image = screen.getByAltText("pause");
        expect((image as HTMLImageElement).src).toContain(pause);
      });
    });
  });
  describe("TimelyPlaylists", () => {
    test("should render", async () => {
      render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={["/home"]}>
            <TimelyPlaylists fadeOutNavigate={fadeOutNavigate} />
          </MemoryRouter>
        </QueryClientProvider>,
      );
      vi.runAllTimers();
      const timely = screen.getByTestId("timely-playlists");
      expect(timely).toBeInTheDocument();
    });
    describe("Today playlist", () => {
      test("should navigate to playlist onClick", async () => {
        render(
          <QueryClientProvider client={new QueryClient()}>
            <MemoryRouter initialEntries={["/home"]}>
              <TimelyPlaylists fadeOutNavigate={fadeOutNavigate} />
            </MemoryRouter>
          </QueryClientProvider>,
        );
        vi.runAllTimers();
        const timely = screen.getByTestId("today-playlist");
        act(() => {
          fireEvent.click(timely);
        });
        expect(fadeOutNavigate).toHaveBeenCalledWith("/playlists/ae5fa1Ax");
      });
      describe("should have image", () => {
        test("call handleImageLoad onLoad", async () => {
          render(
            <QueryClientProvider client={new QueryClient()}>
              <MemoryRouter initialEntries={["/home"]}>
                <TimelyPlaylists fadeOutNavigate={fadeOutNavigate} />
              </MemoryRouter>
            </QueryClientProvider>,
          );
          vi.runAllTimers();
          const today = screen.getByTestId("today-playlist-image");
          fireEvent.load(today);
          expect(screen.getByTestId("timely-playlists")).toHaveClass(
            "song-fadeout",
          );
        });
        test("of the playlist if avalable", async () => {
          render(
            <QueryClientProvider client={new QueryClient()}>
              <MemoryRouter initialEntries={["/home"]}>
                <TimelyPlaylists fadeOutNavigate={fadeOutNavigate} />
              </MemoryRouter>
            </QueryClientProvider>,
          );
          vi.runAllTimers();
          const today = screen.getByTestId("today-playlist-image");
          expect((today as HTMLImageElement).src).toContain(
            "data:image/svg+xml",
          );
        });
        test("as fallbacktoday if not available", async () => {
          render(
            <QueryClientProvider client={new QueryClient()}>
              <MemoryRouter initialEntries={["/home"]}>
                <TimelyPlaylists fadeOutNavigate={fadeOutNavigate} />
              </MemoryRouter>
            </QueryClientProvider>,
          );
          vi.runAllTimers();
          const today = screen.getByTestId("today-playlist-image");
          expect((today as HTMLImageElement).src).toContain(
            "data:image/svg+xml",
          );
        });
        test("as fallbackyearly onError", async () => {
          render(
            <QueryClientProvider client={new QueryClient()}>
              <MemoryRouter initialEntries={["/home"]}>
                <TimelyPlaylists fadeOutNavigate={fadeOutNavigate} />
              </MemoryRouter>
            </QueryClientProvider>,
          );
          vi.runAllTimers();
          const today = screen.getByTestId("today-playlist-image");
          fireEvent.error(today);
          expect((today as HTMLImageElement).src).toContain(
            "data:image/svg+xml",
          );
        });
      });
    });
    describe("Weekly playlist", () => {
      test("should navigate to playlist onClick", async () => {
        render(
          <QueryClientProvider client={new QueryClient()}>
            <MemoryRouter initialEntries={["/home"]}>
              <TimelyPlaylists fadeOutNavigate={fadeOutNavigate} />
            </MemoryRouter>
          </QueryClientProvider>,
        );
        vi.runAllTimers();
        const timely = screen.getByTestId("weekly-playlist");
        act(() => {
          fireEvent.click(timely);
        });
        expect(fadeOutNavigate).toHaveBeenCalledWith("/playlists/ae5fa1Ax");
      });
      describe("should have image", () => {
        test("call handleImageLoad onLoad", async () => {
          render(
            <QueryClientProvider client={new QueryClient()}>
              <MemoryRouter initialEntries={["/home"]}>
                <TimelyPlaylists fadeOutNavigate={fadeOutNavigate} />
              </MemoryRouter>
            </QueryClientProvider>,
          );
          vi.runAllTimers();
          const weekly = screen.getByTestId("weekly-playlist-image");
          fireEvent.load(weekly);
          expect(screen.getByTestId("timely-playlists")).toHaveClass(
            "song-fadeout",
          );
        });
        test("of the playlist if avalable", async () => {
          render(
            <QueryClientProvider client={new QueryClient()}>
              <MemoryRouter initialEntries={["/home"]}>
                <TimelyPlaylists fadeOutNavigate={fadeOutNavigate} />
              </MemoryRouter>
            </QueryClientProvider>,
          );
          vi.runAllTimers();
          const weekly = screen.getByTestId("weekly-playlist-image");
          expect((weekly as HTMLImageElement).src).toContain(
            "data:image/svg+xml",
          );
        });
        test("as fallbackweekly if not available", async () => {
          render(
            <QueryClientProvider client={new QueryClient()}>
              <MemoryRouter initialEntries={["/home"]}>
                <TimelyPlaylists fadeOutNavigate={fadeOutNavigate} />
              </MemoryRouter>
            </QueryClientProvider>,
          );
          vi.runAllTimers();
          const weekly = screen.getByTestId("weekly-playlist-image");
          expect((weekly as HTMLImageElement).src).toContain(
            "data:image/svg+xml",
          );
        });
        test("as fallbackweekly onError", async () => {
          render(
            <QueryClientProvider client={new QueryClient()}>
              <MemoryRouter initialEntries={["/home"]}>
                <TimelyPlaylists fadeOutNavigate={fadeOutNavigate} />
              </MemoryRouter>
            </QueryClientProvider>,
          );
          vi.runAllTimers();
          const weekly = screen.getByTestId("weekly-playlist-image");
          fireEvent.error(weekly);
          expect((weekly as HTMLImageElement).src).toContain(
            "data:image/svg+xml",
          );
        });
      });
    });
    describe("Monthly playlist", () => {
      test("should navigate to playlist onClick", async () => {
        render(
          <QueryClientProvider client={new QueryClient()}>
            <MemoryRouter initialEntries={["/home"]}>
              <TimelyPlaylists fadeOutNavigate={fadeOutNavigate} />
            </MemoryRouter>
          </QueryClientProvider>,
        );
        vi.runAllTimers();
        const timely = screen.getByTestId("monthly-playlist");
        act(() => {
          fireEvent.click(timely);
        });
        expect(fadeOutNavigate).toHaveBeenCalledWith("/playlists/ae5fa1Ax");
      });
      describe("should have image", () => {
        test("call handleImageLoad onLoad", async () => {
          render(
            <QueryClientProvider client={new QueryClient()}>
              <MemoryRouter initialEntries={["/home"]}>
                <TimelyPlaylists fadeOutNavigate={fadeOutNavigate} />
              </MemoryRouter>
            </QueryClientProvider>,
          );
          vi.runAllTimers();
          const monthly = screen.getByTestId("monthly-playlist-image");
          fireEvent.load(monthly);
          expect(screen.getByTestId("timely-playlists")).toHaveClass(
            "song-fadeout",
          );
        });
        test("of the playlist if avalable", async () => {
          render(
            <QueryClientProvider client={new QueryClient()}>
              <MemoryRouter initialEntries={["/home"]}>
                <TimelyPlaylists fadeOutNavigate={fadeOutNavigate} />
              </MemoryRouter>
            </QueryClientProvider>,
          );
          vi.runAllTimers();
          const monthly = screen.getByTestId("monthly-playlist-image");
          expect((monthly as HTMLImageElement).src).toContain(
            "data:image/svg+xml",
          );
        });
        test("as fallbackmonthly if not available", async () => {
          render(
            <QueryClientProvider client={new QueryClient()}>
              <MemoryRouter initialEntries={["/home"]}>
                <TimelyPlaylists fadeOutNavigate={fadeOutNavigate} />
              </MemoryRouter>
            </QueryClientProvider>,
          );
          vi.runAllTimers();
          const monthly = screen.getByTestId("monthly-playlist-image");
          expect((monthly as HTMLImageElement).src).toContain(
            "data:image/svg+xml",
          );
        });
        test("as fallbackmonthly onError", async () => {
          render(
            <QueryClientProvider client={new QueryClient()}>
              <MemoryRouter initialEntries={["/home"]}>
                <TimelyPlaylists fadeOutNavigate={fadeOutNavigate} />
              </MemoryRouter>
            </QueryClientProvider>,
          );
          vi.runAllTimers();
          const monthly = screen.getByTestId("monthly-playlist-image");
          fireEvent.error(monthly);
          expect((monthly as HTMLImageElement).src).toContain(
            "data:image/svg+xml",
          );
        });
      });
    });
    describe("Yearly playlist", () => {
      test("should navigate to playlist onClick", async () => {
        render(
          <QueryClientProvider client={new QueryClient()}>
            <MemoryRouter initialEntries={["/home"]}>
              <TimelyPlaylists fadeOutNavigate={fadeOutNavigate} />
            </MemoryRouter>
          </QueryClientProvider>,
        );
        vi.runAllTimers();
        const timely = screen.getByTestId("yearly-playlist");
        act(() => {
          fireEvent.click(timely);
        });
        expect(fadeOutNavigate).toHaveBeenCalledWith("/playlists/ae5fa1Ax");
      });
      describe("should have image", () => {
        test("call handleImageLoad onLoad", async () => {
          render(
            <QueryClientProvider client={new QueryClient()}>
              <MemoryRouter initialEntries={["/home"]}>
                <TimelyPlaylists fadeOutNavigate={fadeOutNavigate} />
              </MemoryRouter>
            </QueryClientProvider>,
          );
          vi.runAllTimers();
          const yearly = screen.getByTestId("yearly-playlist-image");
          fireEvent.load(yearly);
          expect(screen.getByTestId("timely-playlists")).toHaveClass(
            "song-fadeout",
          );
        });
        test("of the playlist if avalable", async () => {
          render(
            <QueryClientProvider client={new QueryClient()}>
              <MemoryRouter initialEntries={["/home"]}>
                <TimelyPlaylists fadeOutNavigate={fadeOutNavigate} />
              </MemoryRouter>
            </QueryClientProvider>,
          );
          vi.runAllTimers();
          const yearly = screen.getByTestId("yearly-playlist-image");
          expect((yearly as HTMLImageElement).src).toContain(
            "data:image/svg+xml",
          );
        });
        test("as fallbackyearly if not available", async () => {
          render(
            <QueryClientProvider client={new QueryClient()}>
              <MemoryRouter initialEntries={["/home"]}>
                <TimelyPlaylists fadeOutNavigate={fadeOutNavigate} />
              </MemoryRouter>
            </QueryClientProvider>,
          );
          vi.runAllTimers();
          const yearly = screen.getByTestId("yearly-playlist-image");
          expect((yearly as HTMLImageElement).src).toContain(
            "data:image/svg+xml",
          );
        });
        test("as fallbackyearly onError", async () => {
          render(
            <QueryClientProvider client={new QueryClient()}>
              <MemoryRouter initialEntries={["/home"]}>
                <TimelyPlaylists fadeOutNavigate={fadeOutNavigate} />
              </MemoryRouter>
            </QueryClientProvider>,
          );
          vi.runAllTimers();
          const yearly = screen.getByTestId("yearly-playlist-image");
          fireEvent.error(yearly);
          expect((yearly as HTMLImageElement).src).toContain(
            "data:image/svg+xml",
          );
        });
      });
    });
  });
});
