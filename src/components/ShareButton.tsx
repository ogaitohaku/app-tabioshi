"use client";
import { useState } from "react";
import { track } from "@/lib/track";
import { Icon } from "./Icon";

/** スマホは端末の共有メニュー、使えないときは LINE とリンクコピーを出す */
/** iconOnly: 題の横など、幅がせまい所ではアイコンだけ(読み上げは「共有」) */
export function ShareButton({ title, path, kind, iconOnly = false }: { title: string; path: string; kind: string; iconOnly?: boolean }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // ?ref=share を付けて、共有リンクから来た人に一言添える(と、共有から何人来たかを数える)
  const url = () => {
    const u = new URL(path, location.origin);
    u.searchParams.set("ref", "share");
    return u.toString();
  };

  async function onShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `${title}|タビオシ`, url: url() });
        track("share", { kind, via: "native" });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    setOpen((o) => !o);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      track("share", { kind, via: "copy" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onShare}
        aria-expanded={open}
        aria-label={iconOnly ? "共有" : undefined}
        title={iconOnly ? "共有" : undefined}
        className={`btn btn-sub ${iconOnly ? "w-11 px-0" : ""}`}
      >
        <Icon name="share" className={iconOnly ? "h-5 w-5" : "h-4 w-4"} />
        {!iconOnly && "共有"}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 flex w-56 flex-col gap-1 rounded-xl border border-line bg-card p-2 text-sm text-ink shadow-sm">
          <a
            href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url())}`}
            target="_blank"
            rel="noopener"
            onClick={() => track("share", { kind, via: "line" })}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 font-bold hover:bg-wash"
          >
            <span className="grid h-6 w-6 place-items-center rounded-md bg-[#06C755] text-xs font-bold text-white">LINE</span>
            LINEで送る
          </a>
          <a
            href={`https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url())}`}
            target="_blank"
            rel="noopener"
            onClick={() => track("share", { kind, via: "x" })}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 font-bold hover:bg-wash"
          >
            <span className="grid h-6 w-6 place-items-center rounded-md bg-ink text-xs font-bold text-white">X</span>
            Xでポスト
          </a>
          <button type="button" onClick={copy} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left font-bold hover:bg-wash">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-wash">
              <Icon name={copied ? "check" : "copy"} className="h-3.5 w-3.5" />
            </span>
            {copied ? "コピーしました" : "リンクをコピー"}
          </button>
        </div>
      )}
    </div>
  );
}
