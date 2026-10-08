"use client";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";

export function BackBar({ title }: { title?: string }) {
  const router = useRouter();
  const back = () => (window.history.length > 1 ? router.back() : router.push("/"));
  return (
    <div className="sticky top-0 z-30 flex h-[calc(env(safe-area-inset-top,0px)+52px)] items-end gap-2 border-b border-line bg-paper px-2 pb-2">
      <button type="button" onClick={back} aria-label="戻る" className="grid h-11 w-11 place-items-center rounded-full">
        <Icon name="back" className="h-6 w-6" />
      </button>
      {title && <p className="truncate pb-1.5 text-sm font-bold">{title}</p>}
    </div>
  );
}
