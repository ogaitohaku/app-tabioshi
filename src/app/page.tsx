import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PlaceRow, SampleNote, SectionHead, TripCard } from "@/components/bits";
import { Visual } from "@/components/Visual";
import { allCreators, allVideos, stays, videosByCreator } from "@/lib/content";

export default function Home() {
  const videos = allVideos();
  return (
    <main className="flex flex-col gap-9 pb-10">
      <header className="flex flex-col gap-4 px-4 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
        <div className="flex items-center gap-2 text-lg font-black">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-shu text-white">
            <Icon name="pin" className="h-4 w-4" />
          </span>
          タビオシ
        </div>
        <h1 className="text-[28px] leading-tight font-black">
          推しの旅を、
          <br />
          そのまま予約。
        </h1>
        <p className="text-sm leading-relaxed text-ink2">
          旅インフルエンサーの動画に出てきた宿・お店・回った順番を、ボタンひとつで自分の旅にできます。
        </p>
        <Link href="/shorts" className="flex h-12 items-center justify-center gap-2 rounded-full bg-shu font-bold text-white">
          <Icon name="play" fill className="h-4 w-4" />
          旅ショートを見る
        </Link>
      </header>

      <section aria-labelledby="how" className="mx-4 grid grid-cols-3 rounded-2xl border border-line bg-card">
        <h2 id="how" className="sr-only">
          使い方
        </h2>
        {[
          ["見る", "推しの旅動画を見る"],
          ["写す", "旅をまるごとコピー"],
          ["行く", "同じ宿を予約"],
        ].map(([k, t], i) => (
          <div key={k} className={`px-3 py-3 ${i ? "border-l border-dashed border-line" : ""}`}>
            <p className="text-[10px] font-bold tracking-widest text-mute">STEP {i + 1}</p>
            <p className={`text-sm leading-snug font-black ${i === 2 ? "text-shu" : ""}`}>{t}</p>
          </div>
        ))}
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
            <Link key={c.id} href={`/creators/${c.id}`} className="flex w-36 flex-col items-center gap-2 rounded-2xl border border-line bg-card p-3 text-center">
              <span className="h-16 w-16 overflow-hidden rounded-full ring-2 ring-shu ring-offset-2">
                <Visual visual={c.visual} />
              </span>
              <span className="text-sm leading-tight font-bold">{c.name}</span>
              <span className="text-[11px] text-mute">
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

      <footer className="flex flex-col gap-2 px-4">
        <Link href="/about" className="text-xs font-bold text-ink2 underline">
          タビオシについて・予約のしくみ
        </Link>
        <SampleNote />
      </footer>
    </main>
  );
}
