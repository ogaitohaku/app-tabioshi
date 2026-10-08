"use client";
import type { ComponentProps } from "react";
import { track, type TrackEvent } from "@/lib/track";

/** 外部サイトへのリンク。押されたことだけを計測する */
export function OutLink({ event, props, onClick, ...rest }: ComponentProps<"a"> & { event: TrackEvent; props?: Record<string, string> }) {
  return (
    <a
      {...rest}
      onClick={(e) => {
        track(event, props);
        onClick?.(e);
      }}
    />
  );
}
