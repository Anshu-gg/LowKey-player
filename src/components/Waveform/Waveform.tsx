import { RefObject, useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { useBoundStore } from "../../modules/hooks";
import { formatTime, saveLocal } from "../../modules/helpers";
const { saveToLocalStorage } = await saveLocal();
const secondsToHMS = await formatTime();

type WaveformType = {
  waveform: {
    isReplay: boolean;
    playCountRef: RefObject<number>;
    audioUrl: string;
    duration: number;
    volume: number;
    songIndex: number;
    queueLength: number;
    isMobileWidth: boolean;
    continuePlayback: () => void;
  };
  localSave: {
    url: string;
    time: number;
    duration: number;
  };
};

const Waveform = ({
  isReplay,
  playCountRef,
  audioUrl,
  duration: trackDuration,
  volume,
  songIndex,
  isMobileWidth,
  continuePlayback,
}: WaveformType["waveform"]) => {
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const lastTrackRef = useRef<string>("");
  const lastTrackIdRef = useRef<string>("");
  const lastTimeRef = useRef<number>(0);
  const lastFinishRef = useRef<number>(0);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const isPlaying = useBoundStore((state) => state.nowPlaying.isPlaying);
  const setIsPlaying = useBoundStore((state) => state.setIsPlaying);
  const queue = useBoundStore((state) => state.nowPlaying.queue);
  const id = useBoundStore((state) => state.nowPlaying.track?.id);
  const setQueue = useBoundStore((state) => state.setQueue);

  useEffect(() => {
    waveSurferRef.current ??= WaveSurfer.create({
      container: waveformRef.current as HTMLDivElement,
      waveColor: "#666666",
      cursorColor: "#10B981",
      progressColor: "#10B981",
      interact: true,
      barHeight: isMobileWidth ? 1 : 3,
      barWidth: isMobileWidth ? 3 : 2,
      height: isMobileWidth ? 50 : 10,
      width: isMobileWidth ? "65dvw" : "25vw",
      dragToSeek: true,
      normalize: true,
      autoScroll: true,
      hideScrollbar: true,
    });

    return () => {
      waveSurferRef.current?.unAll();
      waveSurferRef.current?.destroy();
      waveSurferRef.current = null;
    };
  }, [isMobileWidth]);

  useEffect(() => {
    playCountRef.current = 0;
  }, [id, audioUrl, isReplay, playCountRef]);

  useEffect(() => {
    const ws = waveSurferRef.current;
    const isNewTrack = lastTrackIdRef.current !== id;
    const isSameUrl = lastTrackRef.current === audioUrl;
    const secureUrl = audioUrl.startsWith("https")
      ? audioUrl
      : audioUrl.replace("http", "https");
    const storedStr = localStorage.getItem("last-waveform");
    const stored = storedStr
      ? (JSON.parse(storedStr) as WaveformType["localSave"])
      : null;
    if (!ws) return;
    if (isNewTrack || !isSameUrl) ws.load(secureUrl);
    const handleReady = () => {
      if (isNewTrack) {
        if (stored?.url === secureUrl) {
          ws?.seekTo(stored.time / (stored.duration || 1));
        }
      } else if (!isSameUrl && lastTimeRef.current > 0) {
        ws?.seekTo(lastTimeRef.current / (trackDuration || 1));
      }
      if (isPlaying) {
        ws?.play();
      } else {
        ws?.pause();
      }
    };
    if (isNewTrack) {
      lastTimeRef.current = 0;
      lastTrackIdRef.current = id as string;
      playCountRef.current = 0;
    } else {
      lastTimeRef.current = ws.getCurrentTime();
    }
    ws.on("ready", handleReady);
    ws.on("timeupdate", () => {
      setCurrentTime(Math.floor(ws?.getCurrentTime() as number));
    });
    return () => {
      ws?.un("ready", handleReady);
    };
  }, [audioUrl, id, isPlaying, playCountRef, trackDuration]);

  useEffect(() => {
    const saveState = () => {
      saveToLocalStorage("last-waveform", {
        url: audioUrl,
        time: waveSurferRef.current?.getCurrentTime() || 0,
        duration: trackDuration || "0",
      });
    };
    globalThis.addEventListener("beforeunload", saveState);
    return () => {
      globalThis.removeEventListener("beforeunload", saveState);
    };
  }, [trackDuration, audioUrl]);

  useEffect(() => {
    const ws = waveSurferRef.current;
    if (ws) {
      if (isPlaying) ws.play();
      else ws.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    waveSurferRef.current?.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    const ws = waveSurferRef.current;
    if (!ws) return;
    const queueSongs = queue?.songs;
    function handleCompletion() {
      const now = Date.now();
      if (now - lastFinishRef.current < 400) return;
      lastFinishRef.current = now;

      if (isReplay) {
        if (playCountRef.current === 0) {
          playCountRef.current = 1;
          ws?.seekTo(0);
          ws?.play();
          return;
        }
        playCountRef.current = 0;
        continuePlayback();
        return;
      }

      playCountRef.current = 0;

      if (songIndex !== -1 && queueSongs && songIndex < queueSongs.length - 1) {
        setQueue({
          ...queue,
          songs: queueSongs.filter((_, idx) => idx !== songIndex),
        });
        continuePlayback();
      } else {
        setIsPlaying(false);
      }
    }
    ws.on("finish", handleCompletion);
    return () => {
      ws.un("finish", handleCompletion);
    };
  }, [
    continuePlayback,
    isReplay,
    playCountRef,
    queue,
    setIsPlaying,
    setQueue,
    songIndex,
    isMobileWidth,
  ]);

  return (
    <div
      data-testid="waveform-container"
      className="my-10 flex w-full flex-shrink-0 items-center justify-center space-x-3 pb-0.5 sm:mb-6"
    >
      <Progress progress={currentTime || lastTimeRef.current} />
      <div
        ref={waveformRef}
        id="wave"
        data-testid="waveform"
        className="flex w-[70%] items-center justify-center overflow-hidden sm:w-[23vw] md:w-[30vw] lg:w-[40vw] xl:max-w-[400px] 2xl:w-[420px]"
      />
      <p
        data-testid="duration"
        className="h-full flex-shrink-0 text-center text-xs text-white sm:text-[10px]"
      >
        {trackDuration ? secondsToHMS.default(Number(trackDuration)) : "--:--"}
      </p>
    </div>
  );
};

export default Waveform;

const Progress = ({ progress }: { progress: number }) => {
  return (
    <p className="mr-6 h-full w-[10px] text-center text-xs text-white sm:text-[10px]">
      {secondsToHMS.default(progress)}
    </p>
  );
};
