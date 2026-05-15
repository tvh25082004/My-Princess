import { useCallback, useEffect, useRef } from "react";

const VIDEO_ID = "dElRVQFqj-k";

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: { onReady?: (e: { target: YtPlayer }) => void };
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
}

export function MusicPlayer() {
  const playerRef = useRef<YtPlayer | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const unmutedRef = useRef(false);

  const tryUnmuteAndPlay = useCallback((player: YtPlayer) => {
    try {
      player.setVolume(75);
      player.unMute();
      player.playVideo();
      unmutedRef.current = true;
    } catch {
      /* trình duyệt chặn — thử lại lần tương tác đầu */
    }
  }, []);

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
      },
      events: {
        onReady: (e) => {
          e.target.playVideo();
          setTimeout(() => tryUnmuteAndPlay(e.target), 400);
          setTimeout(() => tryUnmuteAndPlay(e.target), 1200);
        },
      },
    });
  }, [tryUnmuteAndPlay]);

  useEffect(() => {
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
      if (playerRef.current) tryUnmuteAndPlay(playerRef.current);
    };
    document.addEventListener("touchstart", onInteract, { once: true, passive: true });
    document.addEventListener("click", onInteract, { once: true });

    return () => {
      document.removeEventListener("touchstart", onInteract);
      document.removeEventListener("click", onInteract);
    };
  }, [initPlayer, tryUnmuteAndPlay]);

  return <div ref={hostRef} className="music-player-host" aria-hidden />;
}
