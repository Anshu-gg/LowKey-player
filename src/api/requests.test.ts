import {
  describe,
  test,
  expect,
  vi,
  afterEach,
  beforeEach,
  Mock,
} from "vitest";
import * as api from "./requests";
import { defaultSearchData } from "../utils/utils";
import {
  sampleAlbum,
  sampleArtist,
  samplePlaylist,
  sampleTrack,
} from "./samples";
import { clearRequestCache } from "./requests";

const {
  getAlbumData,
  getArtistAlbums,
  getArtistDetails,
  getArtistSongs,
  getPlaylist,
  getPlaylistData,
  getSearchResults,
  getWidgetData,
} = api;

const errorObj: Error = {
  name: "NetworkError",
  stack: expect.any(String),
  message: "Failed to fetch",
};

beforeEach(() => {
  clearRequestCache();
  globalThis.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function fetchSuccessWithData(
  fn: () => Promise<unknown>,
  expectedResponse: unknown,
  apiResponse: unknown = { data: expectedResponse },
) {
  clearRequestCache();

  (fetch as Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(apiResponse),
  });
  const res = await fn();
  expect(res).toEqual(expectedResponse);
}

async function fetchSuccessWithNull(fn: () => Promise<unknown>) {
  clearRequestCache();
  const mockNullResponse = { message: "no data found" };

  (fetch as Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockNullResponse),
  });
  const failedRes = await fn();
  expect(failedRes).toBeNull();
}

async function fetchRejection(
  fn: () => Promise<unknown>,
  expected: unknown = undefined,
) {
  clearRequestCache();
  globalThis.fetch = vi.fn().mockRejectedValueOnce(errorObj);
  const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  const result = await fn();
  expect(result).toBe(expected);

  expect(consoleSpy).toHaveBeenCalledWith(errorObj);
  consoleSpy.mockRestore();
}

describe("Testing APIs", () => {
  test("Requesting widget response", async () => {
    await fetchSuccessWithData(getWidgetData, samplePlaylist);
    await fetchSuccessWithNull(getWidgetData);
  });
  test("Widget request rejection", async () => {
    await fetchRejection(getWidgetData);
  });

  test("Requesting playlists by genres response", async () => {
    await fetchSuccessWithData(() => getPlaylist("pop"), [samplePlaylist], {
      data: { results: [samplePlaylist] },
    });
    await fetchSuccessWithNull(() => getPlaylist("pop"));
  });

  test("Expecting playlists by genres error", async () => {
    await fetchRejection(() => getPlaylist("edm"));
  });

  test("Requesting playlists by id", async () => {
    await fetchSuccessWithData(() => getPlaylistData("02361"), samplePlaylist);
    await fetchSuccessWithNull(() => getPlaylistData("02361"));
  });
  test("Expecting playlists by id error", async () => {
    await fetchRejection(() => getPlaylistData(""));
  });

  test("Requesting albums by id", async () => {
    await fetchSuccessWithData(() => getAlbumData("01311"), sampleAlbum);
    await fetchSuccessWithNull(() => getAlbumData("01311"));
  });
  test("Expecting albums by id error", async () => {
    await fetchRejection(() => getAlbumData(""));
  });

  describe("Testing getSearchResults", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      clearRequestCache();
    });

    test("returns search results when data.data exists", async () => {
      const mockData = { data: [{ id: "1", title: "Song" }] };
      const mockJson = vi.fn().mockResolvedValue(mockData);
      const mockResponse = { ok: true, json: mockJson };
      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await getSearchResults("some query");
      expect(result).toEqual(mockData.data);
    });

    test("returns default data when data.data is not present", async () => {
      const mockData = {};
      const mockJson = vi.fn().mockResolvedValue(mockData);
      const mockResponse = { ok: true, json: mockJson };
      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      expect(await getSearchResults("validQuery")).toEqual(defaultSearchData);
    });

    test("does not fetch when query is empty or less than 2 chars", async () => {
      globalThis.fetch = vi.fn();
      await getSearchResults("");
      await getSearchResults("a");
      expect(fetch).not.toHaveBeenCalled();
    });

    test("handles fetch error gracefully", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const error = new Error("fetch failed");
      globalThis.fetch = vi.fn(() => Promise.reject(error)) as Mock;

      await getSearchResults("validQuery");
      expect(consoleSpy).toHaveBeenCalledWith(error);
      consoleSpy.mockRestore();
    });
  });
  test("Expecting results by query error", async () => {
    await fetchRejection(() => getSearchResults("Eminem"), null);
  });

  test("Requesting artists by id", async () => {
    await fetchSuccessWithData(() => getArtistDetails("931242"), sampleArtist);
    await fetchSuccessWithNull(() => getArtistDetails("931242"));
  });
  test("Expecting artists by id error", async () => {
    await fetchRejection(() => getArtistDetails(""));
  });

  test("Requesting albums by artist id", async () => {
    const mockPayload = [sampleAlbum];
    const mockApiResponse = { data: { albums: mockPayload } };

    (fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    });
    const res = await getArtistAlbums("19661");
    expect(res).toEqual(mockPayload);

    await fetchSuccessWithNull(() => getArtistAlbums("19661"));
  });
  test("Expecting albums by artist id error", async () => {
    await fetchRejection(() => getArtistAlbums(""));
  });

  test("Requesting songs by artist id", async () => {
    const mockPayload = [sampleTrack];
    const mockApiResponse = { data: { songs: mockPayload } };

    (fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    });
    const res = await getArtistSongs("19661");
    expect(res).toEqual(mockPayload);

    await fetchSuccessWithNull(() => getArtistSongs("19661"));
  });
  test("Expecting songs by artist id error", async () => {
    await fetchRejection(() => getArtistSongs(""));
  });
});
