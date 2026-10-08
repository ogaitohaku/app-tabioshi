import Link from "next/link";
import type { Place, Video } from "@/data/types";
import { CATEGORY_LABEL, getCreator, IS_SAMPLE, placesInVideo, tripCostPerPerson } from "@/lib/content";
import { yen } from "@/lib/format";
import { Icon, type IconName } from "./Icon";
import { Visual } from "./Visual";

export const CATEGORY_ICON: Record<Place["category"], IconName> = { stay: "bed", food: "food", gift: "gift", spot: "spot" };

/** お金をもらって載せているものに必ず付ける印 */
export function PrBadge() {
  return (
    <span className="rounded border border-mute/60 px-1 text-xs leading-4 font-bold text-mute" title="掲載料を受け取っています">
      PR
    </span>
  );
}

export function SampleNote({ className = "" }: { className?: string }) {
  if (!IS_SAMPLE) return null;
  return <p className={`text-xs leading-relaxed text-mute ${className}`}>いまはサンプルデータです。人物・宿・お店・料金・口コミは架空のものです。</p>;
}

export function SectionHead({ title, sub, href, more = "すべて" }: { title: string; sub?: string; href?: string; more?: string }) {
  return (
    <div className="flex items-end justify-between gap-3 px-4">
      <div className="min-w-0">
        <h2 className="text-lg font-bold">{title}</h2>
        {sub && <p className="text-xs text-mute">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="shrink-0 text-xs font-bold text-shu">
          {more}
        </Link>
      )}
    </div>
  );
}

export function Stars({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 font-bold">
      <Icon name="star" fill className="h-3.5 w-3.5 text-[#E9A23B]" />
      <span className="num">{score.toFixed(1)}</span>
    </span>
  );
}

/** 旅(動画)のカード */
export function TripCard({ video, wide = false }: { video: Video; wide?: boolean }) {
  const c = getCreator(video.creatorId);
  const n = placesInVideo(video.id).length;
  return (
    <Link href={`/trips/${video.id}`} className={`block ${wide ? "w-full" : "w-64"}`}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-line">
        <Visual visual={video.visual} />
        <span className="absolute top-2 left-2 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-ink">{video.area}</span>
        <span className="absolute right-2 bottom-2 rounded-full bg-white px-2 py-0.5 text-xs font-bold">立ち寄り{n}か所</span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-snug font-bold">{video.title}</p>
      <p className="mt-0.5 text-xs text-mute">
        {c?.name} ・ 1人 <span className="num">{yen(tripCostPerPerson(video.id))}</span>〜
      </p>
    </Link>
  );
}

/** 立ち寄り先の1行 */
export function PlaceRow({ place, index }: { place: Place; index?: number }) {
  return (
    <Link href={`/places/${place.id}`} className="flex gap-3 rounded-xl border border-line bg-card p-2.5">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-line">
        <Visual visual={place.visual} />
        {index !== undefined && (
          <span className="absolute top-1 left-1 grid h-5 w-5 place-items-center rounded-full bg-ink text-xs font-bold text-white">{index + 1}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-xs font-bold text-mute">
          <Icon name={CATEGORY_ICON[place.category]} className="h-3.5 w-3.5" />
          {CATEGORY_LABEL[place.category]}
          {place.sponsored && <PrBadge />}
        </p>
        <p className="truncate font-bold">{place.name}</p>
        <p className="text-xs text-ink2">{place.stay ? `1泊 ${yen(place.stay.pricePerNight / 2)}〜/人` : place.priceLabel}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-mute">「{place.creatorWord}」</p>
      </div>
    </Link>
  );
}
