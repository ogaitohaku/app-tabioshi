// 掲載前チェック。動画から旅程を作るときに運営が見落としやすいものを、機械で洗い出す。
// 実行: npm run check:content(サンプルのあいだは「公開前に必要なもの」を一覧にするだけで、失敗にはしない)
import type { Creator, Place, Video } from "../data/types";

export type Finding = { level: "error" | "warn"; where: string; what: string };

/** 「2026年9月20日」を日付に。読めなければ null */
export function parseJpDate(s: string): Date | null {
  const m = /^(\d{4})年(\d{1,2})月(\d{1,2})日$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCMonth() === +m[2] - 1 ? d : null;
}

/** 情報の確認日がこれより古いと「確認し直し」にする(日数) */
export const STALE_DAYS = 180;

export function checkContent({ creators, videos, places }: { creators: Creator[]; videos: Video[]; places: Place[] }, today: Date): Finding[] {
  const out: Finding[] = [];
  for (const c of creators) {
    if (!c.consent?.agreedAt) out.push({ level: "error", where: `投稿者 ${c.name}`, what: "掲載の同意(いつ・何に同意したか)が記録されていません" });
  }
  for (const v of videos) {
    if (!creators.some((c) => c.id === v.creatorId)) out.push({ level: "error", where: `動画 ${v.title}`, what: "投稿者が見つかりません" });
    if (!v.source?.url) out.push({ level: "error", where: `動画 ${v.title}`, what: "元の投稿のリンクがありません(出典に出せません)" });
  }
  for (const p of places) {
    const where = `場所 ${p.name}`;
    if (!videos.some((v) => v.id === p.videoId)) out.push({ level: "error", where, what: "出てくる動画が見つかりません" });
    const d = parseJpDate(p.checkedAt);
    if (!d) out.push({ level: "error", where, what: `情報の確認日が読めません(${p.checkedAt})` });
    else if ((today.getTime() - d.getTime()) / 86400000 > STALE_DAYS)
      out.push({ level: "warn", where, what: `情報の確認日が${STALE_DAYS}日より前です(${p.checkedAt})。営業・料金を確認し直してください` });
    if (p.category === "stay" && !p.stay?.booking?.rakutenHotelNo && !p.stay?.booking?.url)
      out.push({ level: "warn", where, what: "予約先がつながっていません(画面は「予約先を準備中」)" });
  }
  return out;
}
