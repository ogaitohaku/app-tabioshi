"use client";
// 「行き先をいっしょに決める」の相談を、この端末に残す(送り返されたリンクの票を合わせるため)。
// これまでのキーには手を付けず、新しいキー tabioshi.plans を使う。サーバーには送らない。
// 読み込むたびに migratePlansStore で、前の版で保存した形もいまの形に直して使う(元の回答は消さない)。
import { createLocalStore } from "./local-store";
import { migratePlansStore, type PlansStore } from "./plan";

export { type PlansStore, withPlan } from "./plan";

export const PLANS_KEY = "tabioshi.plans";
export const usePlansStore = createLocalStore<PlansStore>(PLANS_KEY, { me: "", plans: {} }, migratePlansStore);
