"use client";

import { useEffect, useRef, useState } from "react";

export function ButterflyHero() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={stageRef} className={`butterfly-stage glass-card${visible ? "" : " paused"}`}>
      <div className="butterfly-aura" />
      <div className="butterfly-wing left" />
      <div className="butterfly-wing right" />
      <div className="butterfly-wing inner-left left" />
      <div className="butterfly-wing inner-right" />
      <div className="butterfly-body" />
      <div className="relative z-10 mt-24 text-center">
        <p className="font-display text-[32px] italic text-[color:var(--text-primary)]">
          Small notes, gentle transformations.
        </p>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Return to the page and let each day leave a wingbeat behind.
        </p>
      </div>
    </div>
  );
}
