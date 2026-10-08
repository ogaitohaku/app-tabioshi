"use client";
import Link from "next/link";
import type { Video } from "@/data/types";
import { TripCard } from "@/components/bits";
import { Icon } from "@/components/Icon";
import { useSavedTrips } from "@/lib/saved";

export function SavedTrips({ videos }: { videos: Video[] }) {
  const { ids } = useSavedTrips();
  const saved = ids.map((id) => videos.find((v) => v.id === id)).filter((v): v is Video => Boolean(v));
  if (!saved.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-card px-6 py-10 text-center">
        <Icon name="bookmark" className="h-8 w-8 text-mute" />
        <p className="font-bold">まだコピーした旅はありません</p>
        <p className="text-sm text-ink2">旅ショートで気になった旅を見つけたら、「この旅をまるごとコピー」を押してください。</p>
        <Link href="/shorts" className="mt-1 inline-flex h-11 items-center rounded-full bg-shu px-5 text-sm font-bold text-white">
          旅ショートを見る
        </Link>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      {saved.map((v) => (
        <TripCard key={v.id} video={v} wide />
      ))}
      <p className="text-xs text-mute">コピーした旅は、いまはこの端末の中だけに保存されます。</p>
    </div>
  );
}
