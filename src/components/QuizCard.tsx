"use client";
import { useState } from "react";
import type { Quiz } from "@/data/types";
import { Icon } from "./Icon";

export function QuizCard({
  quiz,
  creatorName,
  label = "旅の予習クイズ",
  answered = null,
  onAnswer,
}: {
  quiz: Quiz;
  creatorName?: string;
  label?: string;
  /** すでに答えた選択肢(毎日クイズで、今日の答えを覚えておくとき) */
  answered?: number | null;
  onAnswer?: (picked: number, correct: boolean) => void;
}) {
  const [own, setPicked] = useState<number | null>(null);
  const picked = own ?? answered;
  const done = picked !== null;
  const right = picked === quiz.answer;
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-card p-4">
      <p className="text-xs font-bold text-shu">{label}</p>
      <p className="font-bold leading-snug">{quiz.question}</p>
      <div className="flex flex-col gap-2">
        {quiz.options.map((o, i) => {
          const isAns = done && i === quiz.answer;
          const isWrong = done && i === picked && !right;
          return (
            <button
              key={o}
              type="button"
              disabled={done}
              onClick={() => {
                setPicked(i);
                onAnswer?.(i, i === quiz.answer);
              }}
              className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm ${
                isAns ? "border-ink2 bg-wash font-bold" : isWrong ? "border-shu bg-shu-soft" : "border-line"
              }`}
            >
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-wash text-xs font-bold text-mute">
                {isAns ? <Icon name="check" className="h-3.5 w-3.5 text-ink" /> : "ABC"[i]}
              </span>
              {o}
            </button>
          );
        })}
      </div>
      {done && (
        <div className="rounded-xl bg-wash p-3 text-sm leading-relaxed" role="status">
          <p className={`font-bold ${right ? "text-ink" : "text-shu"}`}>{right ? "正解!" : "ざんねん"}</p>
          <p className="text-ink2">{quiz.explain}</p>
          {quiz.creatorSays && (
            <p className="mt-1 text-xs text-mute">
              {creatorName}「{quiz.creatorSays}」
            </p>
          )}
        </div>
      )}
    </div>
  );
}
