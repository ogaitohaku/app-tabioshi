import { getTravelType, typeCompat } from "@/lib/content";
import { ogCard, OG_SIZE } from "@/lib/og";
import { SCENE_OF_THEME } from "@/lib/type-scene";

export const alt = "タビオシの旅の相性";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ code: string; other: string }> }) {
  const { code, other } = await params;
  const a = getTravelType(code);
  const b = getTravelType(other);
  if (!a || !b) return ogCard({ eyebrow: "旅タイプ診断 TRAVEL TYPE", title: "あなたは、どんな旅人?" });
  return ogCard({ eyebrow: `旅の相性 ${a.code} × ${b.code}`, title: typeCompat(a.code, b.code).title, sub: `${a.name} × ${b.name}`, scene: SCENE_OF_THEME[b.themes[0]] });
}
