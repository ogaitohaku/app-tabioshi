"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Theme } from "@/data/types";
import type { TypeQuestion } from "@/data/travelType";
import { useMyType } from "@/lib/my-type";
import { usePrefs, type Budget } from "@/lib/prefs";
import { track } from "@/lib/track";
import { scoreAnswers } from "@/lib/travel-type";

type Facts = { [code: string]: { name: string; themes: Theme[]; budget: Budget } };

/** 選択肢の並びを毎回変える(上から順に押すだけで結果が決まらないように) */
function shuffled(n: number) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 16問を1問ずつ。押したら次へ進む。終わったら結果ページへ */
export function TypeQuiz({ questions, facts }: { questions: TypeQuestion[]; facts: Facts }) {
  const router = useRouter();
  const [mine, setMine] = useMyType();
  const [prefs, setPrefs] = usePrefs();
  const [order, setOrder] = useState<number[][] | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);

  function start() {
    setOrder(questions.map((q) => shuffled(q.options.length)));
    setAnswers([]);
    track("type_start", { again: Boolean(mine.code) });
  }

  function pick(option: number) {
    const next = [...answers, option];
    if (next.length < questions.length) {
      setAnswers(next);
      return;
    }
    const { code, scores } = scoreAnswers(next);
    const at = new Date().toISOString();
    setMine({ code, scores, at, history: [...mine.history, { code, at }].slice(-20) });
    // 「あなた向けの旅」の好みがまだなら、タイプから入れておく(あとで変えられる)
    const f = facts[code];
    if (f && !prefs.done) setPrefs({ themes: f.themes, budget: f.budget, done: true });
    track("type_done", { code, again: Boolean(mine.code) });
    router.push(`/type/${code}`);
  }

  if (!order) {
    const last = mine.code && facts[mine.code];
    return (
      <div className="flex flex-col gap-3">
        <button type="button" onClick={start} className="h-13 rounded-full bg-shu py-3.5 text-base font-black text-white">
          {mine.code ? "もう一度診断する" : "診断をはじめる"}
        </button>
        {last && (
          <Link href={`/type/${mine.code}`} className="text-center text-sm font-bold text-ink2 underline">
            前回の結果:{last.name}({mine.code})
          </Link>
        )}
      </div>
    );
  }

  const i = answers.length;
  const q = questions[i];
  return (
    <div className="flex flex-col gap-5" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={i}>
          <div className="h-full rounded-full bg-shu transition-[width]" style={{ width: `${(i / questions.length) * 100}%` }} />
        </div>
        <p className="num text-xs font-bold text-mute">
          {i + 1} / {questions.length}
        </p>
      </div>
      <h2 className="min-h-14 text-xl leading-snug font-black">{q.text}</h2>
      <div className="flex flex-col gap-2.5">
        {order[i].map((o) => (
          <button
            key={`${i}-${o}`}
            type="button"
            onClick={() => pick(o)}
            className="min-h-13 rounded-2xl border border-line bg-card px-4 py-3 text-left text-[15px] font-bold active:bg-shu-soft"
          >
            {q.options[o].label}
          </button>
        ))}
      </div>
      {i > 0 && (
        <button type="button" onClick={() => setAnswers(answers.slice(0, -1))} className="self-start text-sm font-bold text-mute">
          ← 前の質問に戻る
        </button>
      )}
    </div>
  );
}
