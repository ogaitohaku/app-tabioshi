import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackBar } from "@/components/BackBar";
import { BookingButton, BookingDisclosure } from "@/components/BookingButton";
import { CATEGORY_ICON, PrBadge, SampleNote, Stars } from "@/components/bits";
import { Icon } from "@/components/Icon";
import { SavePlaceButton, VisitedButton } from "@/components/PlaceActions";
import { ShareButton } from "@/components/ShareButton";
import { SharedBanner } from "@/components/SharedBanner";
import { SourceCredit } from "@/components/SourceCredit";
import { Visual } from "@/components/Visual";
import { allPlaces, CATEGORY_LABEL, getCreator, getPlace, getVideo, IS_SAMPLE } from "@/lib/content";
import { googleMapsPlaceUrl } from "@/lib/geo";
import { SITE_URL } from "@/lib/site";
import { timecode, yen } from "@/lib/format";

export const generateStaticParams = () => allPlaces().map((p) => ({ id: p.id }));

export async function generateMetadata({ params }: PageProps<"/places/[id]">): Promise<Metadata> {
  const p = getPlace((await params).id);
  return { title: p?.name, description: p ? `${p.address}。「${p.creatorWord}」` : undefined };
}

export default async function PlacePage({ params }: PageProps<"/places/[id]">) {
  const p = getPlace((await params).id);
  if (!p) notFound();
  const v = getVideo(p.videoId);
  const c = v && getCreator(v.creatorId);
  const s = p.stay;

  return (
    <main className="pb-10">
      {s && !IS_SAMPLE && (
        <script
          type="application/ld+json"
          // 検索エンジン向けの宿の情報(サンプルデータの間は出さない)
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LodgingBusiness",
              name: p.name,
              address: p.address,
              url: `${SITE_URL}/places/${p.id}`,
              geo: { "@type": "GeoCoordinates", longitude: p.lngLat[0], latitude: p.lngLat[1] },
              aggregateRating: { "@type": "AggregateRating", ratingValue: s.score, reviewCount: s.reviewCount },
            }).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <BackBar />
      <SharedBanner kind="place" />
      {/* 写真は端まで広げず、左右 16px の内側に 4:3 で置く(統一ルール B) */}
      <div className="px-4 pt-3">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-line">
          <Visual visual={p.visual} alt={`${p.name}(イメージ)`} />
          {!p.visual.photo && <span className="absolute bottom-2 left-2 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-ink2">イメージ</span>}
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pt-4">
        {/* 1. 地名 → 名前 */}
        <div className="flex flex-col gap-1">
          <p className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-ink2">
            <Icon name={CATEGORY_ICON[p.category]} className="h-4 w-4" />
            {s ? s.kind : CATEGORY_LABEL[p.category]} ・ {p.address}
            {p.sponsored && <PrBadge />}
          </p>
          <div className="flex items-start justify-between gap-3">
            <h1 className="min-w-0 text-2xl leading-snug font-bold">{p.name}</h1>
            <ShareButton title={p.name} path={`/places/${p.id}`} kind="place" iconOnly />
          </div>
          {s && (
            <p className="flex items-center gap-2 text-sm">
              <Stars score={s.score} />
              <span className="text-mute">口コミ {s.reviewCount}件</span>
            </p>
          )}
        </div>

        {/* 2. 行き方・料金(決めるのに要る数字を名前のすぐ下に) */}
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line text-sm" data-place-facts>
          {(s
            ? [
                ["料金の目安", `${yen(s.pricePerNight)}〜`, `1泊・2名(1人 ${yen(s.pricePerNight / 2)}〜)`],
                ["行き方", s.access, ""],
              ]
            : [
                ["料金の目安", p.priceLabel, ""],
                ["状態", p.status, ""],
              ]
          ).map(([k, val, sub]) => (
            <div key={k} className="flex flex-col bg-card p-3">
              <dt className="text-xs text-mute">{k}</dt>
              <dd className="num leading-snug font-bold">{val}</dd>
              {sub && <dd className="num text-xs text-ink2">{sub}</dd>}
            </div>
          ))}
        </dl>

        {/* 3. 操作。主な操作(行きたい)を1つだけ朱で、ほかは白 */}
        <div className="flex flex-col gap-2">
          <div className="flex [&>button]:w-full">
            <SavePlaceButton placeId={p.id} main />
          </div>
          <div className="grid grid-cols-2 gap-2 [&>button]:w-full">
            <VisitedButton placeId={p.id} />
            <a href={googleMapsPlaceUrl(p.lngLat)} target="_blank" rel="noopener" className="btn btn-sub">
              <Icon name="map" className="h-4 w-4" />
              地図で開く
            </a>
          </div>
        </div>

        {/* 4. 推しのひとこと(朱は動画へのリンクの文字だけ) */}
        {c && v && (
          <Link href={`/trips/${v.id}`} className="flex gap-3 rounded-xl bg-wash p-3">
            <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
              <Visual visual={c.visual} />
            </span>
            <span className="min-w-0 text-sm">
              <span className="block text-xs font-bold text-ink2">{c.name}のひとこと</span>
              <span className="block leading-relaxed">「{p.creatorWord}」</span>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-shu">
                動画の {timecode(p.at)} ごろ・旅程を見る
                <Icon name="arrow" className="h-3.5 w-3.5" />
              </span>
            </span>
          </Link>
        )}
      </div>

      {/* 5. 予約先(宿だけ)。どこで予約するかを、ボタンのすぐ下に一行で */}
      {s && (
        <section aria-labelledby="booking" className="mx-4 mt-6 flex flex-col gap-3 rounded-xl border border-line bg-card p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="booking" className="font-bold">
              予約
            </h2>
            <span className="text-sm text-ink2">{s.meal}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {s.tags.map((t) => (
              <span key={t} className="rounded-full bg-wash px-2.5 py-1 text-xs font-bold text-ink2">
                {t}
              </span>
            ))}
          </div>
          <BookingButton stay={s} placeId={p.id} />
          <BookingDisclosure stay={s} />
        </section>
      )}

      {/* 6. 出典 */}
      {v && (
        <section aria-labelledby="source" className="mt-6 flex flex-col gap-2 px-4">
          <h2 id="source" className="text-sm font-bold">
            この情報の出どころ
          </h2>
          <SourceCredit video={v} creator={c} place={p} sample={IS_SAMPLE} />
        </section>
      )}

      {s && (
        <section className="mt-8 flex flex-col gap-3 px-4">
          <h2 className="text-lg font-bold">口コミ</h2>
          {s.reviews.map((r) => (
            <div key={r.by} className="rounded-xl border border-line bg-card p-3 text-sm">
              <p className="flex flex-wrap items-center gap-2 font-bold">
                {r.by}
                {r.fromVideo && <span className="rounded bg-shu-soft px-1.5 text-xs text-shu">推しの動画を見て予約</span>}
                <Stars score={r.score} />
              </p>
              <p className="mt-1 leading-relaxed text-ink2">{r.text}</p>
            </div>
          ))}
        </section>
      )}

      <SampleNote className="mt-8 px-4" />
    </main>
  );
}
