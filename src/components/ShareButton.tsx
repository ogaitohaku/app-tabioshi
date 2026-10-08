"use client";
import { useState } from "react";
import { track } from "@/lib/track";
import { Icon } from "./Icon";

/** スマホは端末の共有メニュー、使えないときは LINE とリンクコピーを出す */
export function ShareButton({ title, path, kind, dark = false }: { title: string; path: string; kind: string; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = () => new URL(path, location.origin).toString();

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

  const ring = dark ? "bg-white/15 text-white ring-white/30 backdrop-blur" : "bg-card text-ink ring-line";
  return (
    <div className="relative">
      <button type="button" onClick={onShare} aria-expanded={open} className={`inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold ring-1 ${ring}`}>
        <Icon name="share" className="h-4 w-4" />
        共有
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 flex w-56 flex-col gap-1 rounded-2xl border border-line bg-card p-2 text-sm text-ink shadow-lg">
          <a
            href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url())}`}
            target="_blank"
            rel="noopener"
            onClick={() => track("share", { kind, via: "line" })}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 font-bold hover:bg-paper"
          >
            <span className="grid h-6 w-6 place-items-center rounded-md bg-[#06C755] text-[9px] font-black text-white">LINE</span>
            LINEで送る
          </a>
          <a
            href={`https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url())}`}
            target="_blank"
            rel="noopener"
            onClick={() => track("share", { kind, via: "x" })}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 font-bold hover:bg-paper"
          >
            <span className="grid h-6 w-6 place-items-center rounded-md bg-ink text-[11px] font-black text-white">X</span>
            Xでポスト
          </a>
          <button type="button" onClick={copy} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left font-bold hover:bg-paper">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-paper">
              <Icon name={copied ? "check" : "copy"} className="h-3.5 w-3.5" />
            </span>
            {copied ? "コピーしました" : "リンクをコピー"}
          </button>
        </div>
      )}
    </div>
  );
}
