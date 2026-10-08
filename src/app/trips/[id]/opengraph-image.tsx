import { getCreator, getVideo, tripCostPerPerson } from "@/lib/content";
import { yen } from "@/lib/format";
import { ogCard, OG_SIZE } from "@/lib/og";

export const alt = "タビオシの旅";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const v = getVideo((await params).id);
  if (!v) return ogCard({ eyebrow: "タビオシ", title: "推しの旅を、そのまま予約。" });
  return ogCard({
    eyebrow: `${getCreator(v.creatorId)?.name ?? ""}の旅 ・ ${v.area}`,
    title: v.title,
    scene: v.visual.scene,
    price: `1人 ${yen(tripCostPerPerson(v.id))}〜`,
  });
}
