import type { TravelType } from "@/data/travelType";

/** 結果の「切符」。スクリーンショットしてそのまま載せられる大きさ */
export function TypeTicket({ type, label = "わたしの旅タイプ" }: { type: TravelType; label?: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-ink px-5 pt-5 pb-6 text-white">
      <div className="flex items-center justify-between text-[11px] font-bold tracking-[0.2em] text-white/60">
        <span>TRAVEL TYPE</span>
        <span>タビオシ</span>
      </div>
      <p className="mt-3 text-xs font-bold text-white/70">{label}</p>
      <p className="num mt-1 text-5xl font-black tracking-[0.12em] text-shu">{type.code}</p>
      <h1 className="mt-2 text-[26px] leading-tight font-black">{type.name}</h1>
      <p className="mt-2 text-sm text-white/85">「{type.catch}」</p>
      <div aria-hidden className="absolute top-1/2 -right-3 h-6 w-6 rounded-full bg-paper" />
      <div aria-hidden className="absolute top-1/2 -left-3 h-6 w-6 rounded-full bg-paper" />
    </div>
  );
}
