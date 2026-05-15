import { useEffect, useRef } from "react";
import { initRomanticSpace, type RomanticSpaceHandle } from "../scene/romanticSpace";

export function Heart3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let handle: RomanticSpaceHandle | undefined;
    let cancelled = false;

    initRomanticSpace(container)
      .then((h) => {
        if (cancelled) {
          h.dispose();
          return;
        }
        handle = h;
      })
      .catch((err) => {
        console.error("[Heart3D] initRomanticSpace failed:", err);
      });

    return () => {
      cancelled = true;
      handle?.dispose();
    };
  }, []);

  return <div ref={containerRef} className="heart-canvas" aria-hidden />;
}
