"use client";
import Link from "next/link";
import { useMyPlaces } from "@/lib/my-places";
import { useSavedTrips } from "@/lib/saved";
import { Icon } from "./Icon";

/** 保存した旅や場所がある人に、ホームの上の方で「マイ旅の続き」を出す(次に開く理由) */
export function ContinueTrip({ placesByTrip }: { placesByTrip: Record<string, string[]> }) {
  const { ids } = useSavedTrips();
  const [mine] = useMyPlaces();
  const all = new Set([...Object.keys(mine.saved), ...ids.flatMap((id) => placesByTrip[id] ?? [])]);
  if (!all.size) return null;
  const visited = [...all].filter((id) => mine.visited[id]).length;
  return (
    <Link href="/me" className="mx-4 flex items-center gap-3 rounded-xl border border-line bg-card p-4" aria-label="マイ旅の続き">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-shu-soft text-shu">
        <Icon name="bookmark" className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">マイ旅の続き</span>
        <span className="num block text-sm text-ink2">
          保存した場所 {all.size}か所 ・ 行った {visited}か所
        </span>
        <span className="block text-xs text-mute">旅先では、近い順に並べて見返せます</span>
      </span>
      <Icon name="arrow" className="h-4 w-4 shrink-0 text-mute" />
    </Link>
  );
}
