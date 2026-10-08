import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackBar } from "@/components/BackBar";
import { BookingButton, BookingDisclosure } from "@/components/BookingButton";
import { CATEGORY_ICON, PrBadge, SampleNote, Stars } from "@/components/bits";
import { Icon } from "@/components/Icon";
import { ShareButton } from "@/components/ShareButton";
import { Visual } from "@/components/Visual";
import { allPlaces, CATEGORY_LABEL, getCreator, getPlace, getVideo, IS_SAMPLE } from "@/lib/content";
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
      <div className="relative aspect-[4/3] bg-line">
        <BackBar overlay />
        <Visual visual={p.visual} alt={`${p.name}(イメージ)`} />
      </div>

      <div className="flex flex-col gap-3 px-4 pt-4">
        <p className="flex items-center gap-1.5 text-xs font-bold text-mute">
          <Icon name={CATEGORY_ICON[p.category]} className="h-4 w-4" />
          {s ? s.kind : CATEGORY_LABEL[p.category]} ・ {p.address}
          {p.sponsored && <PrBadge />}
        </p>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-black">{p.name}</h1>
          <ShareButton title={p.name} path={`/places/${p.id}`} kind="place" />
        </div>
        {s && (
          <p className="flex items-center gap-2 text-sm">
            <Stars score={s.score} />
            <span className="text-mute">口コミ {s.reviewCount}件</span>
          </p>
        )}

        {c && v && (
          <Link href={`/trips/${v.id}`} className="flex gap-3 rounded-2xl bg-shu-soft p-3">
            <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
              <Visual visual={c.visual} />
            </span>
            <span className="min-w-0 text-sm">
              <span className="block font-bold">{c.name}のひとこと</span>
              <span className="block leading-relaxed text-ink2">「{p.creatorWord}」</span>
              <span className="mt-1 block text-xs font-bold text-shu">
                {v.title}({timecode(p.at)}ごろ)
              </span>
            </span>
          </Link>
        )}
      </div>

      {s ? (
        <section className="mx-4 mt-6 flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold">{s.meal}</span>
            <span>
              <span className="num text-xl font-black">{yen(s.pricePerNight)}</span>
              <span className="text-xs text-mute"> 〜 / 1泊・2名</span>
            </span>
          </div>
          <p className="text-xs text-mute">1人あたり {yen(s.pricePerNight / 2)}〜 ・ {s.access}</p>
          <div className="flex flex-wrap gap-1.5">
            {s.tags.map((t) => (
              <span key={t} className="rounded-full bg-paper px-2.5 py-1 text-xs font-bold text-ink2">
                {t}
              </span>
            ))}
          </div>
          <BookingButton stay={s} placeId={p.id} />
          <BookingDisclosure />
        </section>
      ) : (
        <section className="mx-4 mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line text-sm">
          {[
            ["料金の目安", p.priceLabel],
            ["状態", p.status],
          ].map(([k, val]) => (
            <div key={k} className="bg-card p-3">
              <p className="text-[11px] text-mute">{k}</p>
              <p className="font-bold">{val}</p>
            </div>
          ))}
        </section>
      )}

      <p className="mt-3 px-4 text-[11px] text-mute">情報の確認日:{p.checkedAt}</p>

      {s && (
        <section className="mt-8 flex flex-col gap-3 px-4">
          <h2 className="text-lg font-black">口コミ</h2>
          {s.reviews.map((r) => (
            <div key={r.by} className="rounded-2xl border border-line bg-card p-3 text-sm">
              <p className="flex flex-wrap items-center gap-2 font-bold">
                {r.by}
                {r.fromVideo && <span className="rounded bg-shu-soft px-1.5 text-[10px] text-shu">推しの動画を見て予約</span>}
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
