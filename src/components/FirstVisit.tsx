"use client";
import Link from "next/link";
import { createLocalStore } from "@/lib/local-store";
import { Icon } from "./Icon";

const useSeen = createLocalStore<{ closed: boolean }>("tabioshi.welcome", { closed: false });

/** はじめて来た人への案内。閉じたら、この端末では次から出さない */
export function FirstVisit({ sample }: { sample: boolean }) {
  const [seen, setSeen] = useSeen();
  if (seen.closed) return null;
  return (
    <aside aria-label="はじめての方へ" className="relative mx-4 flex flex-col gap-2 rounded-xl border border-line bg-wash p-4 pr-12">
      <p className="font-bold">はじめての方へ</p>
      <p className="text-sm leading-relaxed text-ink2">
        動画を見て、気に入った旅をまるごとコピー。マイ旅に保存して、空室と予約は外部の予約サイトで確かめます。
        {sample && "いまは架空のサンプルで動く試作です。"}
      </p>
      <Link href="/welcome" className="inline-flex h-11 w-fit items-center gap-1 text-sm font-bold text-shu">
        1分でわかる使い方
        <Icon name="arrow" className="h-4 w-4" />
      </Link>
      <button
        type="button"
        onClick={() => setSeen({ closed: true })}
        aria-label="この案内を閉じる"
        className="absolute top-1 right-1 grid h-11 w-11 place-items-center rounded-full text-mute"
      >
        <Icon name="plus" className="h-5 w-5 rotate-45" />
      </button>
    </aside>
  );
}
