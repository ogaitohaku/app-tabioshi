import type { Metadata } from "next";
import { Globe } from "@/components/Globe";
import { SampleNote } from "@/components/bits";
import { allPlaces, allVideos } from "@/lib/content";

export const metadata: Metadata = { title: "旅マップ" };

export default function MapPage() {
  return (
    <main className="flex flex-col gap-4 px-4 pt-[calc(env(safe-area-inset-top,0px)+20px)] pb-10">
      <h1 className="text-2xl font-black">旅マップ</h1>
      <Globe videos={allVideos()} places={allPlaces()} />
      <SampleNote />
    </main>
  );
}
