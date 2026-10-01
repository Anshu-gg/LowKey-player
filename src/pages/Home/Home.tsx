import { lazy, memo, useEffect, useMemo, useRef } from "react";
import { preconnect, preload } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useBoundStore } from "../../modules/hooks";
import play from "../../assets/svgs/play-icon.svg";
import pause from "../../assets/svgs/pause-icon.svg";
const widgetfallback = "/fallbacks/widget-fallback.webp";
import timely from "../../assets/svgs/disc-svgrepo-com.svg";
import viral from "../../assets/svgs/viral.svg";
import { Image, PlaylistById, TrackDetails } from "../../types/GlobalTypes";
import { getWidgetData } from "../../api/requests";
import { genres } from "../../utils/utils";
import { Widgetfallback } from "./Loading";
import { useQuery } from "@tanstack/react-query";
import { animateScreen } from "../../helpers/animateScreen";
const Song = lazy(() => import("../../components/Song/Song"));
const Section = lazy(() => import("../../components/Section/Section"));

preconnect("https://lowkeymusic-v2.netlify.app");
preload(
  "https://c.saavncdn.com/editorial/PopHits2025English_20250708135249.jpg?bch=1752248614",
  {
    as: "image",
    fetchPriority: "high",
  },
);

export default function Home() {
  const homeRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const entryTimerRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function fadeOutNavigate(str: string) {
    if (!homeRef.current) return;
    entryTimerRef.current?.();
    animateScreen(homeRef.current, "home-fadeout", { direction: "exit" });
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      navigate(str);
    }, 300);
  }

  useEffect(() => {
    if (!homeRef.current) return;
    entryTimerRef.current = animateScreen(homeRef.current, "home-fadeout");
    return () => {
      entryTimerRef.current?.();
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      data-testid="home-page"
      ref={homeRef}
      className="home-fadeout h-auto max-h-max w-full scroll-smooth duration-300 ease-in-out xl:w-full"
    >
      <Widget fadeOutNavigate={fadeOutNavigate} />
      <h1 className="my-2 px-4 pt-2 text-left text-base font-medium text-white xl:text-lg">
        Timely tracks
      </h1>
      <TimelyPlaylists fadeOutNavigate={fadeOutNavigate} />
      <div className="h-auto max-h-max w-full pb-28">
        {/* Genres */}
        {genres.map((genre: string) => (
          <Section
            genre={genre}
            key={genre}
            fadeOutNavigate={fadeOutNavigate}
          />
        ))}
      </div>
    </div>
  );
}

export const Widget = memo(
  ({ fadeOutNavigate }: { fadeOutNavigate: (str: string) => void }) => {
    const { data, isLoading, error } = useQuery({
      queryKey: ["widget"],
      queryFn: getWidgetData,
      enabled: true,
      refetchOnReconnect: "always",
      _optimisticResults: "optimistic",
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 10,
    });
    const iRef = useRef<HTMLImageElement>(null);
    const widgetRef = useRef<HTMLDivElement>(null);
    const clearITimer = useRef<(() => void) | null>(null);
    const clearWidgetTimer = useRef<(() => void) | null>(null);
    const lcpImg =
      data?.image?.find((img: Image) => img.quality === "500x500")?.url ??
      widgetfallback;
    const queue = useBoundStore((state) => state.nowPlaying?.queue);
    const inQueue = useMemo(
      () => queue !== null && queue?.name === data?.name,
      [queue, data],
    );

    function handleImageLoad() {
      if (iRef.current) {
        clearITimer.current?.();
        clearITimer.current = animateScreen(
          iRef.current,
          "widget-banner-fadeout",
        );
      }
      if (widgetRef.current) {
        clearWidgetTimer.current?.();
        clearWidgetTimer.current = animateScreen(
          widgetRef.current,
          "song-fadeout",
        );
      }
    }

    useEffect(() => {
      return () => {
        clearITimer.current?.();
        clearWidgetTimer.current?.();
      };
    }, []);

    if (isLoading || error) {
      return <Widgetfallback />;
    }

    if (data) {
      return (
        <div
          ref={widgetRef}
          data-testid="widget"
          className="song-fadeout h-auto max-h-max w-full px-3.5 sm:pt-0.5"
        >
          <section className="relative z-0 mx-auto mb-7 flex h-80 w-full flex-col overflow-hidden rounded-sm bg-transparent sm:my-3 sm:h-[40vw] sm:flex-row md:h-80 2xl:h-96">
            <div
              tabIndex={0}
              onClick={() =>
                data !== null &&
                data.id !== "" &&
                fadeOutNavigate(`/playlists/${data.id}`)
              }
              role="link"
              className="h-auto w-auto flex-shrink-0 cursor-pointer overflow-hidden rounded-sm duration-200 ease-in contain-layout sm:z-10"
            >
              <img
                ref={iRef}
                src={lcpImg}
                alt={data.name || "Unknown Playlist"}
                fetchPriority="high"
                loading="eager"
                data-testid="widget-image"
                className="widget-banner-fadeout aspect-square h-auto w-auto flex-shrink-0 cursor-pointer brightness-75 duration-200 ease-in contain-layout sm:h-[40vw] sm:w-[40vw] sm:brightness-100 md:h-80 md:w-80 2xl:h-96 2xl:w-96"
                onLoad={handleImageLoad}
                onError={(e) => (e.currentTarget.src = widgetfallback)}
              />
            </div>
            <div className="absolute right-2.5 top-[105px] z-20 flex h-auto w-[95%] items-end justify-between sm:-left-16 sm:top-[80%] sm:h-12 sm:w-[48vw] sm:justify-end sm:p-2 md:w-[370px] md:py-1 2xl:w-[420px]">
              <p className="left-0 top-0 line-clamp-1 h-auto w-[80%] text-3xl font-bold text-white sm:hidden sm:text-xl">
                {data !== null && data?.name}
              </p>
              <WidgetButton key={data.name} data={data} inQueue={inQueue} />
            </div>
            <ul
              id="widget-container"
              className="absolute bottom-1.5 left-[1.75%] h-[158px] w-[96.5%] list-none overflow-x-hidden overflow-y-scroll rounded-sm bg-neutral-900 sm:static sm:ml-3 sm:mt-0 sm:h-full"
            >
              {data.songs?.length > 0 ? (
                data.songs.map((song: TrackDetails, i: number) => (
                  <Song
                    index={i}
                    key={song.id}
                    track={song}
                    isWidgetSong={true}
                  />
                ))
              ) : (
                <p className="m-auto my-[12.5%] text-center text-xl text-neutral-500 sm:my-[135px]">
                  No songs here...T_T
                </p>
              )}
            </ul>
          </section>
        </div>
      );
    }
  },
);
Widget.displayName = "Widget";

const WidgetButton = ({
  data,
  inQueue,
}: {
  data: PlaylistById;
  inQueue: boolean;
}) => {
  const isPlaying = useBoundStore((state) => state.nowPlaying?.isPlaying);
  const setIsPlaying = useBoundStore((state) => state.setIsPlaying);
  const setNowPlaying = useBoundStore((state) => state.setNowPlaying);
  const setQueue = useBoundStore((state) => state.setQueue);

  const handlePlaylist = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.stopPropagation();
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setQueue({
        id: data?.id || "",
        name: data?.name || "",
        image: data?.image || [],
        songs: data?.songs || [],
      });
      if (data !== null) setNowPlaying(data.songs[0]);
      setIsPlaying(true);
    }
  };

  return (
    <button
      style={{
        border: "1px solid #000",
      }}
      tabIndex={0}
      onClick={handlePlaylist}
      data-testid="widget-btn"
      className="rounded-full bg-emerald-500 p-1.5 focus-visible:outline-none focus-visible:ring-8 focus-visible:ring-black"
    >
      <img
        src={isPlaying && inQueue ? pause : play}
        alt={isPlaying && inQueue ? "pause" : "play"}
        loading="lazy"
        className="h-8 w-8"
      />
    </button>
  );
};

export const TimelyPlaylists = memo(
  ({ fadeOutNavigate }: { fadeOutNavigate: (str: string) => void }) => {
    return (
      <div
        data-testid="timely-playlists"
        className="song-fadeout song-fadein mx-auto mb-3 mt-1 grid h-auto w-full cursor-pointer grid-cols-2 grid-rows-2 gap-3 px-3.5 duration-200 ease-in sm:gap-3 xl:grid-cols-4 xl:grid-rows-1"
      >
        <div
          tabIndex={0}
          data-testid="today-playlist"
          role="link"
          onClick={() => fadeOutNavigate("/playlists/1223482895")}
          className="flex h-[50px] w-full items-center justify-start overflow-hidden rounded-sm bg-neutral-800 shadow-sm outline-none transition-shadow hover:text-rose-500 hover:shadow-sm hover:shadow-rose-500 focus-visible:bg-neutral-700 sm:h-full"
        >
          <img
            src={viral}
            alt={"Viral mix"}
            width={50}
            height={50}
            fetchPriority="high"
            data-testid="today-playlist-image"
            loading="eager"
            className="h-[50px] w-[50px] rounded-sm bg-rose-500 p-1.5"
          />
          <p className="p-3.5 px-3 text-left text-xs font-medium tracking-wider text-rose-400 duration-200 ease-in sm:px-4 sm:text-sm">
            Viral mix
          </p>
        </div>
        <div
          tabIndex={0}
          data-testid="weekly-playlist"
          role="link"
          onClick={() => fadeOutNavigate("/playlists/2252904")}
          className="flex h-[50px] w-full items-center justify-start overflow-hidden rounded-sm bg-neutral-800 shadow-sm outline-none transition-shadow hover:text-teal-500 hover:shadow-sm hover:shadow-teal-500 focus-visible:bg-neutral-700 sm:h-auto"
        >
          <img
            src={timely}
            alt={"Top weekly"}
            width={50}
            height={50}
            fetchPriority="high"
            loading="eager"
            data-testid="weekly-playlist-image"
            className="h-[50px] w-[50px] rounded-sm bg-teal-500 p-1.5"
          />
          <p className="p-3.5 px-3 text-left text-xs font-medium tracking-wider text-teal-500 sm:px-4 sm:text-sm">
            Top weekly
          </p>
        </div>
        <div
          tabIndex={0}
          data-testid="monthly-playlist"
          role="link"
          onClick={() => fadeOutNavigate("/playlists/158206266")}
          className="flex h-12 w-full items-center justify-start overflow-hidden rounded-sm bg-neutral-800 shadow-sm outline-none transition-shadow hover:text-yellow-500 hover:shadow-sm hover:shadow-yellow-500 focus-visible:bg-neutral-700 sm:h-auto"
        >
          <img
            src={timely}
            alt={"Best of the month"}
            width={50}
            height={50}
            fetchPriority="high"
            loading="eager"
            data-testid="monthly-playlist-image"
            className="h-[50px] w-[50px] rounded-sm bg-yellow-500 p-1.5"
          />
          <p className="p-3.5 px-3 text-left text-xs font-medium tracking-wider text-yellow-400 sm:px-4 sm:text-sm">
            Best of the month
          </p>
        </div>
        <div
          tabIndex={0}
          data-testid="yearly-playlist"
          role="link"
          onClick={() => fadeOutNavigate("/playlists/1210453303")}
          className="flex h-[50px] w-full items-center justify-start overflow-hidden rounded-sm bg-neutral-800 shadow-sm outline-none transition-shadow hover:text-purple-500 hover:shadow-sm hover:shadow-purple-500 focus-visible:bg-neutral-700 sm:h-auto"
        >
          <img
            src={timely}
            alt={"Latest tracks"}
            width={50}
            height={50}
            fetchPriority="high"
            loading="eager"
            data-testid="yearly-playlist-image"
            className="h-[50px] w-[50px] rounded-sm bg-purple-500 p-1.5"
          />
          <p className="p-3.5 px-3 text-left text-xs font-medium tracking-wider text-purple-400 sm:px-4 sm:text-sm">
            Latest tracks
          </p>
        </div>
      </div>
    );
  },
);
TimelyPlaylists.displayName = "TimelyPlaylists";
