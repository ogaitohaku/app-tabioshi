import type { Metadata } from "next";
import Link from "next/link";
import { CopyTripButton } from "@/components/CopyTripButton";
import { Icon } from "@/components/Icon";
import { Visual } from "@/components/Visual";
import { allVideos, getCreator, stayOfVideo } from "@/lib/content";
import { yen } from "@/lib/format";

export const metadata: Metadata = { title: "旅ショート" };

/** TikTok のように1本ずつ縦にスワイプする。白地で、画像は暗く重ねず、文字は画像の外に置く(OGA 統一ルール B) */
export default function Shorts() {
  const videos = allVideos();
  return (
    <main className="fixed inset-x-0 top-0 bottom-[calc(57px+env(safe-area-inset-bottom,0px))] mx-auto max-w-[480px] snap-y snap-mandatory overflow-y-auto bg-paper">
      <h1 className="sr-only">旅ショート</h1>
      {videos.map((v, i) => {
        const c = getCreator(v.creatorId);
        const stay = stayOfVideo(v.id);
        return (
          <article
            key={v.id}
            className="flex h-full snap-start snap-always flex-col gap-2.5 px-3 pt-[calc(env(safe-area-inset-top,0px)+10px)] pb-3"
            aria-label={v.title}
          >
            <div className="flex items-center justify-between gap-3">
              <Link href={`/creators/${v.creatorId}`} className="flex min-w-0 items-center gap-2">
                <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-line">{c && <Visual visual={c.visual} />}</span>
                <span className="truncate text-sm font-bold">{c?.name}</span>
              </Link>
              <span className="num shrink-0 text-xs text-mute">
                {i + 1} / {videos.length}
              </span>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-line">
              <Visual visual={v.visual} alt={`${v.area}の風景(イメージ)`} />
              <span className="absolute top-2.5 left-2.5 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-ink">{v.area}</span>
              <div className="absolute right-2.5 bottom-2.5 flex flex-col gap-2.5">
                <Link
                  href={`/trips/${v.id}`}
                  aria-label="旅程を見る"
                  className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink ring-1 ring-line"
                >
                  <Icon name="map" className="h-5 w-5" />
                </Link>
                {v.source && (
                  <a
                    href={v.source.url}
                    target="_blank"
                    rel="noopener"
                    aria-label="元の動画を見る"
                    className="grid h-11 w-11 place-items-center rounded-full bg-white text-shu ring-1 ring-line"
                  >
                    <Icon name="play" fill className="ml-0.5 h-5 w-5" />
                  </a>
                )}
              </div>
            </div>

            <p className="line-clamp-2 text-sm leading-relaxed">{v.caption}</p>
            {stay?.stay && (
              <Link href={`/places/${stay.id}`} className="flex items-center gap-3 rounded-xl border border-line bg-card p-2">
                <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg">
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
            <div className="[&>button]:w-full">
              <CopyTripButton videoId={v.id} />
            </div>
          </article>
        );
      })}
    </main>
  );
}
