import { useEffect, useRef, useState } from "react";
import { initRomanticSpace, type RomanticSpaceHandle } from "../scene/romanticSpace";

const LOVE_SEQUENCE = ["Hà", "Hiền", "My", "♥"] as const;

export function Heart3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef(0);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const sessionId = ++sessionRef.current;
    let handle: RomanticSpaceHandle | undefined;

    void (async () => {
      try {
        const h = await initRomanticSpace(container);
        if (sessionId !== sessionRef.current) {
          h.dispose();
          return;
        }
        handle = h;
      } catch (err) {
        console.error("[Heart3D] initRomanticSpace failed:", err);
      }
    })();

    return () => {
      sessionRef.current++;
      handle?.dispose();
      handle = undefined;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setWordIndex((current) => (current + 1) % LOVE_SEQUENCE.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, []);

  const currentWord = LOVE_SEQUENCE[wordIndex];

  return (
    <>
      <div
        ref={containerRef}
        className="heart-canvas absolute inset-0 pointer-events-none"
      />
      <div className="love-text-sequence" aria-hidden>
        <span
          key={currentWord}
          className={currentWord === "♥" ? "love-text love-text--heart" : "love-text"}
        >
          {currentWord}
        </span>
      </div>
    </>
  );
}
