"use client";
// 計測(Vercel Analytics)。どのボタンが押されたかだけを送り、個人を特定する情報は送らない。
import { track as vercelTrack } from "@vercel/analytics";

export type TrackEvent = "booking_click" | "share" | "copy_trip" | "quiz_answer" | "prefs_set" | "type_start" | "type_done";

export function track(event: TrackEvent, props: Record<string, string | number | boolean> = {}) {
  try {
    vercelTrack(event, props);
  } catch {
    // 計測に失敗しても画面の動きは止めない
  }
}
