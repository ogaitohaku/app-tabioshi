import type { Metadata } from "next";
import Link from "next/link";
import { HowItWorks } from "@/components/HowItWorks";
import { Icon } from "@/components/Icon";
import { IS_SAMPLE } from "@/lib/content";

export const metadata: Metadata = {
  title: "はじめての方へ",
  description: "推しの旅を、そのまま予約。動画を見て、旅をまるごとコピーして、マイ旅に保存。予約と支払いは外部の予約サイトで行います。",
};

const FAQ: [string, string][] = [
  [
    "タビオシで予約や支払いはできますか?",
    "できません。タビオシは予約も支払いも受け付けていません。「空室を見る」から楽天トラベルなどの予約サイトへ移動し、そちらで空室・料金・キャンセル条件を確かめて予約します。",
  ],
  [
    "タビオシはどうやって成り立っていますか?",
    "予約サイトから受け取る紹介料と、宿・お店からの掲載料です。紹介リンクを使っても、予約サイトでの料金が上がることはありません。",
  ],
  ["「PR」と書いてあるのは何ですか?", "宿やお店から掲載料を受け取って載せている場所です。表示のないものは、クリエイターが自分で選んで行った場所です。"],
  ["コピーした旅は、ほかのスマホでも見られますか?", "いまは見られません。マイ旅はお使いの端末の中だけに保存されます。ブラウザのデータを消すと消えます。"],
];

export default function Welcome() {
  return (
    <main className="flex flex-col gap-8 px-4 pt-[calc(env(safe-area-inset-top,0px)+20px)] pb-12">
      <header className="flex flex-col gap-4">
        <p className="flex items-center gap-2 text-lg font-bold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-shu text-white">
            <Icon name="pin" className="h-4 w-4" />
          </span>
          タビオシ
        </p>
        <h1 className="text-[28px] leading-tight font-bold">
          推しの旅を、
          <br />
          そのまま予約。
        </h1>
        <p className="leading-relaxed text-ink2">旅インフルエンサーの動画に出てきた宿・お店・回った順番を、ボタンひとつで自分の旅にできるアプリです。</p>
        {IS_SAMPLE && (
          <div className="flex flex-col gap-1 rounded-xl border border-line bg-wash p-4">
            <p className="flex items-center gap-2 text-sm font-bold">
              <span className="rounded-full bg-card px-2 py-0.5 text-xs ring-1 ring-line">試作</span>
              いまは架空のサンプルで動いています
            </p>
            <p className="text-sm leading-relaxed text-ink2">
              画面に出てくる人物・宿・お店・料金・口コミは、すべて架空です。地名と「予習」の豆知識は、実在の土地についての内容です。架空の宿には予約先がないため、予約ボタンは「予約先を準備中」と表示されます。
            </p>
          </div>
        )}
        <Link href="/shorts" className="flex h-12 items-center justify-center gap-2 rounded-full bg-shu font-bold text-white">
          <Icon name="play" fill className="h-4 w-4" />
          旅ショートを見る
        </Link>
      </header>

      <section aria-labelledby="steps" className="flex flex-col gap-3">
        <h2 id="steps" className="text-lg font-bold">
          使い方は4ステップ
        </h2>
        <HowItWorks />
      </section>

      <section aria-labelledby="pay" className="flex flex-col gap-2 rounded-xl border border-line bg-card p-4">
        <h2 id="pay" className="flex items-center gap-2 font-bold">
          <Icon name="external" className="h-5 w-5 text-shu" />
          予約と支払いは、外部の予約サイトで
        </h2>
        <p className="text-sm leading-relaxed text-ink2">
          タビオシは旅行会社ではないため、予約や代金の受け取りはしません。空室・料金・キャンセル条件は、移動先の予約サイトで必ず確かめてください。
        </p>
      </section>

      <section aria-labelledby="faq" className="flex flex-col gap-2">
        <h2 id="faq" className="text-lg font-bold">
          よくある質問
        </h2>
        {FAQ.map(([q, a]) => (
          <details key={q} className="rounded-xl border border-line bg-card">
            <summary className="flex min-h-12 cursor-pointer items-center px-4 py-3 text-sm font-bold">{q}</summary>
            <p className="px-4 pb-4 text-sm leading-relaxed text-ink2">{a}</p>
          </details>
        ))}
      </section>

      <div className="flex flex-col gap-2">
        <Link href="/shorts" className="flex h-12 items-center justify-center gap-2 rounded-full bg-shu font-bold text-white">
          <Icon name="play" fill className="h-4 w-4" />
          旅ショートを見る
        </Link>
        <Link href="/" className="flex h-12 items-center justify-center rounded-full font-bold ring-1 ring-line">
          ホームへ
        </Link>
      </div>
    </main>
  );
}
