"use client";
// 「まるごとコピー」した旅は、いまはこの端末の中だけに保存する(ログイン機能を入れたらサーバーへ移す)。
import { useSyncExternalStore } from "react";

const KEY = "tabioshi.savedTrips";
const listeners = new Set<() => void>();
let cache: string[] | null = null;

function read(): string[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(ids: string[]) {
  cache = ids;
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // 保存できない環境(プライベートモードなど)では、この画面を開いている間だけ覚えておく
  }
  listeners.forEach((l) => l());
}

const EMPTY: string[] = [];
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useSavedTrips() {
  const ids = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    ids,
    has: (id: string) => ids.includes(id),
    toggle: (id: string) => write(ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids]),
  };
}
