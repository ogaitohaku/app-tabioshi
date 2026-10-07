"use client";
import Link from "next/link";
import { useMyType } from "@/lib/my-type";
import { stars } from "@/lib/travel-type";

type Axis = { id: "where" | "decide" | "with" | "depth"; left: string; right: string; leftLabel: string; rightLabel: string };

/** 結果ページで「自分の結果か・他の人の結果か」によって出し分ける部分 */
export function MyTypeNote({ code, axes, names }: { code: string; axes: readonly Axis[]; names: { [code: string]: string } }) {
  const [mine] = useMyType();

  if (mine.code === code && mine.scores) {
    const s = mine.scores;
    return (
      <section aria-labelledby="mine" className="flex flex-col gap-3 rounded-2xl border border-shu/30 bg-shu-soft p-4">
        <h2 id="mine" className="text-sm font-black">あなたの、いまの旅の傾向</h2>
        <ul className="flex flex-col gap-2">
          {axes.map((a) => {
            const v = s[a.id];
            const left = v > 0;
            const n = stars(v);
            return (
              <li key={a.id} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
                <span className="font-bold">
                  <b className="num mr-1.5 text-shu">{left ? a.left : a.right}</b>
                  {left ? a.leftLabel : a.rightLabel}
                </span>
                <span aria-label={`5段階の${n}`} className="tracking-[0.15em] text-shu">
                  {"●".repeat(n)}
                  <span className="text-shu/25">{"●".repeat(5 - n)}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="text-[11px] text-ink2">旅をするうちに変わることがあります。ときどき診断し直してみてください。</p>
      </section>
    );
  }

  if (mine.code && names[mine.code]) {
    return (
      <Link href={`/type/${mine.code}/${code}`} className="flex items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3.5 text-white">
        <span className="min-w-0">
          <span className="block text-[11px] text-white/70">あなたは {names[mine.code]}({mine.code})</span>
          <span className="block font-black">このタイプとの旅の相性を見る</span>
        </span>
        <span aria-hidden className="text-xl">→</span>
      </Link>
    );
  }

  return (
    <Link href="/type" className="flex items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3.5 text-white">
      <span className="min-w-0">
        <span className="block text-[11px] text-white/70">16問・約1分</span>
        <span className="block font-black">あなたも診断して、相性を見る</span>
      </span>
      <span aria-hidden className="text-xl">→</span>
    </Link>
  );
}
