"use client";
// 「行きたい」で保存した場所と、「行った」の記録。この端末の中だけに保存する(ログイン機能を入れたらサーバーへ移す)。
// 旅の保存(tabioshi.savedTrips)とは別のキーにして、これまでの保存内容には手を付けない。
import { createLocalStore } from "./local-store";

export type MyPlaces = {
  /** 場所ID → 保存した日時(ISO) */
  saved: Record<string, string>;
  /** 場所ID → 行ったと記録した日時(ISO) */
  visited: Record<string, string>;
};

export const MY_PLACES_KEY = "tabioshi.myPlaces";
export const useMyPlaces = createLocalStore<MyPlaces>(MY_PLACES_KEY, { saved: {}, visited: {} });

export function toggled(map: Record<string, string>, id: string): Record<string, string> {
  if (map[id]) {
    const next = { ...map };
    delete next[id];
    return next;
  }
  return { ...map, [id]: new Date().toISOString() };
}
