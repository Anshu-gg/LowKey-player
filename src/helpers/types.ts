import { Image, SongQueue, TrackDetails } from "../types/GlobalTypes";

export type Helpers = {
  getTrackImage: (
    images: TrackDetails["image"] | undefined,
    isMobile: boolean,
  ) => string;
  animateScreen: (
    ele: HTMLElement,
    animation: string,
    customDelay?: number | { direction: "exit" },
  ) => () => void;
  cleanString: (str: string) => string;
  secondsToHMS: (s: number) => string;
  handleCollectionPlayback: (
    e:
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
      | React.KeyboardEvent<Element>,
    collection: {
      id: string;
      name: string;
      image: Image[] | boolean;
      songs: TrackDetails[];
    },
    startTransition: (cb: () => void) => void,
    isPlaying: boolean,
    inQueue: boolean,
    setQueue: (queue: SongQueue) => void,
    setNowPlaying: (track: TrackDetails) => void,
    setIsPlaying: (status: boolean) => void,
  ) => void;
  saveToLocalStorage: (
    storageKey: string,
    updates: Record<string, unknown>,
  ) => void;
  toggleFavorite: (obj: {
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>;
    track: TrackDetails;
    isFavorited: boolean;
    setFavoriteSong: (track: TrackDetails) => void;
    removeFavorite: (id: string) => void;
    startTransition: (cb: () => void) => void;
  }) => void;
};
