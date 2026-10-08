import type { Metadata } from "next";
import Link from "next/link";
import { CopyTripButton } from "@/components/CopyTripButton";
import { Icon } from "@/components/Icon";
import { Visual } from "@/components/Visual";
import { allVideos, getCreator, stayOfVideo } from "@/lib/content";
import { yen } from "@/lib/format";

export const metadata: Metadata = { title: "旅ショート" };

export default function Shorts() {
  return (
    <main className="flex flex-col gap-8 px-4 pt-[calc(env(safe-area-inset-top,0px)+16px)] pb-10">
      <header>
        <h1 className="text-xl font-bold">旅ショート</h1>
        <p className="text-xs text-mute">推しの旅を、1本ずつ見て予約まで</p>
      </header>
      {allVideos().map((v) => {
        const c = getCreator(v.creatorId);
        const stay = stayOfVideo(v.id);
        return (
          <article key={v.id} className="flex flex-col gap-3 border-b border-line pb-8 last:border-b-0" aria-label={v.title}>
            <div className="flex items-center justify-between gap-3">
              <Link href={`/creators/${v.creatorId}`} className="flex min-w-0 items-center gap-2">
                <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-line">{c && <Visual visual={c.visual} />}</span>
                <span className="truncate font-bold">{c?.name}</span>
              </Link>
              <span className="shrink-0 rounded-full bg-wash px-2.5 py-1 text-xs font-bold text-ink2 ring-1 ring-line">{v.area}</span>
            </div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-line">
              <Visual visual={v.visual} alt={`${v.area}の風景(イメージ)`} />
            </div>
            <p className="text-sm leading-relaxed text-ink2">{v.caption}</p>
            {v.source && (
              <a href={v.source.url} target="_blank" rel="noopener" className="inline-flex w-fit items-center gap-1 text-xs text-ink2 underline">
                元の動画を見る <Icon name="external" className="h-3 w-3" />
              </a>
            )}
            {stay?.stay && (
              <Link href={`/places/${stay.id}`} className="flex items-center gap-3 rounded-xl border border-line bg-card p-2.5">
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                  <Visual visual={stay.visual} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{stay.name}</span>
                  <span className="block text-xs text-mute">
                    {stay.stay.kind} ・ 1人 <span className="num">{yen(stay.stay.pricePerNight / 2)}</span>〜
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-shu px-3 py-2 text-xs font-bold text-white">空室を見る</span>
              </Link>
            )}
            <div className="flex gap-2">
              <CopyTripButton videoId={v.id} />
              <Link href={`/trips/${v.id}`} className="inline-flex h-11 items-center rounded-full px-4 text-sm font-bold ring-1 ring-line">
                旅程を見る
              </Link>
            </div>
          </article>
        );
      })}
    </main>
  );
}
