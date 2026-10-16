import type { Metadata } from "next";
import { MyTravel } from "./MyTravel";
import { SampleNote } from "@/components/bits";
import { TypeEntry } from "@/components/TypeEntry";
import { allAreas, allCreators, allPlaces, allTravelTypes, allVideos } from "@/lib/content";

export const metadata: Metadata = { title: "マイ旅" };

export default function MyTrips() {
  return (
    <main className="flex flex-col gap-4 px-4 pt-[calc(env(safe-area-inset-top,0px)+20px)] pb-10">
      <h1 className="text-2xl font-bold">マイ旅</h1>
      <p className="text-sm text-ink2">コピーした旅と「行きたい」で保存した場所が並びます。旅先では、いまいる場所から近い順に見返せます。</p>
      <MyTravel videos={allVideos()} places={allPlaces()} areas={allAreas()} creators={allCreators()} />
      <div className="-mx-4 mt-4">
        <TypeEntry names={Object.fromEntries(allTravelTypes().map((t) => [t.code, t.name]))} />
      </div>
      <SampleNote />
    </main>
  );
}
