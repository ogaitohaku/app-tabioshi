import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { BottomNav } from "@/components/BottomNav";
import { IS_SAMPLE } from "@/lib/content";
import { SITE_NAME, SITE_URL, TAGLINE } from "@/lib/site";
import "./globals.css";

const DESCRIPTION = `${TAGLINE}旅インフルエンサーの動画に出てきた宿・お店・回る順番を、自分の旅にできるアプリ。`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: DESCRIPTION,
  openGraph: { siteName: SITE_NAME, locale: "ja_JP", type: "website", description: DESCRIPTION },
  twitter: { card: "summary_large_image" },
  // サンプルデータの間は検索結果に出さない
  robots: IS_SAMPLE ? { index: false, follow: false } : undefined,
  applicationName: "タビオシ",
  appleWebApp: { capable: true, title: "タビオシ", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#fafaf8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="antialiased">
      <body className="min-h-dvh">
        <div className="mx-auto min-h-dvh max-w-[480px] bg-paper pb-[calc(64px+env(safe-area-inset-bottom,0px))] shadow-[0_0_0_1px_var(--color-line)]">
          {children}
        </div>
        <BottomNav />
        <Analytics />
      </body>
    </html>
  );
}
