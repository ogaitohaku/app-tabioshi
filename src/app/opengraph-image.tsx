import { ogCard, OG_SIZE } from "@/lib/og";

export const alt = "タビオシ 推しの旅を、そのまま予約。";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({ eyebrow: "旅インフルエンサーと作る旅アプリ", title: "推しの旅を、そのまま予約。", sub: "動画の宿・お店・回る順番を、自分の旅に。" });
}
