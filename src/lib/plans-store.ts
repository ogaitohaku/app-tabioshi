"use client";
// 「行き先をいっしょに決める」の相談を、この端末に残す(送り返されたリンクの票を合わせるため)。
// これまでのキーには手を付けず、新しいキー tabioshi.plans を使う。サーバーには送らない。
import { createLocalStore } from "./local-store";
import { type Plan, planKey } from "./plan";

export type PlansStore = {
  /** 前に入れた自分の呼び名(次の相談で入れ直さなくて済むように) */
  me: string;
  /** 相談ID:候補 → 合わせた最新の相談と、最後に開いた日時(候補が違えば別の相談として残す) */
  plans: Record<string, { plan: Plan; at: string }>;
};

export const PLANS_KEY = "tabioshi.plans";
const KEEP = 20;
export const usePlansStore = createLocalStore<PlansStore>(PLANS_KEY, { me: "", plans: {} });

/** 相談を1件入れる。古いものから消して20件までにする */
export function withPlan(store: PlansStore, plan: Plan): PlansStore {
  const plans = { ...store.plans, [planKey(plan)]: { plan, at: new Date().toISOString() } };
  const keep = Object.entries(plans)
    .sort((a, b) => b[1].at.localeCompare(a[1].at))
    .slice(0, KEEP);
  return { ...store, plans: Object.fromEntries(keep) };
}
