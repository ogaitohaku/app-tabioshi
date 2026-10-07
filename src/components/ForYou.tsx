"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { Theme } from "@/data/types";
import { BUDGET_LABEL, rankTrips, usePrefs, type Budget, type TripFacts } from "@/lib/prefs";
import { track } from "@/lib/track";

/** 2つの質問に答えると、旅が好みの順に並ぶ。答えはこの端末だけに保存する */
export function ForYou({ trips, cards, themeLabel }: { trips: TripFacts[]; cards: Record<string, ReactNode>; themeLabel: Record<Theme, string> }) {
  const [prefs, setPrefs] = usePrefs();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(prefs);

  if (!prefs.done || editing) {
    const themes = Object.keys(themeLabel) as Theme[];
    const toggle = (t: Theme) =>
      setDraft((d) => ({ ...d, themes: d.themes.includes(t) ? d.themes.filter((x) => x !== t) : [...d.themes, t] }));
    const save = () => {
      setPrefs({ ...draft, done: true });
      setEditing(false);
      track("prefs_set", { themes: draft.themes.join(","), budget: draft.budget ?? "none" });
    };
    return (
      <section className="mx-4 flex flex-col gap-4 rounded-2xl bg-ink p-4 text-white">
        <div>
          <p className="text-[11px] font-bold tracking-widest text-shu">あなた向け</p>
          <h2 className="text-lg font-black">好きな旅を教えてください</h2>
          <p className="text-xs text-white/70">答えはこのスマホの中だけに保存します。</p>
          <Link href="/type" className="mt-1 inline-block text-xs font-bold text-shu underline">
            旅タイプ診断で決める(16問・約1分)
          </Link>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-bold">1. 好きなものは?(いくつでも)</legend>
          <div className="flex flex-wrap gap-2">
            {themes.map((t) => {
              const on = draft.themes.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(t)}
                  className={`h-9 rounded-full px-3.5 text-sm font-bold ${on ? "bg-shu text-white" : "bg-white/10 text-white ring-1 ring-white/25"}`}
                >
                  {themeLabel[t]}
                </button>
              );
            })}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-bold">2. 1人あたりの予算は?</legend>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(BUDGET_LABEL) as Budget[]).map((b) => {
              const on = draft.budget === b;
              return (
                <button
                  key={b}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setDraft((d) => ({ ...d, budget: b }))}
                  className={`h-10 rounded-xl text-sm font-bold ${on ? "bg-shu text-white" : "bg-white/10 text-white ring-1 ring-white/25"}`}
                >
                  {BUDGET_LABEL[b]}
                </button>
              );
            })}
          </div>
        </fieldset>
        <button
          type="button"
          onClick={save}
          disabled={!draft.themes.length && !draft.budget}
          className="h-12 rounded-full bg-white font-bold text-ink disabled:opacity-40"
        >
          あなた向けの旅を見る
        </button>
      </section>
    );
  }

  const ranked = rankTrips(trips, prefs);
  const summary = [...prefs.themes.map((t) => themeLabel[t]), prefs.budget && `予算${BUDGET_LABEL[prefs.budget]}`].filter(Boolean).join("・");
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3 px-4">
        <div className="min-w-0">
          <h2 className="text-lg font-black">あなた向けの旅</h2>
          <p className="truncate text-xs text-mute">{summary}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDraft(prefs);
            setEditing(true);
          }}
          className="shrink-0 text-xs font-bold text-shu"
        >
          好みを変える
        </button>
      </div>
      <div className="hscroll">
        {ranked.map((t) => (
          <div key={t.id} className="flex flex-col gap-1.5">
            <p className={`text-[11px] font-bold ${t.hit.length ? "text-shu" : "text-mute"}`}>
              {t.hit.length ? `${t.hit.map((h) => themeLabel[h]).join("・")}が好きなあなたに` : t.fits ? "予算内で行ける旅" : "ちょっと贅沢な旅"}
            </p>
            {cards[t.id]}
          </div>
        ))}
      </div>
    </section>
  );
}
