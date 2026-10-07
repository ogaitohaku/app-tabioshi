import type { Metadata } from "next";
import Link from "next/link";
import { BackBar } from "@/components/BackBar";
import { TypeQuiz } from "@/components/TypeQuiz";
import { allTravelTypes, TYPE_AXES, TYPE_QUESTIONS } from "@/lib/content";

export const metadata: Metadata = {
  title: "旅タイプ診断 TRAVEL TYPE",
  description: "20問・約2分で、あなたの旅のしかたを16タイプから診断。友だちとの旅の相性もわかります。",
};

export default function TypePage() {
  const types = allTravelTypes();
  const facts = Object.fromEntries(types.map((t) => [t.code, { name: t.name, themes: t.themes, budget: t.budget }]));
  return (
    <main className="pb-10">
      <BackBar title="旅タイプ診断" />
      <div className="flex flex-col gap-6 px-4 pt-6">
        <header className="flex flex-col gap-2">
          <p className="text-[11px] font-black tracking-[0.2em] text-shu">TRAVEL TYPE</p>
          <h1 className="text-[28px] leading-tight font-black">あなたは、どんな旅人?</h1>
          <p className="text-sm leading-relaxed text-ink2">
            20問・約2分。実際の旅でよくすることを7段階で答えると、4つの軸から16タイプで表します。友だちとの旅の相性もわかります。
          </p>
        </header>

        <TypeQuiz questions={TYPE_QUESTIONS} facts={facts}>
          <section aria-labelledby="axes" className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-4">
            <h2 id="axes" className="text-sm font-black">
              4つの軸
            </h2>
            <ul className="flex flex-col gap-1.5 text-sm">
              {TYPE_AXES.map((a) => (
                <li key={a.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <span>
                    <b className="text-shu">{a.left}</b> {a.leftLabel}
                  </span>
                  <span className="text-mute">/</span>
                  <span className="text-right">
                    {a.rightLabel} <b className="text-sea">{a.right}</b>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="how" className="flex flex-col gap-2">
            <h2 id="how" className="text-sm font-black">
              結果を正確にするしくみ
            </h2>
            <ul className="flex flex-col gap-1.5 text-xs leading-relaxed text-ink2">
              <li>・1つの軸を5つの問で測ります。1問だけの答えで決まりません。</li>
              <li>・「そう思う」ほど逆の向きになる問も混ぜ、何にでも「そう思う」と答えるくせを差し引きます。</li>
              <li>・左右が半々だった軸だけ、3問ずつ聞き足して確かめます。</li>
              <li>・結果には軸ごとの割合と「確かさ」を出し、僅差のときはもう一つの可能性も見せます。</li>
            </ul>
          </section>

          <section aria-labelledby="all" className="flex flex-col gap-3">
            <h2 id="all" className="text-lg font-black">
              16の旅タイプ
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {types.map((t) => (
                <Link key={t.code} href={`/type/${t.code}`} className="flex flex-col gap-0.5 rounded-xl border border-line bg-card px-3 py-2.5">
                  <span className="num text-[11px] font-black tracking-widest text-shu">{t.code}</span>
                  <span className="text-sm leading-tight font-bold">{t.name}</span>
                </Link>
              ))}
            </div>
          </section>

          <p className="text-[11px] leading-relaxed text-mute">
            結果は「いまの旅の傾向」です。娯楽と自己理解のための診断で、性格検査や医学的な診断ではありません。答えと結果はこのスマホの中だけに保存し、「あなた向けの旅」を選ぶのに使います。
          </p>
        </TypeQuiz>
      </div>
    </main>
  );
}
