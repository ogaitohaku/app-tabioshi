import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackBar } from "@/components/BackBar";
import { MyTypeNote } from "@/components/MyTypeNote";
import { ShareButton } from "@/components/ShareButton";
import { TripCard } from "@/components/bits";
import { TypeTicket } from "@/components/TypeTicket";
import { allTravelTypes, getTravelType, THEME_LABEL, tripsForThemes, TYPE_AXES, typeCompat } from "@/lib/content";

export const generateStaticParams = () => allTravelTypes().map((t) => ({ code: t.code }));

export async function generateMetadata({ params }: PageProps<"/type/[code]">): Promise<Metadata> {
  const t = getTravelType((await params).code);
  return { title: t && `${t.name}(${t.code})| 旅タイプ診断`, description: t && `「${t.catch}」あなたの旅タイプは?20問・約2分の旅タイプ診断。` };
}

export default async function TypeResult({ params }: PageProps<"/type/[code]">) {
  const t = getTravelType((await params).code);
  if (!t) notFound();
  const types = allTravelTypes();
  const names = Object.fromEntries(types.map((x) => [x.code, x.name]));
  const others = types
    .filter((x) => x.code !== t.code)
    .map((x) => ({ ...x, c: typeCompat(t.code, x.code) }))
    .map((x) => ({ ...x, total: x.c.rows.reduce((n, r) => n + r.level, 0) }))
    .sort((a, b) => b.total - a.total);
  const trips = tripsForThemes(t.themes).slice(0, 2);

  return (
    <main className="pb-10">
      <BackBar title="旅タイプ診断" />
      <div className="flex flex-col gap-6 px-4 pt-5">
        <TypeTicket type={t} />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-mute">結果は「いまの旅の傾向」です</p>
          <ShareButton title={`わたしの旅タイプは「${t.name}」(${t.code})`} path={`/type/${t.code}`} kind="type" />
        </div>

        <MyTypeNote code={t.code} axes={TYPE_AXES} names={names} />

        <section aria-labelledby="axes" className="grid grid-cols-4 gap-1.5">
          <h2 id="axes" className="sr-only">
            4つの軸
          </h2>
          {TYPE_AXES.map((a, i) => {
            const left = t.code[i] === a.left;
            return (
              <div key={a.id} className="flex flex-col items-center gap-0.5 rounded-xl border border-line bg-card px-1 py-2 text-center">
                <span className="num text-xl font-bold text-shu">{t.code[i]}</span>
                <span className="text-xs leading-tight font-bold">{left ? a.leftLabel : a.rightLabel}</span>
              </div>
            );
          })}
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5 rounded-xl border border-line bg-card p-4">
            <h2 className="text-sm font-bold text-ink">強み</h2>
            <ul className="flex flex-col gap-1 text-sm">
              {t.strengths.map((s) => (
                <li key={s}>・{s}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-1.5 rounded-xl border border-line bg-card p-4">
            <h2 className="text-sm font-bold text-ink">ちょっと弱いところ</h2>
            <ul className="flex flex-col gap-1 text-sm">
              {t.weaknesses.map((s) => (
                <li key={s}>・{s}</li>
              ))}
            </ul>
          </div>
        </section>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="font-bold text-mute">好きな旅先</dt>
          <dd>{t.likes}</dd>
          <dt className="font-bold text-mute">苦手な旅</dt>
          <dd>{t.dislikes}</dd>
          <dt className="font-bold text-mute">好きなテーマ</dt>
          <dd>{t.themes.map((th) => THEME_LABEL[th]).join("・")}</dd>
        </dl>

        <section aria-labelledby="aruaru" className="flex flex-col gap-2">
          <h2 id="aruaru" className="text-lg font-bold">
            {t.name}あるある
          </h2>
          <ol className="flex flex-col gap-1.5">
            {t.aruaru.map((s, i) => (
              <li key={s} className="flex gap-3 rounded-xl bg-card px-3 py-2.5 text-sm ring-1 ring-line">
                <span className="num font-bold text-shu">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="guardian" className="flex flex-col gap-1.5 rounded-xl bg-wash p-4">
          <h2 id="guardian" className="text-sm font-bold text-ink">
            守護重神(準備中)
          </h2>
          <p className="text-sm font-bold">{t.guardian.trait}</p>
          <p className="text-xs text-ink2">{t.guardian.why}</p>
        </section>

        <section aria-labelledby="trips" className="flex flex-col gap-3">
          <h2 id="trips" className="text-lg font-bold">
            {t.name}におすすめの旅
          </h2>
          {trips.map((v) => (
            <TripCard key={v.id} video={v} wide />
          ))}
        </section>

        <section aria-labelledby="compat" className="flex flex-col gap-3">
          <div>
            <h2 id="compat" className="text-lg font-bold">
              ほかのタイプとの旅の相性
            </h2>
            <p className="text-xs text-mute">友だちのタイプを選ぶと、場面ごとの相性と二人に合う旅が出ます</p>
          </div>
          <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-card">
            {others.map((x) => (
              <li key={x.code}>
                <Link href={`/type/${t.code}/${x.code}`} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="num w-12 text-xs font-bold text-shu">{x.code}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold">{x.name}</span>
                  <span className="shrink-0 text-xs text-mute">{x.c.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-xs leading-relaxed text-mute">娯楽と自己理解のための診断です。性格検査や医学的な診断ではありません。</p>
      </div>
    </main>
  );
}
