import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackBar } from "@/components/BackBar";
import { BookingButton, BookingDisclosure } from "@/components/BookingButton";
import { CopyTripButton } from "@/components/CopyTripButton";
import { PlaceRow, SampleNote } from "@/components/bits";
import { QuizCard } from "@/components/QuizCard";
import { RouteMap } from "@/components/RouteMap";
import { ShareButton } from "@/components/ShareButton";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Visual } from "@/components/Visual";
import { allVideos, getArea, getCreator, getVideo, learnFor, placesInVideo, quizzesFor, stayOfVideo, tripCostPerPerson } from "@/lib/content";
import { timecode, yen } from "@/lib/format";

export const generateStaticParams = () => allVideos().map((v) => ({ id: v.id }));

export async function generateMetadata({ params }: PageProps<"/trips/[id]">): Promise<Metadata> {
  const v = getVideo((await params).id);
  return { title: v?.title, description: v?.caption };
}

export default async function Trip({ params }: PageProps<"/trips/[id]">) {
  const v = getVideo((await params).id);
  if (!v) notFound();
  const c = getCreator(v.creatorId);
  const stops = placesInVideo(v.id);
  const stay = stayOfVideo(v.id);
  const learn = learnFor(v.id);
  const quizzes = quizzesFor(v.id);
  const area = getArea(v.areaId);

  return (
    <main className="pb-10">
      <BackBar />
      <VideoPlayer video={v} />

      <div className="flex flex-col gap-4 px-4 pt-4">
        {area && (
          <Link
            href={`/areas/${area.id}`}
            className="inline-flex h-11 w-fit items-center rounded-full bg-wash px-4 text-xs font-bold text-ink2 ring-1 ring-line"
          >
            {v.area}のエリアガイド
          </Link>
        )}
        <Link href={`/creators/${v.creatorId}`} className="flex items-center gap-2 text-sm font-bold">
          <span className="h-8 w-8 overflow-hidden rounded-full">{c && <Visual visual={c.visual} />}</span>
          {c?.name}
          <span className="text-xs font-normal text-mute">
            ・ {v.postedAt} ・ {v.views}再生
          </span>
        </Link>
        <h1 className="text-xl leading-snug font-bold">{v.title}</h1>
        <p className="text-sm leading-relaxed text-ink2">{v.caption}</p>
        <div className="flex items-center justify-between rounded-xl bg-shu-soft px-4 py-3">
          <span className="text-xs font-bold text-ink2">この旅の1人あたりの目安</span>
          <span className="num text-lg font-bold">{yen(tripCostPerPerson(v.id))}〜</span>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 [&>button]:w-full">
            <CopyTripButton videoId={v.id} />
          </div>
          <ShareButton title={v.title} path={`/trips/${v.id}`} kind="trip" />
        </div>
        <p className="-mt-2 text-xs text-mute">
          コピーした旅は
          <Link href="/me" className="font-bold text-shu underline">
            マイ旅
          </Link>
          に保存されます(いまはこの端末の中だけ)。
        </p>
      </div>

      <section className="mt-8 flex flex-col gap-3 px-4">
        <h2 className="text-lg font-bold">旅程(動画に出てくる順)</h2>
        <RouteMap stops={stops} />
        <ol className="flex flex-col gap-2.5">
          {stops.map((p, i) => (
            <li key={p.id} className="flex flex-col gap-1">
              <span className="num text-xs font-bold text-mute">動画の {timecode(p.at)} ごろ</span>
              <PlaceRow place={p} index={i} />
            </li>
          ))}
        </ol>
      </section>

      {stay?.stay && (
        <section className="mx-4 mt-8 flex flex-col gap-3 rounded-xl border border-line bg-card p-4">
          <p className="text-sm font-bold">推しが泊まった宿:{stay.name}</p>
          <BookingButton stay={stay.stay} placeId={stay.id} />
          <BookingDisclosure />
        </section>
      )}

      {learn && (
        <section className="mt-8 flex flex-col gap-3">
          <h2 className="px-4 text-lg font-bold">{learn.title}</h2>
          <div className="hscroll">
            {learn.cards.map((card, i) => (
              <div key={card.title} className="w-64 rounded-xl border border-line bg-card p-4">
                <p className="text-xs font-bold text-ink">豆知識 {i + 1}</p>
                <p className="mt-1 leading-snug font-bold">{card.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink2">{card.body}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 px-4">
            {quizzes.map((q) => (
              <QuizCard key={q.id} quiz={q} creatorName={c?.name} />
            ))}
          </div>
        </section>
      )}

      <SampleNote className="mt-8 px-4" />
    </main>
  );
}
