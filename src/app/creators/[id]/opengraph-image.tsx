import { getCreator, videosByCreator } from "@/lib/content";
import { ogCard, OG_SIZE } from "@/lib/og";

export const alt = "タビオシの推しの旅人";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const c = getCreator((await params).id);
  if (!c) return ogCard({ eyebrow: "タビオシ", title: "推しの旅を、そのまま予約。" });
  return ogCard({ eyebrow: `${c.genre} ・ 旅${videosByCreator(c.id).length}本`, title: c.name, sub: c.bio, scene: c.visual.scene });
}
