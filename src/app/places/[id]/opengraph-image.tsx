import { CATEGORY_LABEL, getCreator, getPlace, getVideo } from "@/lib/content";
import { yen } from "@/lib/format";
import { ogCard, OG_SIZE } from "@/lib/og";

export const alt = "タビオシの宿・お店";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const p = getPlace((await params).id);
  if (!p) return ogCard({ eyebrow: "タビオシ", title: "推しの旅を、そのまま予約。" });
  const v = getVideo(p.videoId);
  const c = v && getCreator(v.creatorId);
  return ogCard({
    eyebrow: `${p.stay ? p.stay.kind : CATEGORY_LABEL[p.category]} ・ ${p.address}`,
    title: p.name,
    sub: c ? `${c.name}が行った場所` : undefined,
    scene: p.visual.view ?? p.visual.scene,
    price: p.stay ? `1泊 ${yen(p.stay.pricePerNight / 2)}〜/人` : undefined,
  });
}
