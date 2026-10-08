// SNS や LINE で共有されたときに出る画像(1200x630)。日本語が出るように Noto Sans JP を読み込む。
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

let font: Promise<Buffer> | null = null;
const loadFont = () => (font ??= readFile(join(process.cwd(), "src/assets/fonts/NotoSansJP-Bold.ttf")));

/** シーンごとの背景色(イメージ画像の空の色に合わせる。グラデーションは使わず1色) */
const TONES: Record<string, string> = {
  onsen: "#2E3A6B",
  sea: "#2B86BF",
  snow: "#5C7466",
  canal: "#0B1330",
  snowtown: "#1C2547",
  sakura: "#9CC9EC",
  room: "#6B4A33",
  dish: "#2B1D14",
  craft: "#3A2A1E",
  exterior: "#3B4B7A",
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
  const a = TONES[scene] ?? TONES.onsen;
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#FFFFFF", fontFamily: "Noto Sans JP" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 56px 56px 72px", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 34, color: "#1A1D21" }}>
          <div style={{ display: "flex", width: 52, height: 52, borderRadius: 12, background: "#E8502E" }} />
          タビオシ
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 28, color: "#E8502E" }}>{eyebrow}</div>
          <div style={{ display: "flex", fontSize: title.length > 22 ? 52 : 64, lineHeight: 1.25, color: "#1A1D21" }}>{title}</div>
          {sub && <div style={{ display: "flex", fontSize: 28, color: "#5B636E" }}>{sub}</div>}
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#5B636E" }}>推しの旅を、そのまま予約。</div>
      </div>
      <div style={{ display: "flex", width: 380, background: a, alignItems: "flex-end", justifyContent: "center", paddingBottom: 56 }}>
        {price && (
          <div style={{ display: "flex", background: "#FFFFFF", borderRadius: 999, padding: "14px 28px", fontSize: 32, color: "#1A1D21" }}>{price}</div>
        )}
      </div>
    </div>,
    { ...OG_SIZE, fonts: [{ name: "Noto Sans JP", data: await loadFont(), weight: 700, style: "normal" }] },
  );
}
