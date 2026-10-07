"use client";
import type { Theme } from "@/data/types";
import { createLocalStore } from "./local-store";

export type Budget = "low" | "mid" | "high";
export type Prefs = { themes: Theme[]; budget: Budget | null; done: boolean };

export const BUDGET_LABEL: Record<Budget, string> = { low: "1.5万円まで", mid: "3万円まで", high: "こだわらない" };
const BUDGET_MAX: Record<Budget, number> = { low: 15000, mid: 30000, high: Infinity };

export const usePrefs = createLocalStore<Prefs>("tabioshi.prefs", { themes: [], budget: null, done: false });

export type TripFacts = { id: string; themes: Theme[]; cost: number };

/** 好みに合う順に並べる。テーマが合うほど上、予算を超える旅は下へ */
export function rankTrips(trips: TripFacts[], prefs: Prefs) {
  const max = prefs.budget ? BUDGET_MAX[prefs.budget] : Infinity;
  return trips
    .map((t) => {
      const hit = t.themes.filter((th) => prefs.themes.includes(th));
      const fits = t.cost <= max;
      return { ...t, hit, fits, score: hit.length * 2 + (fits ? 3 : 0) };
    })
    .sort((a, b) => b.score - a.score);
}
