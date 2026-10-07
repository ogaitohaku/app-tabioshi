import { getTravelType } from "@/lib/content";
import { ogCard, OG_SIZE } from "@/lib/og";
import { SCENE_OF_THEME } from "@/lib/type-scene";

export const alt = "タビオシの旅タイプ診断";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const t = getTravelType((await params).code);
  if (!t) return ogCard({ eyebrow: "旅タイプ診断 TRAVEL TYPE", title: "あなたは、どんな旅人?" });
  return ogCard({ eyebrow: `わたしの旅タイプ ${t.code}`, title: t.name, sub: `「${t.catch}」`, scene: SCENE_OF_THEME[t.themes[0]], price: "16問・約1分で診断" });
}
