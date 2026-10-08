// SNS や LINE で共有されたときに出る画像(1200x630)。日本語が出るように Noto Sans JP を読み込む。
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

let font: Promise<Buffer> | null = null;
const loadFont = () => (font ??= readFile(join(process.cwd(), "src/assets/fonts/NotoSansJP-Bold.ttf")));

/** シーンごとの背景色(イメージ画像の空の色に合わせる) */
const TONES: Record<string, [string, string]> = {
  onsen: ["#2E3A6B", "#F3A766"],
  sea: ["#2B86BF", "#BFE3F5"],
  snow: ["#5C7466", "#DCE6EE"],
  canal: ["#0B1330", "#3A3F6E"],
  snowtown: ["#1C2547", "#6A75A0"],
  sakura: ["#9CC9EC", "#F6C2D0"],
  room: ["#6B4A33", "#EDE3D0"],
  dish: ["#2B1D14", "#7A1F1A"],
  craft: ["#3A2A1E", "#C79A3A"],
  exterior: ["#3B4B7A", "#D58A73"],
};

export async function ogCard({
  eyebrow,
  title,
  sub,
  scene = "onsen",
  price,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  scene?: string;
  price?: string;
}) {
  const [a, b] = TONES[scene] ?? TONES.onsen;
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#FAFAF8", fontFamily: "Noto Sans JP" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 56px 56px 72px", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 34, color: "#16181D" }}>
            <div style={{ display: "flex", width: 52, height: 52, borderRadius: 14, background: "#E8502E" }} />
            タビオシ
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", fontSize: 28, color: "#E8502E" }}>{eyebrow}</div>
            <div style={{ display: "flex", fontSize: title.length > 22 ? 52 : 64, lineHeight: 1.25, color: "#16181D" }}>{title}</div>
            {sub && <div style={{ display: "flex", fontSize: 28, color: "#4A4F59" }}>{sub}</div>}
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#878C96" }}>推しの旅を、そのまま予約。</div>
        </div>
        <div style={{ display: "flex", width: 380, background: `linear-gradient(180deg, ${a}, ${b})`, alignItems: "flex-end", justifyContent: "center", paddingBottom: 56 }}>
          {price && (
            <div style={{ display: "flex", background: "#FFFFFF", borderRadius: 999, padding: "14px 28px", fontSize: 32, color: "#16181D" }}>{price}</div>
          )}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: [{ name: "Noto Sans JP", data: await loadFont(), weight: 700, style: "normal" }] },
  );
}
