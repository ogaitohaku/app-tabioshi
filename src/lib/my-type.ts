"use client";
// 旅タイプ診断の結果。この端末だけに保存し、サーバーには送らない。
import { createLocalStore } from "./local-store";
import type { Scores } from "./travel-type";

export type MyType = { code: string | null; scores: Scores | null; at: string | null; history: { code: string; at: string }[] };

export const useMyType = createLocalStore<MyType>("tabioshi.type", { code: null, scores: null, at: null, history: [] });
