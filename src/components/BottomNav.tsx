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
  return (
    <nav
      aria-label="メイン"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] border-t border-line bg-card pb-[env(safe-area-inset-bottom,0px)] text-mute"
    >
      <ul className="grid grid-cols-4">
        {TABS.map((t) => {
          const on = t.href === "/" ? path === "/" : path.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={on ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-xs font-bold ${on ? "text-shu" : ""}`}
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
