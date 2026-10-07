import { getArea, videosInArea } from "@/lib/content";
import { ogCard, OG_SIZE } from "@/lib/og";

export const alt = "タビオシのエリアガイド";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const a = getArea((await params).id);
  if (!a) return ogCard({ eyebrow: "タビオシ", title: "推しの旅を、そのまま予約。" });
  return ogCard({ eyebrow: `エリアガイド ・ 推しの旅${videosInArea(a.id).length}本`, title: `${a.name}の旅`, sub: a.intro, scene: a.visual.scene });
}
