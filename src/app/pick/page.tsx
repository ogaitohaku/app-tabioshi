import type { Metadata } from "next";
import { BackBar } from "@/components/BackBar";
import { SampleNote } from "@/components/bits";
import { planCandidates } from "@/lib/content";
import { PickPlanner } from "./PickPlanner";

export const metadata: Metadata = {
  title: "行き先をいっしょに決める",
  description: "推しの旅の候補を同行者に送って、行きたいところを選んでもらえます。登録はいりません。",
};

export default function Pick() {
  return (
    <main className="flex flex-col gap-4 pb-10">
      <BackBar title="行き先をいっしょに決める" />
      <div className="flex flex-col gap-4 px-4">
        <PickPlanner candidates={planCandidates()} />
        <SampleNote />
      </div>
    </main>
  );
}
