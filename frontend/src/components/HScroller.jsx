import { Children, useCallback, useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";


export default function HScroller({ label, children }) {
  const trackRef = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: true });

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft >= max - 4 });
  }, []);

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el) return undefined;
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [update, children]);

  const page = (dir) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") page(1);
    if (e.key === "ArrowLeft") page(-1);
  };

  return (
    <div className="lp-scroller" role="region" aria-roledescription="carousel" aria-label={label}>
      <div className="lp-scroller-controls">
        <button type="button" onClick={() => page(-1)} disabled={edge.start} aria-label="Previous">
          <FiChevronLeft />
        </button>
        <button type="button" onClick={() => page(1)} disabled={edge.end} aria-label="Next">
          <FiChevronRight />
        </button>
      </div>

      <ul className="lp-scroller-track" ref={trackRef} onScroll={update} onKeyDown={onKeyDown} tabIndex={0}>
        {Children.toArray(children).map((child, i) => (
          <li className="lp-scroller-item" key={child.key ?? i}>
            {child}
          </li>
        ))}
      </ul>
    </div>
  );
}
