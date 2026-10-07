"use client";
import { useEffect, useRef } from "react";
import type { Visual as VisualData } from "@/data/types";
import { drawScene } from "@/lib/scenes";

/** 写真があれば写真、なければイメージ画像を、親の大きさいっぱいに表示する */
export function Visual({ visual, alt = "", className = "" }: { visual: VisualData; alt?: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (visual.photo) return;
    const cv = ref.current;
    if (!cv) return;
    let last = "";
    const paint = () => {
      const r = cv.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(r.width * dpr);
      const h = Math.round(r.height * dpr);
      const key = `${w}x${h}`;
      if (key === last) return;
      last = key;
      cv.width = w;
      cv.height = h;
      const ctx = cv.getContext("2d");
      if (ctx) drawScene(ctx, w, h, visual.scene, visual.seed, visual.view);
    };
    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(cv);
    return () => ro.disconnect();
  }, [visual.photo, visual.scene, visual.seed, visual.view]);

  if (visual.photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={visual.photo} alt={alt} className={`h-full w-full object-cover ${className}`} />;
  }
  return <canvas ref={ref} role="img" aria-label={alt || undefined} className={`block h-full w-full ${className}`} />;
}
