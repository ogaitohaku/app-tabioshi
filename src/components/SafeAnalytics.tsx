"use client";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

/**
 * アクセス解析に送るURLから # より後ろを消す。
 * 「行き先をいっしょに決める」のリンクは # の後ろに呼び名と票が入るので、解析にも送らない。
 */
export function stripHash(event: BeforeSendEvent): BeforeSendEvent {
  const i = event.url.indexOf("#");
  return i < 0 ? event : { ...event, url: event.url.slice(0, i) };
}

export function SafeAnalytics() {
  return <Analytics beforeSend={stripHash} />;
}
