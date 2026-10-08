"use client";
import { useSavedTrips } from "@/lib/saved";
import { track } from "@/lib/track";
import { Icon } from "./Icon";

export function CopyTripButton({ videoId }: { videoId: string }) {
  const { has, toggle } = useSavedTrips();
  const saved = has(videoId);
  const base = "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold";
  const look = saved ? "bg-card text-ink ring-1 ring-line" : "bg-ink text-white";
  return (
    <button
      type="button"
      onClick={() => {
        if (!saved) track("copy_trip", { trip: videoId });
        toggle(videoId);
      }}
      aria-pressed={saved}
      className={`${base} ${look}`}
    >
      <Icon name={saved ? "check" : "copy"} className="h-4 w-4" />
      {saved ? "マイ旅にコピー済み" : "この旅をまるごとコピー"}
    </button>
  );
}
