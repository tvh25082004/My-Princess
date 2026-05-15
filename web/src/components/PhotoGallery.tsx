import { useCallback, useEffect, useRef, useState } from "react";

const PHOTOS = [
  { src: "/images/IMG_8946.jpeg", alt: "Kỷ niệm 1" },
  { src: "/images/IMG_8947.jpeg", alt: "Kỷ niệm 2" },
  { src: "/images/IMG_8948.jpeg", alt: "Kỷ niệm 3" },
] as const;

export function PhotoGallery() {
  const [index, setIndex] = useState(0);
  const touchStart = useRef(0);
  const touchDelta = useRef(0);

  const go = useCallback((next: number) => {
    setIndex(() => (next + PHOTOS.length) % PHOTOS.length);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % PHOTOS.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
    touchDelta.current = 0;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchDelta.current = e.touches[0].clientX - touchStart.current;
  };

  const onTouchEnd = () => {
    if (touchDelta.current > 48) go(index - 1);
    else if (touchDelta.current < -48) go(index + 1);
    touchDelta.current = 0;
  };

  return (
    <section className="gallery" aria-label="Ảnh kỷ niệm">
      <div
        className="gallery-track"
        style={{ transform: `translateX(-${index * 100}%)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {PHOTOS.map((photo) => (
          <article key={photo.src} className="gallery-slide">
            <div className="golden-frame">
              <div className="frame-ornament frame-ornament--tl" />
              <div className="frame-ornament frame-ornament--tr" />
              <div className="frame-ornament frame-ornament--bl" />
              <div className="frame-ornament frame-ornament--br" />
              <img src={photo.src} alt={photo.alt} loading="lazy" draggable={false} />
            </div>
          </article>
        ))}
      </div>

      <div className="gallery-dots" role="tablist">
        {PHOTOS.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Ảnh ${i + 1}`}
            className={i === index ? "dot dot--active" : "dot"}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </section>
  );
}
