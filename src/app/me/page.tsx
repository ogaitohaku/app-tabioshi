import type { Metadata } from "next";
import Link from "next/link";
import { MyTravel } from "./MyTravel";
import { SampleNote } from "@/components/bits";
import { Icon } from "@/components/Icon";
import { TypeEntry } from "@/components/TypeEntry";
import { allAreas, allCreators, allPlaces, allTravelTypes, allVideos } from "@/lib/content";

export const metadata: Metadata = { title: "マイ旅" };

export default function MyTrips() {
  return (
    <main className="flex flex-col gap-4 px-4 pt-[calc(env(safe-area-inset-top,0px)+20px)] pb-10">
      <h1 className="text-2xl font-bold">マイ旅</h1>
      <p className="text-sm text-ink2">コピーした旅と「行きたい」で保存した場所が並びます。旅先では、いまいる場所から近い順に見返せます。</p>
      <Link href="/pick" className="flex items-center gap-3 rounded-xl border border-line bg-card p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-shu-soft text-shu">
          <Icon name="share" className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">同行者と行き先を決める</span>
          <span className="block text-sm text-ink2">保存した旅を候補にして LINE で送り、行きたいところを選んでもらえます</span>
        </span>
        <Icon name="arrow" className="h-4 w-4 shrink-0 text-mute" />
      </Link>
      <MyTravel videos={allVideos()} places={allPlaces()} areas={allAreas()} creators={allCreators()} />
      <div className="-mx-4 mt-4">
        <TypeEntry names={Object.fromEntries(allTravelTypes().map((t) => [t.code, t.name]))} />
      </div>
      <SampleNote />
    </main>
  );
}
