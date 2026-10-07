import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/BottomNav";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "タビオシ", template: "%s | タビオシ" },
  description: "推しの旅を、そのまま予約。旅インフルエンサーの動画に出てきた宿・お店・回る順番を、自分の旅にできるアプリ。",
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
      </body>
    </html>
  );
}
