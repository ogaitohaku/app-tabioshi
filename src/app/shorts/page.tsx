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
    <main className="fixed inset-x-0 top-0 bottom-[calc(57px+env(safe-area-inset-bottom,0px))] mx-auto max-w-[480px] snap-y snap-mandatory overflow-y-auto bg-black text-white">
      <h1 className="sr-only">旅ショート</h1>
      {allVideos().map((v) => {
        const c = getCreator(v.creatorId);
        const stay = stayOfVideo(v.id);
        return (
          <article key={v.id} className="relative h-full snap-start snap-always overflow-hidden" aria-label={v.title}>
            <div className="absolute inset-0">
              <Visual visual={v.visual} alt={`${v.area}の風景(イメージ)`} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

            <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,0px)+14px)] text-sm font-bold">
              <span>推しの旅</span>
              <span className="rounded-full bg-black/40 px-2.5 py-1 text-[11px]">{v.area}</span>
            </div>

            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4">
              <Link href={`/creators/${v.creatorId}`} className="flex items-center gap-2">
                <span className="h-9 w-9 overflow-hidden rounded-full ring-2 ring-white">{c && <Visual visual={c.visual} />}</span>
                <span className="font-bold">{c?.name}</span>
              </Link>
              <p className="text-sm leading-relaxed text-white/90">{v.caption}</p>
              {v.source && (
                <a href={v.source.url} target="_blank" rel="noopener" className="inline-flex w-fit items-center gap-1 text-xs text-white/80 underline">
                  元の動画を見る <Icon name="external" className="h-3 w-3" />
                </a>
              )}
              {stay?.stay && (
                <Link href={`/places/${stay.id}`} className="flex items-center gap-3 rounded-2xl bg-white p-2.5 text-ink">
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
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
                <CopyTripButton videoId={v.id} variant="glass" />
                <Link href={`/trips/${v.id}`} className="inline-flex h-11 items-center rounded-full px-4 text-sm font-bold ring-1 ring-white/30">
                  旅程を見る
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </main>
  );
}
