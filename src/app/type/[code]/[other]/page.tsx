import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackBar } from "@/components/BackBar";
import { ShareButton } from "@/components/ShareButton";
import { TripCard } from "@/components/bits";
import { allTravelTypes, getTravelType, tripsForThemes, typeCompat } from "@/lib/content";

export const generateStaticParams = () => allTravelTypes().flatMap((a) => allTravelTypes().map((b) => ({ code: a.code, other: b.code })));

export async function generateMetadata({ params }: PageProps<"/type/[code]/[other]">): Promise<Metadata> {
  const { code, other } = await params;
  const a = getTravelType(code);
  const b = getTravelType(other);
  if (!a || !b) return {};
  return { title: `${a.name} × ${b.name} の旅の相性`, description: `${a.code}と${b.code}は「${typeCompat(a.code, b.code).title}」。場面ごとの相性と、二人に合う旅。` };
}

export default async function TypeCompat({ params }: PageProps<"/type/[code]/[other]">) {
  const { code, other } = await params;
  const a = getTravelType(code);
  const b = getTravelType(other);
  if (!a || !b) notFound();
  const { title, rows } = typeCompat(a.code, b.code);
  const trips = tripsForThemes(a.themes, b.themes).slice(0, 2);

  return (
    <main className="pb-10">
      <BackBar title="旅の相性" />
      <div className="flex flex-col gap-6 px-4 pt-5">
        <header className="flex flex-col items-center gap-3 rounded-3xl bg-ink px-4 py-6 text-center text-white">
          <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2">
            {[a, b].map((t, i) => (
              <Link key={i} href={`/type/${t.code}`} className={`flex flex-col gap-0.5 ${i ? "col-start-3" : ""}`}>
                <span className="num text-2xl font-black tracking-widest text-shu">{t.code}</span>
                <span className="text-xs leading-tight font-bold">{t.name}</span>
              </Link>
            ))}
            <span aria-hidden className="col-start-2 row-start-1 text-lg text-white/60">×</span>
          </div>
          <p className="text-xs text-white/70">二人の旅は</p>
          <h1 className="text-2xl font-black">{title}</h1>
        </header>

        <section aria-labelledby="rows" className="flex flex-col gap-2">
          <h2 id="rows" className="sr-only">
            場面ごとの相性
          </h2>
          {rows.map((r) => (
            <div key={r.label} className="flex flex-col gap-1 rounded-2xl border border-line bg-card px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black">{r.label}</h3>
                <span aria-label={`5段階の${r.level}`} className="tracking-[0.15em] text-shu">
                  {"●".repeat(r.level)}
                  <span className="text-shu/25">{"●".repeat(5 - r.level)}</span>
                </span>
              </div>
              <p className="text-sm text-ink2">{r.text}</p>
            </div>
          ))}
        </section>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-mute">相性は旅の場面ごとの目安です</p>
          <ShareButton title={`${a.name}×${b.name}は「${title}」`} path={`/type/${a.code}/${b.code}`} kind="type_compat" />
        </div>

        <section aria-labelledby="trips" className="flex flex-col gap-3">
          <h2 id="trips" className="text-lg font-black">二人に合う旅</h2>
          {trips.map((v) => (
            <TripCard key={v.id} video={v} wide />
          ))}
        </section>

        <Link href="/type" className="flex h-12 items-center justify-center rounded-full border border-line bg-card text-sm font-bold">
          旅タイプ診断をする(16問・約1分)
        </Link>
      </div>
    </main>
  );
}
