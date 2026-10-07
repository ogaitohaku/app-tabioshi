"use client";
// この端末に保存する小さな設定(好み・クイズの記録など)。保存できない環境では開いている間だけ覚える。
import { useSyncExternalStore } from "react";

export function createLocalStore<T>(key: string, initial: T) {
  const listeners = new Set<() => void>();
  let cache: T | undefined;
  const read = (): T => {
    if (cache !== undefined) return cache;
    try {
      const raw = localStorage.getItem(key);
      cache = raw ? ({ ...initial, ...JSON.parse(raw) } as T) : initial;
    } catch {
      cache = initial;
    }
    return cache;
  };
  const write = (next: T) => {
    cache = next;
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // 保存できなくても続ける
    }
    listeners.forEach((l) => l());
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };
  return function useStore() {
    const value = useSyncExternalStore(subscribe, read, () => initial);
    return [value, write] as const;
  };
}
