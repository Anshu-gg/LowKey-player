import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  Mock,
  test,
  vi,
} from "vitest";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  UseQueryResult,
} from "@tanstack/react-query";
import { MemoryRouter, useLocation, useParams } from "react-router-dom";
import { AlbumById, ArtistType, TrackDetails } from "../../types/GlobalTypes";
import { sampleAlbum, sampleArtist, sampleTrack } from "../../api/samples";
import { clearRequestCache } from "../../api/requests";
const artistfallback = "/fallbacks/artist-fallback.png";
const albumfallback = "/fallbacks/playlist-fallback.webp";
import ArtistPage, {
  ArtistAlbums,
  ArtistInfo,
  ArtistSongs,
} from "./ArtistPage";
import {
  getArtistAlbums,
  getArtistDetails,
  getArtistSongs,
} from "../../api/requests";
import {
  mockedArtistData,
  mockedArtistAlbumData,
  mockedArtistSongData,
  mockedDataProps,
} from "../../mocks/mocks";
import { Suspense } from "react";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as Mock),
    useParams: vi.fn(),
  };
});
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as Mock),
    useQuery: vi.fn(),
  };
});
const id = "652969";
const mockedUseQuery = vi.mocked(useQuery);
const mockedUseParams = vi.mocked(useParams);

beforeEach(() => {
  globalThis.fetch = vi.fn();
  mockedUseParams.mockReturnValue({ id: id });
  mockedUseQuery.mockImplementation((options) => {
    const queryKey = options.queryKey[0];

    switch (queryKey) {
      case "artistdetails":
        return mockedArtistData as unknown as UseQueryResult<ArtistType>;

      case "artistalbums":
        return mockedArtistAlbumData as UseQueryResult<AlbumById[]>;

      case "artistsongs":
        return mockedArtistSongData as UseQueryResult<TrackDetails[]>;

      default:
        return {
          promise: Promise.resolve([sampleAlbum] as AlbumById[]),
          refetch: vi.fn(),
          data: [sampleAlbum],
          ...mockedDataProps,
        } as UseQueryResult<AlbumById[]>;
    }
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("ArtistPage", () => {
  test("renders the page shell without an artist id", () => {
    mockedUseParams.mockReturnValue({});

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={["/artists"]}>
          <ArtistPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByTestId("artist-page")).toBeInTheDocument();
    expect(screen.queryByTestId("artist-info")).not.toBeInTheDocument();
    expect(screen.queryByTestId("artist-albums")).not.toBeInTheDocument();
    expect(screen.queryByTestId("artist-songs")).not.toBeInTheDocument();
  });

  test("should render", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={[`/artists/${id}`]}>
          <ArtistPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const artistPage = await screen.findByTestId("artist-page");
    expect(artistPage).toBeInTheDocument();
    await waitFor(() => {
      expect(artistPage).toHaveClass("home-fadein");
      expect(artistPage).not.toHaveClass("home-fadeout");
    });
  });
  describe("ArtistInfo", () => {
    test("should render", async () => {
      render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={[`/artists/${id}`]}>
            <Suspense>
              <ArtistInfo id={id} />
            </Suspense>
          </MemoryRouter>
        </QueryClientProvider>,
      );
      expect(await screen.findByTestId("artist-info")).toBeInTheDocument();
    });
    test("getArtistDetails should call url and return response", async () => {
      const mockApiResponse = { data: sampleArtist };

      (fetch as Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await getArtistDetails(id);

      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:3000/api/artists/${id}`,
        undefined,
      );
      expect(result).toEqual(sampleArtist);
    });
    describe("artist image", () => {
      test("should render", () => {
        vi.useFakeTimers();
        render(
          <QueryClientProvider client={new QueryClient()}>
            <MemoryRouter initialEntries={[`/artists/${id}`]}>
              <ArtistInfo id={id} />
            </MemoryRouter>
          </QueryClientProvider>,
        );
        expect(screen.getByAltText("Artist name")).toHaveClass("image-fadeout");
        fireEvent.load(screen.getByAltText("Artist name"));
        act(() => vi.advanceTimersByTime(150));
        expect(screen.getByAltText("Artist name")).toHaveClass("image-fadein");
      });
      test("should be artistfallback onError", () => {
        render(
          <QueryClientProvider client={new QueryClient()}>
            <MemoryRouter initialEntries={[`/artists/${id}`]}>
              <ArtistInfo id={id} />
            </MemoryRouter>
          </QueryClientProvider>,
        );
        const image = screen.getByAltText("Artist name");
        fireEvent.error(image);
        expect((image as HTMLImageElement).src).toContain(artistfallback);
      });
      describe("getArtistImage", () => {
        test("should return the image url if found", () => {
          render(
            <QueryClientProvider client={new QueryClient()}>
              <MemoryRouter initialEntries={[`/artists/${id}`]}>
                <ArtistInfo id={id} />
              </MemoryRouter>
            </QueryClientProvider>,
          );
          const image = screen.getByAltText("Artist name");
          fireEvent.load(image);
          expect(image).toBeInTheDocument();
          expect(sampleArtist.image).toBeDefined();
          expect((image as HTMLImageElement).src).toContain("artist-image-url");
        });
        test("should return artistfallback if image is not found", () => {
          mockedUseQuery.mockReturnValue({
            ...mockedArtistData,
            data: { ...sampleArtist, image: [] },
          } as unknown as UseQueryResult<ArtistType>);
          render(
            <QueryClientProvider client={new QueryClient()}>
              <MemoryRouter initialEntries={[`/artists/${id}`]}>
                <ArtistInfo id={id} />
              </MemoryRouter>
            </QueryClientProvider>,
          );
          const image = screen.getByAltText("Artist name");
          fireEvent.load(image);
          expect((image as HTMLImageElement).src).toContain(artistfallback);
        });
      });
      test("handleImageLoad should toggle fadein classes", async () => {
        render(
          <QueryClientProvider client={new QueryClient()}>
            <MemoryRouter initialEntries={[`/artists/${id}`]}>
              <Suspense>
                <ArtistInfo id={id} />
              </Suspense>
            </MemoryRouter>
          </QueryClientProvider>,
        );
        const artistInfo = await screen.findByTestId("artist-info");
        const artistImage = await screen.findByAltText("Artist name");
        const artistTitle = await screen.findByTestId("artist-title");

        expect(artistInfo).toHaveClass("home-fadeout");
        expect(artistImage).toHaveClass("image-fadeout");
        expect(artistTitle).toHaveClass("song-fadeout");
        expect(artistInfo).not.toHaveClass("home-fadein");
        expect(artistImage).not.toHaveClass("image-fadein");
        expect(artistTitle).not.toHaveClass("song-fadein");

        fireEvent.load(artistImage);

        await waitFor(() => {
          expect(artistInfo).toHaveClass("home-fadein");
          expect(artistImage).toHaveClass("image-fadein");
          expect(artistTitle).toHaveClass("song-fadein");
          expect(artistInfo).not.toHaveClass("home-fadeout");
          expect(artistImage).not.toHaveClass("image-fadeout");
          expect(artistTitle).not.toHaveClass("song-fadeout");
        });
      });

      test("renders follower counts and available social links", () => {
        mockedUseQuery.mockReturnValue({
          ...mockedArtistData,
          data: {
            ...sampleArtist,
            followerCount: "1234",
            fanCount: "5678",
            fb: "https://example.com/facebook",
            twitter: "https://example.com/twitter",
            wiki: "https://example.com/wiki",
          },
        } as unknown as UseQueryResult<ArtistType>);

        render(
          <QueryClientProvider client={new QueryClient()}>
            <MemoryRouter initialEntries={[`/artists/${id}`]}>
              <ArtistInfo id={id} />
            </MemoryRouter>
          </QueryClientProvider>,
        );

        expect(screen.getByTestId("artist-followers")).toHaveTextContent(
          "1,234",
        );
        expect(screen.getByTestId("artist-fans")).toHaveTextContent("5,678");
        expect(screen.getByAltText("meta").closest("a")).toHaveAttribute(
          "href",
          "https://example.com/facebook",
        );
        expect(screen.getByAltText("x").closest("a")).toHaveAttribute(
          "href",
          "https://example.com/twitter",
        );
        expect(screen.getByAltText("wiki").closest("a")).toHaveAttribute(
          "href",
          "https://example.com/wiki",
        );
      });
    });
    test('should show name if present else "Unknown Artist"', () => {
      const { unmount } = render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={[`/artists/${id}`]}>
            <Suspense>
              <ArtistInfo id={id} />
            </Suspense>
          </MemoryRouter>
        </QueryClientProvider>,
      );
      expect(screen.getByTestId("artist-title").textContent).toBe(
        "Artist name",
      );
      unmount();

      mockedUseQuery.mockReturnValue({
        ...mockedArtistData,
        data: {} as ArtistType,
      } as unknown as UseQueryResult<ArtistType>);

      render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={[`/artists/${id}`]}>
            <Suspense>
              <ArtistInfo id={id} />
            </Suspense>
          </MemoryRouter>
        </QueryClientProvider>,
      );

      expect(screen.getByTestId("artist-title").textContent).toBe(
        "Unknown Artist",
      );
    });
  });
  describe("ArtistAlbums", () => {
    test("should render", () => {
      render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={[`/artists/${id}`]}>
            <Suspense>
              <ArtistAlbums id={id} />
            </Suspense>
          </MemoryRouter>
        </QueryClientProvider>,
      );
      expect(screen.getByTestId("artist-albums")).toBeInTheDocument();
    });
    test("getArtistAlbums should call url and return response", async () => {
      const mockAlbums = [sampleAlbum];
      const mockApiResponse = { data: { albums: mockAlbums } };

      (fetch as Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await getArtistAlbums(id);

      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:3000/api/artists/${id}/albums?page=0`,
        undefined,
      );
      expect(result).toEqual(mockAlbums);
    });
    test("should render individual Albums if data is present", () => {
      render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={[`/artists/${id}`]}>
            <Suspense>
              <ArtistAlbums id={id} />
            </Suspense>
          </MemoryRouter>
        </QueryClientProvider>,
      );
      expect(screen.getByTestId("artist-album")).toBeInTheDocument();
    });
    test("should navigate to the albums path with its id", () => {
      const { result } = renderHook(() => useLocation(), {
        wrapper: MemoryRouter,
      });
      const path = result.current.pathname;
      render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={[`/artists/${id}`]} initialIndex={0}>
            <Suspense>
              <ArtistAlbums id={id} />
            </Suspense>
          </MemoryRouter>
        </QueryClientProvider>,
      );
      waitFor(() => {
        expect(path).toBe(`/artists/${id}`);
      });

      const listitem = screen.getByTestId("artist-album");
      expect(listitem).toBeInTheDocument();
      act(() => {
        fireEvent.click(listitem);
      });

      waitFor(() => {
        expect(path).toBe(`/albums/${id}`);
      });
    });
    test("should not render individual Albums if data is not present", async () => {
      mockedUseQuery.mockReturnValue({
        ...mockedArtistAlbumData,
        data: undefined,
      } as UseQueryResult<AlbumById[]>);
      render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={[`/artists/${id}`]}>
            <Suspense>
              <ArtistAlbums id={id} />
            </Suspense>
          </MemoryRouter>
        </QueryClientProvider>,
      );
      expect(screen.queryByTestId("albums-container")).not.toBeInTheDocument();
    });
    test("disables the query and resolves an empty list without an id", async () => {
      let queryEnabled: unknown;
      let queryFn: (() => Promise<AlbumById[]>) | undefined;
      mockedUseQuery.mockImplementation((options) => {
        queryEnabled = options.enabled;
        queryFn = options.queryFn as () => Promise<AlbumById[]>;
        return {
          ...mockedArtistAlbumData,
          data: undefined,
        } as UseQueryResult<AlbumById[]>;
      });

      render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={["/artists"]}>
            <ArtistAlbums id="" />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      expect(queryEnabled).toBe(false);
      await expect(queryFn?.()).resolves.toEqual([]);
    });
    test("runs the album query for a valid artist id", async () => {
      let queryFn: (() => Promise<AlbumById[]>) | undefined;
      const mockAlbums = [sampleAlbum];
      clearRequestCache();
      mockedUseQuery.mockImplementation((options) => {
        queryFn = options.queryFn as () => Promise<AlbumById[]>;
        return {
          ...mockedArtistAlbumData,
          data: undefined,
        } as UseQueryResult<AlbumById[]>;
      });
      (fetch as Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { albums: mockAlbums } }),
      });

      render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={[`/artists/${id}`]}>
            <ArtistAlbums id={id} />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      await expect(queryFn?.()).resolves.toEqual(mockAlbums);
      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:3000/api/artists/${id}/albums?page=0`,
        undefined,
      );
    });
    test("getAlbumImage should get the image url if available else return albumfallback", () => {
      const { unmount } = render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={[`/artists/${id}`]}>
            <Suspense>
              <ArtistAlbums id={id} />
            </Suspense>
          </MemoryRouter>
        </QueryClientProvider>,
      );
      const image = screen.getByAltText("artist-album-image");
      expect(image).toBeInTheDocument();
      expect((image as HTMLImageElement).src).toContain("image%20url");

      unmount();

      mockedUseQuery.mockReturnValue({
        ...mockedArtistAlbumData,
        data: [{ ...sampleAlbum, image: [] }],
      } as UseQueryResult<AlbumById[]>);

      render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={[`/artists/${id}`]}>
            <Suspense>
              <ArtistAlbums id={id} />
            </Suspense>
          </MemoryRouter>
        </QueryClientProvider>,
      );

      const newImage = screen.getByAltText("artist-album-image");
      expect(newImage).toBeInTheDocument();
      expect((newImage as HTMLImageElement).src).toContain(albumfallback);
    });
    test("uses the first image when no preferred image exists", () => {
      mockedUseQuery.mockReturnValue({
        ...mockedArtistAlbumData,
        data: [
          {
            ...sampleAlbum,
            image: [{ quality: "50x50", url: "first-image-url" }],
          },
        ],
      } as unknown as UseQueryResult<AlbumById[]>);

      render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={[`/artists/${id}`]}>
            <ArtistAlbums id={id} />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      expect(
        (screen.getByAltText("artist-album-image") as HTMLImageElement).src,
      ).toContain("first-image-url");
    });
  });
  describe("ArtistSongs", () => {
    test("should render", async () => {
      render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={[`/artists/${id}`]}>
            <Suspense>
              <ArtistSongs id={id} />
            </Suspense>
          </MemoryRouter>
        </QueryClientProvider>,
      );
      expect(await screen.findByTestId("artist-songs")).toBeInTheDocument();
    });
    test("getArtistSongs should call url and return response", async () => {
      const mockSongs = [sampleTrack];
      const mockApiResponse = { data: { songs: mockSongs } };

      (fetch as Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await getArtistSongs(id);

      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:3000/api/artists/${id}/songs?page=0`,
        undefined,
      );

      expect(result).toEqual(mockSongs);
    });
    test("shows the empty state when no songs are returned", () => {
      mockedUseQuery.mockReturnValue({
        ...mockedArtistSongData,
        data: undefined,
      } as unknown as UseQueryResult<TrackDetails[]>);

      render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={[`/artists/${id}`]}>
            <ArtistSongs id={id} />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      expect(screen.getByText("No songs here...T_T")).toBeInTheDocument();
    });
  });
});
