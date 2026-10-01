import { animateScreen } from "../../helpers/animateScreen";
import { PlaylistById } from "../../types/GlobalTypes";
const fallback = "/fallbacks/playlist-fallback.webp";
import { useEffect, useMemo, useRef } from "react";

export default function Playlist({
  id,
  image,
  name,
  i,
  fadeOutNavigate,
}: PlaylistById & { i: number; fadeOutNavigate: (_str: string) => void }) {
  const playlistEl = useRef<HTMLButtonElement>(null);

  const { newImage } = useMemo(() => {
    let newImage = fallback;
    if (image) {
      const obj = image.find((img) => img.quality === "150x150");
      newImage = obj?.url || fallback;
    }
    return { newImage };
  }, [image]);

  useEffect(() => {
    if (!playlistEl.current) return;
    const animateTimer = animateScreen(
      playlistEl.current as HTMLButtonElement,
      "image-fadeout",
      i * 50,
    ) as () => void;
    return () => {
      if (animateTimer) animateTimer();
    };
  }, [i]);

  return (
    <button
      data-testid="playlist"
      ref={playlistEl}
      className="image-fadeout transform-[filter] group mr-4 flex h-[180px] w-[150px] flex-shrink-0 cursor-pointer list-none flex-col items-center overflow-hidden outline-none brightness-100 duration-300 ease-linear hover:brightness-90 focus:brightness-90"
      onClick={() => fadeOutNavigate(`/playlists/${id}`)}
    >
      <div className="h-[150px] w-[150px] overflow-hidden">
        <img
          src={newImage}
          alt={name}
          loading="eager"
          fetchPriority="high"
          width={150}
          height={150}
          className="h-[150px] w-[150px] scale-105 shadow-md shadow-black transition-transform duration-100 ease-in group-hover:scale-100 group-focus:scale-100"
          onError={(e) => (e.currentTarget.src = fallback)}
        />
      </div>
      <p className="mt-2 line-clamp-1 text-ellipsis whitespace-pre-line text-center text-xs text-neutral-400 transition-colors ease-linear group-hover:text-white group-focus:text-white">
        {name}
      </p>
    </button>
  );
}
