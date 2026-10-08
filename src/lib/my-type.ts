"use client";
// 旅タイプ診断の結果。この端末だけに保存し、サーバーには送らない。
import { createLocalStore } from "./local-store";
import type { TypeResult } from "./travel-type";

export type MyType = {
  code: string | null;
  result: TypeResult | null;
  at: string | null;
  history: { code: string; at: string }[];
  /** 「当たってる?」への答え(結果のコードごと) */
  fit: { [code: string]: "yes" | "some" | "no" };
};

export const useMyType = createLocalStore<MyType>("tabioshi.type", { code: null, result: null, at: null, history: [], fit: {} });
