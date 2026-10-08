import type { Metadata } from "next";
import { SavedTrips } from "./SavedTrips";
import { TypeEntry } from "@/components/TypeEntry";
import { allTravelTypes, allVideos } from "@/lib/content";

export const metadata: Metadata = { title: "マイ旅" };

export default function MyTrips() {
  return (
    <main className="flex flex-col gap-4 px-4 pt-[calc(env(safe-area-inset-top,0px)+20px)] pb-10">
      <h1 className="text-2xl font-black">マイ旅</h1>
      <p className="text-sm text-ink2">「この旅をまるごとコピー」した旅がここに並びます。</p>
      <SavedTrips videos={allVideos()} />
      <div className="-mx-4 mt-4">
        <TypeEntry names={Object.fromEntries(allTravelTypes().map((t) => [t.code, t.name]))} />
      </div>
    </main>
  );
}
