"use client";
import Link from "next/link";
import { useMyType } from "@/lib/my-type";
import { track } from "@/lib/track";
import { altCode, type Certainty } from "@/lib/travel-type";

type Axis = { id: "where" | "decide" | "with" | "depth"; left: string; right: string; leftLabel: string; rightLabel: string };

const CERTAINTY_NOTE: Record<Certainty, string> = {
  高い: "どの軸もはっきり分かれていて、答えもそろっています。",
  ふつう: "おおむね、この結果で合っていそうです。",
  低い: "左右が半々の軸が多いか、答えにばらつきがあります。旅をしたあとに、もう一度試してみてください。",
};

const FIT = [
  { v: "yes", label: "当たってる" },
  { v: "some", label: "半分くらい" },
  { v: "no", label: "違う" },
] as const;

/** 結果ページで「自分の結果か・他の人の結果か」によって出し分ける部分 */
export function MyTypeNote({ code, axes, names }: { code: string; axes: readonly Axis[]; names: { [code: string]: string } }) {
  const [mine, setMine] = useMyType();
  const r = mine.result;

  if (mine.code === code && r) {
    const alt = altCode(r);
    const fit = mine.fit[code];
    return (
      <section aria-labelledby="mine" className="flex flex-col gap-4 rounded-2xl border border-shu/30 bg-shu-soft p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 id="mine" className="text-sm font-black">あなたの、いまの旅の傾向</h2>
          <p className="shrink-0 rounded-full bg-card px-2.5 py-0.5 text-[11px] font-bold">確かさ:{r.certainty}</p>
        </div>
        <ul className="flex flex-col gap-3">
          {axes.map((a) => {
            const p = r.pct[a.id];
            const left = r.code.includes(a.left);
            return (
              <li key={a.id} className="flex flex-col gap-1 text-xs">
                <div className="flex justify-between font-bold">
                  <span className={left ? "text-shu" : "text-ink2"}>
                    {a.left} {a.leftLabel} <span className="num">{p}%</span>
                  </span>
                  <span className={left ? "text-ink2" : "text-sea"}>
                    <span className="num">{100 - p}%</span> {a.rightLabel} {a.right}
                  </span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-sea/25">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-shu" style={{ width: `${p}%` }} />
                  <div className="absolute inset-y-0 left-1/2 w-px bg-card" />
                </div>
                {r.clarity[a.id] === "僅差" && <p className="text-[11px] text-mute">この軸は僅差です</p>}
              </li>
            );
          })}
        </ul>
        <p className="text-[11px] leading-relaxed text-ink2">{CERTAINTY_NOTE[r.certainty]}</p>
        {alt && names[alt] && (
          <Link href={`/type/${alt}`} className="text-xs font-bold text-ink underline">
            もう一つの可能性:{names[alt]}({alt})
          </Link>
        )}
        <div className="flex flex-col gap-2 border-t border-shu/20 pt-3">
          <p className="text-xs font-bold">この結果、当たってる?</p>
          {fit ? (
            <p className="text-xs text-ink2">答えてくれてありがとうございます。診断をよくするのに使います。</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {FIT.map((f) => (
                <button
                  key={f.v}
                  type="button"
                  onClick={() => {
                    setMine({ ...mine, fit: { ...mine.fit, [code]: f.v } });
                    track("type_fit", { code, fit: f.v, certainty: r.certainty });
                  }}
                  className="h-10 rounded-full bg-card text-xs font-bold ring-1 ring-line"
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
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
        <span className="block text-[11px] text-white/70">20問・約2分</span>
        <span className="block font-black">あなたも診断して、相性を見る</span>
      </span>
      <span aria-hidden className="text-xl">→</span>
    </Link>
  );
}
