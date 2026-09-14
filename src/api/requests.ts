import {
  AlbumById,
  ArtistType,
  PlaylistById,
  SearchType,
  TrackDetails,
} from "../types/GlobalTypes";
import { defaultSearchData } from "../utils/utils";
const CACHE_TTL = 60000;
const cache = new Map();
const BASE_URL = "https://lowkey-backend.vercel.app";

export const clearRequestCache = () => {
  cache.clear();
};

async function fetchWithCache<T = unknown>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const key = url;
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiry > now) return cached.data as T;

  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`Fetch error: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as T;
  cache.set(key, { data: json, expiry: now + CACHE_TTL });
  return json;
}

//Get widget data
export async function getWidgetData() {
  try {
    const json = await fetchWithCache<{ data?: PlaylistById | null }>(
      `${BASE_URL}/api/playlists?id=1265154514`,
    );
    return (json?.data ?? null) as PlaylistById | null;
  } catch (err) {
    console.error(err);
  }
}

//Genre query
export const getPlaylist = async (genre: string) => {
  try {
    const json = await fetchWithCache<{ data?: { results?: PlaylistById[] } }>(
      `${BASE_URL}/api/search/playlists?query=${genre}`,
    );
    return (json?.data?.results ?? null) as PlaylistById[] | null;
  } catch (err) {
    console.error(err);
  }
};

//Playlist page request
export const getPlaylistData = async (id: string) => {
  try {
    const json = await fetchWithCache<{ data?: PlaylistById }>(
      `${BASE_URL}/api/playlists?id=${id}`,
    );
    return (json?.data ?? null) as PlaylistById;
  } catch (err) {
    console.error(err);
  }
};
//Album page request
export const getAlbumData = async (id: string) => {
  try {
    const json = await fetchWithCache<{ data?: AlbumById }>(
      `${BASE_URL}/api/albums?id=${id}`,
    );
    return (json?.data ?? null) as AlbumById;
  } catch (err) {
    console.error(err);
  }
};

//search query
export const getSearchResults = async (
  query: string,
  signal?: AbortSignal,
): Promise<SearchType | null> => {
  if (query !== "" && query.length >= 2) {
    try {
      const url = `${BASE_URL}/api/search?query=${query}`;
      const json = await fetchWithCache<{ data?: SearchType }>(url, {
        signal,
      });
      if (json?.data) return json.data;
      return defaultSearchData;
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        // request was aborted by caller
        return null;
      }
      console.error(err);
    }
  }
  return null;
};

//artist details
export const getArtistDetails = async (id: string) => {
  try {
    const json = await fetchWithCache<{ data?: ArtistType }>(
      `${BASE_URL}/api/artists/${id}`,
    );
    return (json?.data ?? null) as ArtistType;
  } catch (err) {
    console.error(err);
  }
};

//artist albums
export const getArtistAlbums = async (id: string) => {
  try {
    const json = await fetchWithCache<{ data?: { albums?: AlbumById[] } }>(
      `${BASE_URL}/api/artists/${id}/albums?page=0`,
    );
    return (json?.data?.albums ?? null) as AlbumById[] | null;
  } catch (err) {
    console.error(err);
  }
};

//artist songs
export const getArtistSongs = async (id: string) => {
  try {
    const json = await fetchWithCache<{ data?: { songs?: TrackDetails[] } }>(
      `${BASE_URL}/api/artists/${id}/songs?page=0`,
    );
    return (json?.data?.songs ?? null) as TrackDetails[] | null;
  } catch (err) {
    console.error(err);
  }
};
