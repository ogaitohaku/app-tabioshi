import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackBar } from "@/components/BackBar";
import { SampleNote, TripCard } from "@/components/bits";
import { Icon } from "@/components/Icon";
import { ShareButton } from "@/components/ShareButton";
import { Visual } from "@/components/Visual";
import { allCreators, getCreator, placesInVideo, videosByCreator } from "@/lib/content";

export const generateStaticParams = () => allCreators().map((c) => ({ id: c.id }));

export async function generateMetadata({ params }: PageProps<"/creators/[id]">): Promise<Metadata> {
  const c = getCreator((await params).id);
  return { title: c?.name, description: c?.bio };
}

const PLATFORM_LABEL = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube" } as const;

export default async function CreatorPage({ params }: PageProps<"/creators/[id]">) {
  const c = getCreator((await params).id);
  if (!c) notFound();
  const vids = videosByCreator(c.id);
  const spots = vids.reduce((n, v) => n + placesInVideo(v.id).length, 0);

  return (
    <main className="pb-10">
      <BackBar title={c.name} />
      <div className="flex flex-col items-center gap-3 px-4 pt-6 text-center">
        <span className="h-24 w-24 overflow-hidden rounded-full ring-4 ring-shu ring-offset-2">
          <Visual visual={c.visual} />
        </span>
        <h1 className="text-2xl font-black">{c.name}</h1>
        <p className="text-sm text-mute">{c.genre}</p>
        <p className="max-w-xs text-sm leading-relaxed text-ink2">{c.bio}</p>
        <ShareButton title={`${c.name}の旅`} path={`/creators/${c.id}`} kind="creator" />
        <dl className="grid w-full grid-cols-3 rounded-2xl border border-line bg-card py-3">
          {[
            ["旅", `${vids.length}本`],
            ["スポット", `${spots}か所`],
            ["フォロワー", c.followers],
          ].map(([k, val]) => (
            <div key={k}>
              <dt className="text-[11px] text-mute">{k}</dt>
              <dd className="num font-black">{val}</dd>
            </div>
          ))}
        </dl>
        {c.links.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {c.links.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-bold">
                {PLATFORM_LABEL[l.platform]}
                <Icon name="external" className="h-3 w-3" />
              </a>
            ))}
          </div>
        )}
      </div>

      <section className="mt-8 flex flex-col gap-4 px-4">
        <h2 className="text-lg font-black">{c.name}の旅</h2>
        {vids.map((v) => (
          <TripCard key={v.id} video={v} wide />
        ))}
      </section>
      <SampleNote className="mt-8 px-4" />
    </main>
  );
}
