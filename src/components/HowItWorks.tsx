import { Icon, type IconName } from "./Icon";

/** 使い方の4ステップ。予約と支払いは外部サイトで行うことを最後の段で必ず伝える */
export const STEPS: { icon: IconName; title: string; body: string }[] = [
  { icon: "play", title: "動画を見る", body: "旅インフルエンサーの旅ショートを、1本ずつ見ます。" },
  { icon: "copy", title: "旅をまるごとコピー", body: "動画に出てきた宿・お店・回る順番を、ボタンひとつで写します。" },
  { icon: "bookmark", title: "マイ旅に保存", body: "コピーした旅はマイ旅に並びます。いまはこの端末の中だけに保存します。" },
  {
    icon: "external",
    title: "外部サイトで空室を確認",
    body: "「空室を見る」から予約サイトへ。空室・料金・キャンセル条件の確認と、予約・支払いはそちらで行います。",
  },
];

export function HowItWorks({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <ol className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex items-center gap-2.5 bg-card px-3 py-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-shu-soft text-shu">
              <Icon name={s.icon} className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs text-mute">STEP {i + 1}</span>
              <span className="block text-sm leading-snug font-bold">{s.title}</span>
            </span>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <ol className="flex flex-col gap-2.5">
      {STEPS.map((s, i) => (
        <li key={s.title} className="flex gap-3 rounded-xl border border-line bg-card p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-shu-soft text-shu">
            <Icon name={s.icon} className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-bold text-mute">STEP {i + 1}</span>
            <span className="block font-bold">{s.title}</span>
            <span className="mt-0.5 block text-sm leading-relaxed text-ink2">{s.body}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
