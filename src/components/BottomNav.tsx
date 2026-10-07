"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/shorts", label: "ショート", icon: "play" },
  { href: "/", label: "ホーム", icon: "home" },
  { href: "/map", label: "旅マップ", icon: "map" },
  { href: "/me", label: "マイ旅", icon: "bookmark" },
];

export function BottomNav() {
  const path = usePathname();
  const dark = path === "/shorts";
  return (
    <nav
      aria-label="メイン"
      className={`fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] border-t pb-[env(safe-area-inset-bottom,0px)] ${
        dark ? "border-white/10 bg-black text-white/60" : "border-line bg-card/95 text-mute backdrop-blur"
      }`}
    >
      <ul className="grid grid-cols-4">
        {TABS.map((t) => {
          const on = t.href === "/" ? path === "/" : path.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={on ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold ${on ? (dark ? "text-white" : "text-shu") : ""}`}
              >
                <Icon name={t.icon} className="h-6 w-6" fill={t.icon === "play" && on} />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
