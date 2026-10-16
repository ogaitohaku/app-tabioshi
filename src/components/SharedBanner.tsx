"use client";
import { useEffect, useSyncExternalStore } from "react";
import { track } from "@/lib/track";

const noop = () => () => {};
const fromShare = () => new URLSearchParams(location.search).get("ref") === "share";

/** 共有リンク(?ref=share)から来た人への一言。友だちから届いた旅を、そのまま保存できることを伝える */
export function SharedBanner({ kind }: { kind: "trip" | "place" }) {
  const shared = useSyncExternalStore(noop, fromShare, () => false);
  useEffect(() => {
    if (shared) track("share_open", { kind });
  }, [shared, kind]);
  if (!shared) return null;
  return (
    <p className="mx-4 mt-3 rounded-xl border border-line bg-wash p-3 text-sm leading-relaxed text-ink2" role="status">
      {kind === "trip"
        ? "友だちから届いた旅です。気に入ったら「この旅をまるごとコピー」で、あなたのマイ旅に保存できます。"
        : "友だちから届いた場所です。「行きたい」を押すと、あなたのマイ旅に保存できます。"}
    </p>
  );
}
