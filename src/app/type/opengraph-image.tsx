import { ogCard, OG_SIZE } from "@/lib/og";

export const alt = "タビオシの旅タイプ診断";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return ogCard({ eyebrow: "旅タイプ診断 TRAVEL TYPE", title: "あなたは、どんな旅人?", sub: "16問・約1分。友だちとの旅の相性もわかる", scene: "sakura" });
}
