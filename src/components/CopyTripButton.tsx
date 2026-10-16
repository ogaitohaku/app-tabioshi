"use client";
import { useSavedTrips } from "@/lib/saved";
import { track } from "@/lib/track";
import { Icon } from "./Icon";

export function CopyTripButton({ videoId }: { videoId: string }) {
  const { has, toggle } = useSavedTrips();
  const saved = has(videoId);
  return (
    <button
      type="button"
      onClick={() => {
        if (!saved) track("copy_trip", { trip: videoId });
        toggle(videoId);
      }}
      aria-pressed={saved}
      className={`btn ${saved ? "btn-on" : "btn-main"}`}
    >
      <Icon name={saved ? "check" : "copy"} className="h-4 w-4" />
      {saved ? "マイ旅にコピー済み" : "この旅をまるごとコピー"}
    </button>
  );
}
