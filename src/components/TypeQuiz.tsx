"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { Theme } from "@/data/types";
import type { TypeQuestion } from "@/data/travelType";
import { useMyType } from "@/lib/my-type";
import { usePrefs, type Budget } from "@/lib/prefs";
import { track } from "@/lib/track";
import { closeAxes, scoreAnswers } from "@/lib/travel-type";

type Facts = {
  [code: string]: { name: string; themes: Theme[]; budget: Budget };
};

/** 7段階の丸。両端ほど大きく、まん中(どちらでもない)が一番小さい */
const SCALE = [
  { v: 3, size: "h-11 w-11", tone: "border-shu", on: "bg-shu" },
  { v: 2, size: "h-9 w-9", tone: "border-shu", on: "bg-shu" },
  { v: 1, size: "h-7 w-7", tone: "border-shu", on: "bg-shu" },
  { v: 0, size: "h-6 w-6", tone: "border-mute", on: "bg-mute" },
  { v: -1, size: "h-7 w-7", tone: "border-ink2", on: "bg-ink2" },
  { v: -2, size: "h-9 w-9", tone: "border-ink2", on: "bg-ink2" },
  { v: -3, size: "h-11 w-11", tone: "border-ink2", on: "bg-ink2" },
];
const SCALE_LABEL: Record<number, string> = {
  3: "とてもそう思う",
  2: "そう思う",
  1: "ややそう思う",
  0: "どちらでもない",
  [-1]: "ややそう思わない",
  [-2]: "そう思わない",
  [-3]: "まったくそう思わない",
};

/** 20問を1問ずつ7段階で。答えが半々だった軸だけ3問ずつ聞き足してから結果へ。
 *  children は診断前だけ出す説明(診断中に軸の説明が見えると、答えが引っぱられるため隠す) */
export function TypeQuiz({ questions, facts, children }: { questions: TypeQuestion[]; facts: Facts; children?: ReactNode }) {
  const router = useRouter();
  const [mine, setMine] = useMyType();
  const [prefs, setPrefs] = usePrefs();
  const [queue, setQueue] = useState<number[] | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | undefined)[]>([]);
  const [extraAdded, setExtraAdded] = useState(false);

  function start() {
    setQueue(questions.flatMap((q, i) => (q.extra ? [] : [i])));
    setStep(0);
    setAnswers([]);
    setExtraAdded(false);
    track("type_start", { again: Boolean(mine.code) });
  }

  function finish(all: (number | undefined)[]) {
    const result = scoreAnswers(all);
    const at = new Date().toISOString();
    setMine({
      ...mine,
      code: result.code,
      result,
      at,
      history: [...mine.history, { code: result.code, at }].slice(-20),
    });
    // 「あなた向けの旅」の好みがまだなら、タイプから入れておく(あとで変えられる)
    const f = facts[result.code];
    if (f && !prefs.done) setPrefs({ themes: f.themes, budget: f.budget, done: true });
    track("type_done", {
      code: result.code,
      certainty: result.certainty,
      asked: all.filter((a) => a !== undefined).length,
      again: Boolean(mine.code),
    });
    router.push(`/type/${result.code}`);
  }

  function answer(v: number) {
    if (!queue) return;
    const next = [...answers];
    next[queue[step]] = v;
    setAnswers(next);
    if (step + 1 < queue.length) {
      setStep(step + 1);
      return;
    }
    if (!extraAdded) {
      const close = closeAxes(scoreAnswers(next));
      setExtraAdded(true);
      if (close.length) {
        setQueue([...queue, ...questions.flatMap((q, i) => (q.extra && close.includes(q.axis) ? [i] : []))]);
        setStep(step + 1);
        return;
      }
    }
    finish(next);
  }

  if (!queue) {
    const last = mine.code && facts[mine.code];
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <button type="button" onClick={start} className="rounded-full bg-shu py-3.5 text-base font-bold text-white">
            {mine.code ? "もう一度診断する" : "診断をはじめる"}
          </button>
          {last && (
            <Link href={`/type/${mine.code}`} className="text-center text-sm font-bold text-ink2 underline">
              前回の結果:{last.name}({mine.code})
            </Link>
          )}
        </div>
        {children}
      </div>
    );
  }

  const qi = queue[step];
  const q = questions[qi];
  const picked = answers[qi];
  const core = questions.filter((x) => !x.extra).length;
  return (
    <div className="flex flex-col gap-5" aria-live="polite">
      <div className="flex items-center gap-3">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={queue.length}
          aria-valuenow={step}
        >
          <div className="h-full rounded-full bg-shu transition-[width]" style={{ width: `${(step / queue.length) * 100}%` }} />
        </div>
        <p className="num text-xs font-bold text-mute">
          {step + 1} / {queue.length}
        </p>
      </div>
      {step >= core && <p className="rounded-xl bg-wash px-3 py-2 text-xs font-bold text-ink">答えが半々だったところを、あと少しだけ確かめます。</p>}
      <h2 data-q className="min-h-20 text-xl leading-snug font-bold">
        {q.text}
      </h2>
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">どのくらい当てはまりますか</legend>
        <div className="flex items-center justify-between">
          {SCALE.map((s) => (
            <button
              key={`${qi}-${s.v}`}
              type="button"
              data-v={s.v}
              aria-label={SCALE_LABEL[s.v]}
              aria-pressed={picked === s.v}
              onClick={() => answer(s.v)}
              className="grid h-12 w-11 place-items-center"
            >
              <span className={`block rounded-full border-2 ${s.size} ${s.tone} ${picked === s.v ? s.on : "bg-card"}`} />
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs font-bold">
          <span className="text-shu">そう思う</span>
          <span className="text-mute">どちらでもない</span>
          <span className="text-ink">そう思わない</span>
        </div>
      </fieldset>
      <p className="text-xs text-mute">「こうありたい」ではなく、実際の旅でよくすることで答えてください。</p>
      {step > 0 && (
        <button type="button" onClick={() => setStep(step - 1)} className="self-start text-sm font-bold text-mute">
          ← 前の質問に戻る
        </button>
      )}
    </div>
  );
}
