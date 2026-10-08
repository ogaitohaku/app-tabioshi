import Link from "next/link";
import { DailyQuiz } from "@/components/DailyQuiz";
import { FirstVisit } from "@/components/FirstVisit";
import { ForYou } from "@/components/ForYou";
import { HowItWorks } from "@/components/HowItWorks";
import { TypeEntry } from "@/components/TypeEntry";
import { Icon } from "@/components/Icon";
import { PlaceRow, SampleNote, SectionHead, TripCard } from "@/components/bits";
import { Visual } from "@/components/Visual";
import {
  allAreas,
  allCreators,
  allQuizzes,
  allTravelTypes,
  allVideos,
  getCreator,
  IS_SAMPLE,
  stays,
  THEME_LABEL,
  tripCostPerPerson,
  videosByCreator,
  videosInArea,
} from "@/lib/content";

export default function Home() {
  const videos = allVideos();
  return (
    <main className="flex flex-col gap-9 pb-10">
      <header className="flex flex-col gap-4 px-4 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-shu text-white">
            <Icon name="pin" className="h-4 w-4" />
          </span>
          タビオシ
        </div>
        <h1 className="text-[28px] leading-tight font-bold">
          推しの旅を、
          <br />
          そのまま予約。
        </h1>
        <p className="text-sm leading-relaxed text-ink2">旅インフルエンサーの動画に出てきた宿・お店・回った順番を、ボタンひとつで自分の旅にできます。</p>
        <Link href="/shorts" className="flex h-12 items-center justify-center gap-2 rounded-full bg-shu font-bold text-white">
          <Icon name="play" fill className="h-4 w-4" />
          旅ショートを見る
        </Link>
      </header>

      <FirstVisit sample={IS_SAMPLE} />

      <section aria-labelledby="how" className="mx-4 flex flex-col gap-2">
        <h2 id="how" className="sr-only">
          使い方
        </h2>
        <HowItWorks compact />
        <p className="text-xs leading-relaxed text-mute">予約と支払いは、移動先の予約サイトで行います。タビオシでは受け付けていません。</p>
      </section>

      <TypeEntry names={Object.fromEntries(allTravelTypes().map((t) => [t.code, t.name]))} />

      <ForYou
        trips={videos.map((v) => ({ id: v.id, themes: v.themes, cost: tripCostPerPerson(v.id) }))}
        cards={Object.fromEntries(videos.map((v) => [v.id, <TripCard key={v.id} video={v} />]))}
        themeLabel={THEME_LABEL}
      />

      <section className="flex flex-col gap-3">
        <SectionHead title="エリアから探す" sub="推しが歩いた街のガイド" />
        <div className="grid grid-cols-2 gap-2.5 px-4">
          {allAreas().map((a) => (
            <Link key={a.id} href={`/areas/${a.id}`} className="flex flex-col overflow-hidden rounded-xl border border-line bg-card">
              <span className="relative block aspect-[4/3] bg-line">
                <Visual visual={a.visual} />
              </span>
              <span className="px-3 py-2">
                <span className="block text-sm font-bold">{a.name}</span>
                <span className="block text-xs text-mute">推しの旅 {videosInArea(a.id).length}本</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHead title="旅をまるごとコピー" sub="宿・お店・回る順番がそのまま旅プランに" />
        <div className="hscroll">
          {videos.map((v) => (
            <TripCard key={v.id} video={v} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHead title="推しの旅人" sub="フォローすると新しい旅が届きます" />
        <div className="hscroll">
          {allCreators().map((c) => (
            <Link key={c.id} href={`/creators/${c.id}`} className="flex w-36 flex-col items-center gap-2 rounded-xl border border-line bg-card p-3 text-center">
              <span className="h-16 w-16 overflow-hidden rounded-full ring-2 ring-shu ring-offset-2">
                <Visual visual={c.visual} />
              </span>
              <span className="text-sm leading-tight font-bold">{c.name}</span>
              <span className="text-xs text-mute">
                {c.genre} ・ 旅{videosByCreator(c.id).length}本
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHead title="推しが泊まった宿" sub="動画と同じ部屋・同じプラン" />
        <div className="flex flex-col gap-2.5 px-4">
          {stays().map((p) => (
            <PlaceRow key={p.id} place={p} />
          ))}
        </div>
      </section>

      <DailyQuiz quizzes={allQuizzes()} names={Object.fromEntries(videos.map((v) => [v.id, getCreator(v.creatorId)?.name]))} />

      <footer className="flex flex-col gap-2 px-4">
        <nav className="flex flex-wrap gap-x-4 text-xs font-bold text-ink2 [&>a]:inline-flex [&>a]:min-h-11 [&>a]:items-center">
          <Link href="/welcome" className="underline">
            はじめての方へ
          </Link>
          <Link href="/about" className="underline">
            タビオシについて・予約のしくみ
          </Link>
          <Link href="/terms" className="underline">
            利用規約
          </Link>
          <Link href="/privacy" className="underline">
            プライバシーポリシー
          </Link>
          <Link href="/tokushoho" className="underline">
            特定商取引法に基づく表示
          </Link>
        </nav>
        <SampleNote />
      </footer>
    </main>
  );
}
