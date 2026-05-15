import { useEffect, useRef } from "react";
import { initRomanticSpace, type RomanticSpaceHandle } from "../scene/romanticSpace";

export function Heart3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let handle: RomanticSpaceHandle | undefined;

    initRomanticSpace(container).then((h) => {
      handle = h;
    });

    return () => {
      handle?.dispose();
    };
  }, []);

  return <div ref={containerRef} className="heart-canvas" aria-hidden />;
}
