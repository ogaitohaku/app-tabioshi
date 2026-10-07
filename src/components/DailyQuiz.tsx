"use client";
import { useSyncExternalStore } from "react";
import type { Quiz } from "@/data/types";
import { createLocalStore } from "@/lib/local-store";
import { track } from "@/lib/track";
import { QuizCard } from "./QuizCard";

type QuizLog = { last: string | null; streak: number; best: number; picked: number | null };
const useRecord = createLocalStore<QuizLog>("tabioshi.dailyQuiz", { last: null, streak: 0, best: 0, picked: null });

/** この端末の日付(YYYY-MM-DD) */
const day = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dayNumber = (d: Date) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);

// 日付はスマホの時計で決める(サーバーで作るページには入れない)
const noop = () => () => {};
const useToday = () => useSyncExternalStore(noop, () => day(), () => null);

/** 1日1問。毎日答えると「連続◯日」が伸びる */
export function DailyQuiz({ quizzes, names }: { quizzes: Quiz[]; names: { [videoId: string]: string | undefined } }) {
  const [rec, setRec] = useRecord();
  const today = useToday();
  if (!today) return <section className="mx-4 h-72 rounded-2xl border border-line bg-card" aria-hidden />;
  const [y, m, d] = today.split("-").map(Number);
  const yesterday = day(new Date(y, m - 1, d - 1));
  const quiz = quizzes[dayNumber(new Date(y, m - 1, d)) % quizzes.length];
  const answeredToday = rec.last === today;
  // 昨日も今日も答えていなければ連続は途切れている
  const streak = rec.last === today || rec.last === yesterday ? rec.streak : 0;

  return (
    <section className="flex flex-col gap-3 px-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-black">今日の1問</h2>
          <p className="text-xs text-mute">毎日答えて、旅の予習を続けよう</p>
        </div>
        <p className="rounded-full bg-shu-soft px-3 py-1 text-xs font-bold text-shu">
          連続 <span className="num text-sm">{streak}</span>日{rec.best > 1 && <span className="text-mute"> ・ 最高{rec.best}日</span>}
        </p>
      </div>
      <QuizCard
        key={today}
        quiz={quiz}
        creatorName={names[quiz.videoId]}
        label={answeredToday ? "今日の1問(回答ずみ。また明日!)" : "今日の1問"}
        answered={answeredToday ? rec.picked : null}
        onAnswer={(picked, correct) => {
          if (answeredToday) return;
          const next = rec.last === yesterday ? rec.streak + 1 : 1;
          setRec({ last: today, streak: next, best: Math.max(rec.best, next), picked });
          track("quiz_answer", { quiz: quiz.id, correct });
        }}
      />
    </section>
  );
}
