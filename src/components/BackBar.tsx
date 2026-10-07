"use client";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";

export function BackBar({ title, overlay = false }: { title?: string; overlay?: boolean }) {
  const router = useRouter();
  const back = () => (window.history.length > 1 ? router.back() : router.push("/"));
  return (
    <div
      className={`sticky top-0 z-30 flex h-[calc(env(safe-area-inset-top,0px)+52px)] items-end gap-2 px-2 pb-2 ${
        overlay ? "absolute inset-x-0 bg-gradient-to-b from-black/45 to-transparent text-white" : "border-b border-line bg-paper/95 backdrop-blur"
      }`}
    >
      <button type="button" onClick={back} aria-label="戻る" className="grid h-9 w-9 place-items-center rounded-full">
        <Icon name="back" className="h-6 w-6" />
      </button>
      {title && <p className="truncate pb-1.5 text-sm font-bold">{title}</p>}
    </div>
  );
}
