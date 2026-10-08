"use client";
import { useState } from "react";
import type { Video } from "@/data/types";
import { Icon } from "./Icon";
import { Visual } from "./Visual";

const LABEL = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube" } as const;

/**
 * 元の動画。YouTube はタップしてからアプリ内で再生(最初から読み込まないので軽い)。
 * TikTok・Instagram は元の投稿を開く。
 */
export function VideoPlayer({ video }: { video: Video }) {
  const [playing, setPlaying] = useState(false);
  const src = video.source;

  if (src?.youtubeId && playing) {
    return (
      <iframe
        className="aspect-[4/3] w-full bg-black"
        src={`https://www.youtube-nocookie.com/embed/${src.youtubeId}?autoplay=1&playsinline=1&rel=0`}
        title={video.title}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <div className="relative aspect-[4/3] bg-line">
      <Visual visual={video.visual} alt={`${video.area}の風景(イメージ)`} />
      {src?.youtubeId ? (
        <button type="button" onClick={() => setPlaying(true)} className="absolute inset-0 grid place-items-center" aria-label="動画を再生">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-black/60 text-white ring-2 ring-white/70">
            <Icon name="play" fill className="ml-1 h-7 w-7" />
          </span>
        </button>
      ) : src ? (
        <a href={src.url} target="_blank" rel="noopener" className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white">
          <Icon name="play" fill className="h-3.5 w-3.5" />
          {LABEL[src.platform]}で見る
        </a>
      ) : null}
    </div>
  );
}
