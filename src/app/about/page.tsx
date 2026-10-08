import type { Metadata } from "next";
import { BackBar } from "@/components/BackBar";
import { IS_SAMPLE } from "@/lib/content";

export const metadata: Metadata = { title: "タビオシについて" };

const ITEMS: [string, string][] = [
  ["タビオシとは", "旅インフルエンサー(推し)の動画に出てきた宿・お店・回った順番を、そのまま自分の旅にできるアプリです。動画や旅程は無料で見られます。"],
  [
    "予約のしくみ",
    "タビオシでは予約を受け付けていません。「空室を見る」ボタンから楽天トラベルなどの予約サイトに移動し、そちらで予約します。予約が成立すると、タビオシと旅を紹介したクリエイターが予約サイトから紹介料を受け取ります。紹介リンクを使っても、予約サイトでの料金が上がることはありません。",
  ],
  ["PR表示について", "宿やお店が掲載料を払って載せているものには、必ず「PR」と表示します。表示のないものは、クリエイターが自分で選んで行った場所です。"],
  ["マイ旅の保存", "「まるごとコピー」した旅は、いまはお使いの端末の中だけに保存されます。端末やブラウザを変えると引き継がれません。"],
];

export default function About() {
  return (
    <main className="pb-10">
      <BackBar title="タビオシについて" />
      <div className="flex flex-col gap-6 px-4 pt-6">
        {IS_SAMPLE && (
          <p className="rounded-xl bg-shu-soft p-4 text-sm leading-relaxed">
            いまはテスト中のため、表示している人物・宿・お店・料金・口コミはすべて架空のサンプルです。地名と「予習」の豆知識は実在の土地についての内容です。
          </p>
        )}
        {ITEMS.map(([h, b]) => (
          <section key={h} className="flex flex-col gap-1.5">
            <h2 className="font-bold">{h}</h2>
            <p className="text-sm leading-relaxed text-ink2">{b}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
