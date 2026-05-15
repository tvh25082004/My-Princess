import { useCallback, useEffect, useRef, useState } from "react";

const VIDEO_ID = "dElRVQFqj-k";

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (e: { target: YtPlayer }) => void;
            onStateChange?: (e: { data: number; target: YtPlayer }) => void;
          };
        }
      ) => YtPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YtPlayer {
  playVideo: () => void;
  unMute: () => void;
  setVolume: (n: number) => void;
  getPlayerState: () => number;
}

function prefersTouchPlayback() {
  return (
    window.matchMedia("(max-width: 768px), (pointer: coarse)").matches ||
    "ontouchstart" in window
  );
}

export function MusicPlayer() {
  const playerRef = useRef<YtPlayer | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const unmutedRef = useRef(false);
  const touchModeRef = useRef(false);
  const [showUnlock, setShowUnlock] = useState(false);

  const markPlaying = useCallback(() => {
    unmutedRef.current = true;
    setShowUnlock(false);
  }, []);

  const tryUnmuteAndPlay = useCallback(
    (player: YtPlayer) => {
      try {
        player.setVolume(80);
        player.unMute();
        player.playVideo();
        const state = player.getPlayerState?.();
        if (state === 1 || state === 3) {
          markPlaying();
        } else {
          window.setTimeout(() => {
            if (player.getPlayerState?.() === 1) markPlaying();
          }, 400);
        }
      } catch {
        /* iOS có thể chặn — thử lại khi user chạm */
      }
    },
    [markPlaying]
  );

  const unlock = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    try {
      player.setVolume(80);
      player.unMute();
      player.playVideo();
      markPlaying();
    } catch {
      tryUnmuteAndPlay(player);
    }
  }, [markPlaying, tryUnmuteAndPlay]);

  const initPlayer = useCallback(() => {
    if (!hostRef.current || !window.YT || playerRef.current) return;

    playerRef.current = new window.YT.Player(hostRef.current, {
      videoId: VIDEO_ID,
      playerVars: {
        autoplay: 1,
        mute: 1,
        loop: 1,
        playlist: VIDEO_ID,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        enablejsapi: 1,
      },
      events: {
        onReady: (e) => {
          e.target.playVideo();
          if (!touchModeRef.current) {
            window.setTimeout(() => tryUnmuteAndPlay(e.target), 300);
            window.setTimeout(() => tryUnmuteAndPlay(e.target), 1000);
          }
        },
        onStateChange: (e) => {
          if (e.data === 1 && !unmutedRef.current && !touchModeRef.current) {
            tryUnmuteAndPlay(e.target);
          }
          if (e.data === 1 && unmutedRef.current) {
            setShowUnlock(false);
          }
        },
      },
    });
  }, [tryUnmuteAndPlay]);

  useEffect(() => {
    touchModeRef.current = prefersTouchPlayback();
    setShowUnlock(touchModeRef.current);

    const boot = () => initPlayer();

    if (window.YT?.Player) {
      boot();
    } else {
      const existing = document.querySelector('script[src*="youtube.com/iframe_api"]');
      if (!existing) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        boot();
      };
    }

    const onInteract = () => {
      if (unmutedRef.current) return;
      unlock();
    };
    document.addEventListener("touchstart", onInteract, { passive: true });
    document.addEventListener("click", onInteract);

    return () => {
      document.removeEventListener("touchstart", onInteract);
      document.removeEventListener("click", onInteract);
    };
  }, [initPlayer, unlock]);

  return (
    <>
      <div ref={hostRef} className="music-player-host" aria-hidden />
      {showUnlock ? (
        <button type="button" className="music-unlock-btn" onClick={unlock} aria-label="Bật nhạc">
          ♪ Chạm để bật nhạc
        </button>
      ) : null}
    </>
  );
}
