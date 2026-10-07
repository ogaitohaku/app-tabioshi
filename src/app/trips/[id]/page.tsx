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
      <div className="relative">
        <BackBar overlay />
        <VideoPlayer video={v} />
        {area && (
          <Link href={`/areas/${area.id}`} className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-bold text-white">
            {v.area}
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-4 px-4 pt-4">
        <Link href={`/creators/${v.creatorId}`} className="flex items-center gap-2 text-sm font-bold">
          <span className="h-8 w-8 overflow-hidden rounded-full">{c && <Visual visual={c.visual} />}</span>
          {c?.name}
          <span className="text-xs font-normal text-mute">
            ・ {v.postedAt} ・ {v.views}再生
          </span>
        </Link>
        <h1 className="text-xl leading-snug font-black">{v.title}</h1>
        <p className="text-sm leading-relaxed text-ink2">{v.caption}</p>
        <div className="flex items-center justify-between rounded-2xl bg-shu-soft px-4 py-3">
          <span className="text-xs font-bold text-ink2">この旅の1人あたりの目安</span>
          <span className="num text-lg font-black">{yen(tripCostPerPerson(v.id))}〜</span>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 [&>button]:w-full">
            <CopyTripButton videoId={v.id} />
          </div>
          <ShareButton title={v.title} path={`/trips/${v.id}`} kind="trip" />
        </div>
      </div>

      <section className="mt-8 flex flex-col gap-3 px-4">
        <h2 className="text-lg font-black">旅程(動画に出てくる順)</h2>
        <RouteMap stops={stops} />
        <ol className="flex flex-col gap-2.5">
          {stops.map((p, i) => (
            <li key={p.id} className="flex flex-col gap-1">
              <span className="num text-[11px] font-bold text-mute">動画の {timecode(p.at)} ごろ</span>
              <PlaceRow place={p} index={i} />
            </li>
          ))}
        </ol>
      </section>

      {stay?.stay && (
        <section className="mx-4 mt-8 flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
          <p className="text-sm font-bold">推しが泊まった宿:{stay.name}</p>
          <BookingButton stay={stay.stay} placeId={stay.id} />
          <BookingDisclosure />
        </section>
      )}

      {learn && (
        <section className="mt-8 flex flex-col gap-3">
          <h2 className="px-4 text-lg font-black">{learn.title}</h2>
          <div className="hscroll">
            {learn.cards.map((card, i) => (
              <div key={card.title} className="w-64 rounded-2xl border border-line bg-card p-4">
                <p className="text-[11px] font-bold text-sea">豆知識 {i + 1}</p>
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
