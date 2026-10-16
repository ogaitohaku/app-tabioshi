"use client";
import { useEffect, useRef } from "react";
import type { Visual as VisualData } from "@/data/types";
import { drawScene } from "@/lib/scenes";

/**
 * 写真があれば写真、なければイメージ画像を、親の大きさいっぱいに表示する。
 * 比率は親の枠で決める(大きい写真 4:3、一覧の小さい写真 1:1)。写真は focus の位置を残して切り取る
 */
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
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={visual.photo}
        alt={alt}
        style={visual.focus ? { objectPosition: visual.focus } : undefined}
        className={`h-full w-full object-cover ${className}`}
        loading="lazy"
        decoding="async"
      />
    );
  }
  return <canvas ref={ref} role="img" aria-label={alt || undefined} className={`block h-full w-full ${className}`} />;
}
