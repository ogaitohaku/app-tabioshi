"use client";
import Link from "next/link";
import { useMyType } from "@/lib/my-type";

/** ホームとマイ旅の入口。診断済みなら自分のタイプを出す */
export function TypeEntry({ names }: { names: { [code: string]: string } }) {
  const [mine] = useMyType();
  const name = mine.code ? names[mine.code] : undefined;
  return (
    <Link href={mine.code && name ? `/type/${mine.code}` : "/type"} className="mx-4 flex items-center gap-4 rounded-2xl bg-ink px-4 py-4 text-white">
      <span className="num grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-shu text-sm font-black tracking-wider">{name ? mine.code : "?"}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold tracking-[0.2em] text-white/60">TRAVEL TYPE</span>
        <span className="block text-base leading-snug font-black">{name ? `あなたは「${name}」` : "あなたは、どんな旅人?"}</span>
        <span className="block text-xs text-white/75">{name ? "結果と、友だちとの相性を見る" : "16問・約1分の旅タイプ診断"}</span>
      </span>
      <span aria-hidden className="text-xl">→</span>
    </Link>
  );
}
