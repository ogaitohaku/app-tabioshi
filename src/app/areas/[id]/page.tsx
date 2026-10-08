import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackBar } from "@/components/BackBar";
import { PlaceRow, SampleNote, TripCard } from "@/components/bits";
import { QuizCard } from "@/components/QuizCard";
import { ShareButton } from "@/components/ShareButton";
import { Visual } from "@/components/Visual";
import type { PlaceCategory } from "@/data/types";
import { allAreas, CATEGORY_LABEL, getArea, getCreator, learnFor, placesInArea, quizzesFor, videosInArea } from "@/lib/content";

export const generateStaticParams = () => allAreas().map((a) => ({ id: a.id }));

export async function generateMetadata({ params }: PageProps<"/areas/[id]">): Promise<Metadata> {
  const a = getArea((await params).id);
  return { title: a && `${a.name}の旅`, description: a?.intro };
}

const ORDER: PlaceCategory[] = ["stay", "food", "gift", "spot"];

export default async function AreaPage({ params }: PageProps<"/areas/[id]">) {
  const a = getArea((await params).id);
  if (!a) notFound();
  const vids = videosInArea(a.id);
  const places = placesInArea(a.id);
  const learn = vids.flatMap((v) => learnFor(v.id)?.cards ?? []);
  const quiz = vids.flatMap((v) => quizzesFor(v.id).map((q) => ({ q, by: getCreator(v.creatorId)?.name })))[0];

  return (
    <main className="pb-10">
      <div className="relative aspect-[16/10] bg-line">
        <BackBar overlay />
        <Visual visual={a.visual} alt={`${a.name}の風景(イメージ)`} />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 pt-10 pb-4 text-white">
          <p className="text-xs font-bold opacity-80">エリアガイド</p>
          <h1 className="text-2xl font-black">{a.name}</h1>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 pt-4">
        <p className="text-sm leading-relaxed text-ink2">{a.intro}</p>
        <div className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3 text-sm">
          <span>
            推しの旅 <b className="num">{vids.length}</b>本 ・ スポット <b className="num">{places.length}</b>か所
          </span>
          <ShareButton title={`${a.name}の旅`} path={`/areas/${a.id}`} kind="area" />
        </div>
      </div>

      <section className="mt-8 flex flex-col gap-3">
        <h2 className="px-4 text-lg font-black">この街の推しの旅</h2>
        <div className="hscroll">
          {vids.map((v) => (
            <TripCard key={v.id} video={v} />
          ))}
        </div>
      </section>

      {ORDER.map((cat) => {
        const list = places.filter((p) => p.category === cat);
        if (!list.length) return null;
        return (
          <section key={cat} className="mt-8 flex flex-col gap-2.5 px-4">
            <h2 className="text-lg font-black">{CATEGORY_LABEL[cat]}</h2>
            {list.map((p) => (
              <PlaceRow key={p.id} place={p} />
            ))}
          </section>
        );
      })}

      {learn.length > 0 && (
        <section className="mt-8 flex flex-col gap-3">
          <h2 className="px-4 text-lg font-black">行く前に知っておくと楽しいこと</h2>
          <div className="hscroll">
            {learn.map((card, i) => (
              <div key={card.title} className="w-64 rounded-2xl border border-line bg-card p-4">
                <p className="text-[11px] font-bold text-sea">豆知識 {i + 1}</p>
                <p className="mt-1 leading-snug font-bold">{card.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink2">{card.body}</p>
              </div>
            ))}
          </div>
          {quiz && (
            <div className="px-4">
              <QuizCard quiz={quiz.q} creatorName={quiz.by} />
            </div>
          )}
        </section>
      )}

      <SampleNote className="mt-8 px-4" />
    </main>
  );
}
