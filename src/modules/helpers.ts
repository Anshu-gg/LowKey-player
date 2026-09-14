const cachedModules = new Map<string, Promise<unknown>>();

const loadModule = <T>(key: string, loader: () => Promise<T>) => {
  const cached = cachedModules.get(key) as Promise<T> | undefined;

  if (cached) return cached;

  const promise = loader().catch((error) => {
    cachedModules.delete(key);
    throw error;
  });

  cachedModules.set(key, promise as Promise<unknown>);
  return promise;
};

export const getTrackImg = () =>
  loadModule("getTrackImage", () => import("../helpers/getTrackImage"));

export const fadeScreen = () =>
  loadModule("animateScreen", () => import("../helpers/animateScreen"));

export const sanitizeString = () =>
  loadModule("cleanString", () => import("../helpers/cleanString"));

export const formatTime = () =>
  loadModule("secondsToHMS", () => import("../helpers/secondsToHMS"));

export const playCollection = () =>
  loadModule(
    "handleCollectionPlayback",
    () => import("../helpers/handleCollectionPlayback"),
  );

export const saveLocal = () =>
  loadModule(
    "saveToLocalStorage",
    () => import("../helpers/saveToLocalStorage"),
  );

export const toggleFavorited = () =>
  loadModule("toggleFavorite", () => import("../helpers/toggleFavorite"));
