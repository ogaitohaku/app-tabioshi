"use client";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { PrBadge } from "@/components/bits";
import { Icon } from "@/components/Icon";
import { Visual } from "@/components/Visual";
import type { PlanCandidate } from "@/lib/content";
import { useMyPlaces } from "@/lib/my-places";
import {
  cleanName,
  decodePlan,
  DEFAULT_PLAN_TITLE,
  encodePlan,
  mergePlans,
  newPlanId,
  type Plan,
  PLAN_LIMITS,
  legacyVoters,
  planKey,
  planParam,
  tally,
  withDecision,
  withVote,
} from "@/lib/plan";
import { usePlansStore, withPlan } from "@/lib/plans-store";
import { useSavedTrips } from "@/lib/saved";
import { track } from "@/lib/track";

const onHash = (l: () => void) => {
  window.addEventListener("hashchange", l);
  return () => window.removeEventListener("hashchange", l);
};
const noop = () => () => {};
const canShare = () => "share" in navigator;

/**
 * 行き先をいっしょに決める。
 * - 候補を選んでリンクを作る → LINE などで同行者に送る
 * - 受け取った人は「行きたい」を押して、リンクを送り返す
 * - 送り返されたリンクを開くと、この端末の中で全員分の票を合わせて数える
 * 名前と票はリンクの # の後ろだけに入り、タビオシのサーバーには届かない。
 */
export function PickPlanner({ candidates }: { candidates: PlanCandidate[] }) {
  const hash = useSyncExternalStore(
    onHash,
    () => location.hash,
    () => "",
  );
  const param = planParam(hash);
  if (param) return <PlanView key={param} param={param} candidates={candidates} />;
  return <Builder candidates={candidates} />;
}

// 自分で作った・選び直した・決めた直後の相談には「このリンクで変わったこと」を出さない
let ownParam = "";
function openOwnPlan(plan: Plan) {
  ownParam = encodePlan(plan);
  location.hash = `p=${ownParam}`;
}

const byKey = (candidates: PlanCandidate[]) => new Map(candidates.map((c) => [c.key, c]));

function planUrl(plan: Plan) {
  return `${location.origin}/pick?ref=share#p=${encodePlan(plan)}`;
}

/* ───────── 相談を作る ───────── */

function Builder({ candidates }: { candidates: PlanCandidate[] }) {
  const { ids: tripIds } = useSavedTrips();
  const [mine] = useMyPlaces();
  const [store, setStore] = usePlansStore();
  const add = useSyncExternalStore(
    noop,
    () => new URLSearchParams(location.search).get("add"),
    () => null,
  );
  const [picked, setPicked] = useState<string[] | null>(null);
  const [title, setTitle] = useState("");
  const [name, setName] = useState<string | null>(null);
  const map = byKey(candidates);
  const chosen = picked ?? (add && map.has(add) ? [add] : []);
  const me = name ?? store.me;

  const savedKeys = new Set([...tripIds.map((id) => `t:${id}`), ...Object.keys(mine.saved).map((id) => `p:${id}`)]);
  const saved = candidates.filter((c) => savedKeys.has(c.key));
  const otherTrips = candidates.filter((c) => c.kind === "trip" && !savedKeys.has(c.key));
  const full = chosen.length >= PLAN_LIMITS.items;
  const ready = chosen.length >= PLAN_LIMITS.minItems && cleanName(me);

  const toggle = (key: string) => setPicked(chosen.includes(key) ? chosen.filter((k) => k !== key) : full ? chosen : [...chosen, key]);

  function create() {
    if (!ready) return;
    const plan: Plan = {
      v: 1,
      id: newPlanId(),
      title: title.trim().slice(0, PLAN_LIMITS.title) || DEFAULT_PLAN_TITLE,
      by: cleanName(me),
      items: chosen,
      votes: {},
    };
    setStore({ ...withPlan(store, plan), me: cleanName(me) });
    track("plan_create", { items: chosen.length, saved: chosen.filter((k) => savedKeys.has(k)).length });
    openOwnPlan(plan);
  }

  const past = Object.values(store.plans).sort((a, b) => b.at.localeCompare(a.at));

  const option = (c: PlanCandidate) => {
    const on = chosen.includes(c.key);
    return (
      <li key={c.key}>
        <button
          type="button"
          aria-pressed={on}
          disabled={!on && full}
          onClick={() => toggle(c.key)}
          data-candidate={c.key}
          className={`flex w-full items-center gap-3 rounded-xl border bg-card p-2.5 text-left disabled:opacity-50 ${on ? "border-shu ring-1 ring-shu" : "border-line"}`}
        >
          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-line">
            <Visual visual={c.visual} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-xs font-bold text-mute">
              {c.kind === "trip" ? "旅" : c.note} ・ {c.area}
              {c.sponsored && <PrBadge />}
            </span>
            <span className="line-clamp-2 block text-sm leading-snug font-bold">{c.title}</span>
            <span className="block text-xs text-mute">
              {c.by}の動画 ・ {c.price}
            </span>
          </span>
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${on ? "bg-shu text-white" : "ring-1 ring-line"}`}>
            {on && <Icon name="check" className="h-4 w-4" />}
          </span>
        </button>
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">行き先をいっしょに決める</h1>
        <p className="text-sm leading-relaxed text-ink2">
          候補を2〜6つ選んでリンクを作り、LINE などで同行者に送ります。相手は登録なしで「行きたい」を押して送り返せます。
        </p>
      </div>

      {past.length > 0 && (
        <section aria-labelledby="past" className="flex flex-col gap-2">
          <h2 id="past" className="text-lg font-bold">
            これまでの相談
          </h2>
          <ul className="flex flex-col gap-2">
            {past.map(({ plan }) => (
              <li key={plan.id}>
                <a
                  href={`/pick#p=${encodePlan(plan)}`}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-line bg-card px-4 py-2.5"
                >
                  <span className="min-w-0 truncate font-bold">{plan.title}</span>
                  <span className="num shrink-0 text-xs text-mute">
                    {Object.keys(plan.votes).length}人が回答 ・ 候補{plan.items.length}つ
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="choose" className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <h2 id="choose" className="text-lg font-bold">
            1. 候補を選ぶ
          </h2>
          <span className="num text-xs text-mute" role="status">
            {chosen.length} / {PLAN_LIMITS.items}つ
          </span>
        </div>
        {saved.length > 0 && (
          <>
            <h3 className="text-sm font-bold text-ink2">マイ旅に保存したもの</h3>
            <ul className="flex flex-col gap-2">{saved.map(option)}</ul>
          </>
        )}
        <h3 className="text-sm font-bold text-ink2">{saved.length ? "ほかの旅" : "推しの旅から選ぶ"}</h3>
        <ul className="flex flex-col gap-2">{otherTrips.map(option)}</ul>
      </section>

      <section aria-labelledby="send" className="flex flex-col gap-3">
        <h2 id="send" className="text-lg font-bold">
          2. 相談の名前とあなたの呼び名
        </h2>
        <label className="flex flex-col gap-1 text-sm font-bold">
          相談の名前(なくても大丈夫)
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={PLAN_LIMITS.title}
            placeholder={DEFAULT_PLAN_TITLE}
            className="h-11 rounded-xl border border-line bg-card px-3 text-base font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold">
          あなたの呼び名(相手に表示されます)
          <input
            value={me}
            onChange={(e) => setName(e.target.value)}
            maxLength={PLAN_LIMITS.name}
            placeholder="例:ゆう"
            autoComplete="nickname"
            className="h-11 rounded-xl border border-line bg-card px-3 text-base font-normal"
          />
        </label>
        <button
          type="button"
          onClick={create}
          disabled={!ready}
          className="btn btn-main min-h-12 w-full text-base"
        >
          候補のリンクを作る
        </button>
        <p className="text-xs leading-relaxed text-mute">
          {chosen.length < PLAN_LIMITS.minItems
            ? `候補をあと${PLAN_LIMITS.minItems - chosen.length}つ選んでください。`
            : !cleanName(me)
              ? "呼び名を入れてください(本名でなくて大丈夫です)。"
              : "名前と選んだ候補はリンクの中だけに入ります。タビオシのサーバーには送りません。"}
        </p>
      </section>
    </div>
  );
}

/* ───────── 相談を見る・選ぶ・送る ───────── */

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

function PlanView({ param, candidates }: { param: string; candidates: PlanCandidate[] }) {
  const [store, setStore] = usePlansStore();
  const map = byKey(candidates);
  // リンクも端末の保存も、前の版の形を含めていまの形に直して読む(plan.ts の normalizePlan / migratePlansStore)
  const parsed = decodePlan(param);
  // 掲載中の候補が1つもない相談は開けない(掲載が終わった候補は消さずに残し、表示だけ外す)
  const incoming = parsed && parsed.items.some((k) => map.has(k)) ? parsed : null;
  const key = incoming ? planKey(incoming) : "";
  const fromStore = () => (key ? store.plans[key]?.plan : undefined);
  // 開いた時点で手元にあった版(このリンクで何が変わったかを伝えるため、開いたときの状態を覚えておく)
  const [before] = useState(fromStore);
  const stored = fromStore();
  const plan = incoming ? mergePlans(stored, incoming).plan : null;
  const report = incoming && before && param !== ownParam ? mergePlans(before, incoming).report : null;
  const encoded = plan ? encodePlan(plan) : "";
  const [name, setName] = useState<string | null>(null);
  const me = name ?? store.me;
  const [draft, setDraft] = useState<string[] | null>(null);
  const [sent, setSent] = useState<"" | "copied" | "failed">("");
  const shareable = useSyncExternalStore(noop, canShare, () => false);

  // 届いたリンクの票を、この端末の相談に合わせて残す
  useEffect(() => {
    if (!plan) return;
    if (!stored || encodePlan(stored) !== encoded) setStore(withPlan(store, plan));
    // 開いたことだけを数える(名前や候補は送らない)
    track("plan_open", { items: plan.items.length, voters: Object.keys(plan.votes).length, decided: !!plan.decided?.item });
    // 相談が変わったときだけ動かす
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encoded]);

  if (!plan) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-card px-6 py-10 text-center" role="alert">
        <p className="font-bold">{parsed ? "この相談の候補は、いまは掲載されていません" : "この相談のリンクを読み込めませんでした"}</p>
        <p className="text-sm text-ink2">
          リンクが途中で切れているかもしれません。送ってくれた人にもう一度送ってもらうか、新しく相談を作ってください。この端末で前に開いた相談は「これまでの相談」から開けます。
        </p>
        <a href="/pick" className="btn btn-main">
          これまでの相談・新しく作る
        </a>
      </div>
    );
  }

  const meName = cleanName(me);
  const myVote = meName ? plan.votes[meName] : undefined;
  const mine = draft ?? myVote?.p ?? [];
  const rows = tally(plan).filter((r) => map.has(r.item));
  const hidden = plan.items.filter((k) => !map.has(k)).length;
  const legacy = legacyVoters(plan);
  const voters = Object.keys(plan.votes);
  const top = rows[0] && rows[0].count > 0 && rows[0].count !== rows[1]?.count ? map.get(rows[0].item) : undefined;
  const decided = plan.decided?.item ? map.get(plan.decided.item) : undefined;
  const isOwner = !!meName && meName === plan.by;
  // 押したけれど、まだリンクに入れていない
  const changed = !!meName && draft !== null && !sameSet(draft, myVote?.p ?? []);
  const unsaved = changed || (!!meName && !myVote);

  function commit(next: Plan) {
    setStore({ ...withPlan(store, next), me: meName });
    setSent("");
    openOwnPlan(next);
  }

  function save() {
    if (!meName || !plan) return;
    const next = withVote(plan, meName, mine);
    if (next === plan) return; // 上限人数
    setDraft(null);
    track("plan_vote", { picks: mine.length, voters: Object.keys(next.votes).length, changed: !!myVote });
    commit(next);
  }

  function decide(item: string | null) {
    if (!plan) return;
    track("plan_decide", { undo: item === null, votes: item ? (rows.find((r) => r.item === item)?.count ?? 0) : 0 });
    commit(withDecision(plan, item));
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(planUrl(plan!));
      setSent("copied");
      track("plan_send", { via: "copy" });
    } catch {
      setSent("failed");
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: plan!.title, text: `「${plan!.title}」行きたいところを選んでね|タビオシ`, url: planUrl(plan!) });
      track("plan_send", { via: "native" });
    } catch (e) {
      // 閉じただけなら何もしない(送ったことにはしない)。それ以外の失敗はリンクを直接見せる
      if ((e as Error).name !== "AbortError") setSent("failed");
    }
  }

  const sendLabel = isOwner || !plan.by ? "同行者に送る" : `${plan.by}さんに送り返す`;
  const full = !myVote && voters.length >= PLAN_LIMITS.voters;

  const maxCount = Math.max(1, voters.length);
  const topRow = rows[0];

  return (
    <div className="flex flex-col gap-6">
      {/* 1. どの相談か(題・回答した人)と、この数がどこまでの集計か。説明は短い1文にし、くわしくは開いて読む */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold text-ink2">{isOwner ? "あなたが作った相談" : plan.by ? `${plan.by}さんからの相談` : "届いた相談"}</p>
          <h1 className="text-2xl leading-snug font-bold">{plan.title}</h1>
          <p className="num text-sm text-ink2">
            候補{plan.items.length}つ ・ {voters.length ? `${voters.length}人が回答(${voters.join("、")})` : "まだだれも回答していません"}
          </p>
        </div>
        <div className="flex flex-col gap-1 border-l-2 border-line pl-3 text-xs leading-relaxed text-ink2" data-sync-note>
          {isOwner ? (
            <p>
              <span className="font-bold text-ink">この端末の中だけの集計です。</span>ほかの端末とは同期しません。
            </p>
          ) : (
            <p>
              <span className="font-bold text-ink">このリンクに入っている回答だけを数えています。</span>全員分は、送り返したリンクを
              {plan.by ? `${plan.by}さん` : "相談した人"}
              が開いたときに、その人の端末でそろいます。
            </p>
          )}
          {report && (report.added.length > 0 || report.updated.length > 0 || report.kept.length > 0 || report.dropped.length > 0) && (
            <ul className="flex flex-col gap-0.5 font-bold text-ink" role="status" aria-label="このリンクで変わったこと">
              {report.added.length > 0 && <li>このリンクで加わった回答:{report.added.join("、")}</li>}
              {report.updated.length > 0 && <li>選び直しを反映:{report.updated.join("、")}</li>}
              {report.kept.length > 0 && <li>このリンクの回答は古いので、手元の新しい回答のままにしました:{report.kept.join("、")}</li>}
              {report.dropped.length > 0 && (
                <li>
                  {PLAN_LIMITS.voters}人を超えたので入れていません:{report.dropped.join("、")}
                </li>
              )}
            </ul>
          )}
          {legacy.length > 0 && (
            <p data-legacy-note>
              前の版で入った回答(いつ選んだかの記録がないもの)は、いちばん古い回答として数えています:{legacy.join("、")}
              。本人が選び直すと、新しい回答に置き換わります。
            </p>
          )}
          {hidden > 0 && <p>掲載が終わった候補が{hidden}つあるため、表示していません(相談の中には残しています)。</p>}
          {report && !report.added.length && !report.updated.length && !report.kept.length && !report.dropped.length && (
            <p role="status">このリンクは、この端末の集計にすでに入っています(数は変わりません)。</p>
          )}
          <details className="group">
            <summary className="inline-flex min-h-11 cursor-pointer items-center font-bold text-ink2 underline">集計のしくみ</summary>
            <p>
              {isOwner
                ? "サーバーには保存しません。送り返されたリンクをこの端末で開いた分だけ数えています。まだ開いていない人の回答は入っていません。別の端末やブラウザでは、そこで開いたリンクの分だけになります。"
                : "ほかの人の回答は、まだ入っていないことがあります。サーバーには保存しません。"}
            </p>
          </details>
        </div>
      </div>

      {/* 2. 決まった行き先、またはいま多い候補(この画面の主役) */}
      {decided ? (
        <div className="flex flex-col gap-2 rounded-xl border border-shu bg-shu-soft p-4" data-plan-decided={decided.key}>
          <p className="text-xs font-bold text-ink2">{plan.by ? `${plan.by}さんが決めた行き先` : "決まった行き先"}</p>
          <div className="flex gap-3">
            <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-line">
              <Visual visual={decided.visual} />
            </span>
            <p className="min-w-0 leading-snug font-bold">{decided.title}</p>
          </div>
          <p className="text-xs text-ink2">まだ予約はされていません。宿の予約は、旅程のページから予約サイトで行います。</p>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={decided.href} className="btn btn-main">
              {decided.kind === "trip" ? "旅程と宿を見る" : "場所を見る"}
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
            {isOwner && (
              <button type="button" onClick={() => decide(null)} className="btn text-ink2 underline">
                決定を取り消す
              </button>
            )}
          </div>
        </div>
      ) : (
        top && (
          <div className="flex flex-col gap-2 rounded-xl border border-line bg-card p-4" data-plan-top={top.key}>
            <p className="text-xs font-bold text-ink2">いま「行きたい」がいちばん多い候補(まだ決定ではありません)</p>
            <div className="flex gap-3">
              <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-line">
                <Visual visual={top.visual} />
              </span>
              <span className="min-w-0">
                <span className="block leading-snug font-bold">{top.title}</span>
                <span className="num mt-0.5 block text-sm text-ink2">
                  {topRow.count}人 / {voters.length}人が行きたい
                </span>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {isOwner && (
                <button type="button" onClick={() => decide(top.key)} className="btn btn-main">
                  <Icon name="check" className="h-4 w-4" />
                  ここに決める
                </button>
              )}
              <Link href={top.href} className="btn btn-sub">
                {top.kind === "trip" ? "旅程と宿を見る" : "場所を見る"}
              </Link>
            </div>
          </div>
        )
      )}

      {/* 3. 候補を並べて比べる。数は棒の長さと数字で、だれが選んだかは小さく */}
      <section aria-labelledby="vote" className="flex flex-col gap-3">
        <h2 id="vote" className="text-lg font-bold">
          行きたいところを選ぶ(いくつでも)
        </h2>
        <label className="flex flex-col gap-1 text-sm font-bold">
          あなたの呼び名
          <input
            value={me}
            onChange={(e) => {
              setName(e.target.value);
              setDraft(null);
            }}
            maxLength={PLAN_LIMITS.name}
            placeholder="例:ゆう"
            autoComplete="nickname"
            aria-describedby={!meName ? "pick-name-hint" : undefined}
            className="h-11 rounded-xl border border-line bg-card px-3 text-base font-normal"
          />
        </label>
        {!meName && (
          <p id="pick-name-hint" className="-mt-1 text-xs text-ink2">
            呼び名を入れると「行きたい」を押せます(本名でなくて大丈夫です)。
          </p>
        )}
        {myVote && !changed && <p className="-mt-1 text-xs text-ink2">「{meName}」の回答はリンクに入っています。選び直すと、新しい方が数えられます。</p>}
        <ol className="flex flex-col gap-2" aria-label="候補と集計">
          {rows.map(({ item, count, names }) => {
            const c = map.get(item)!;
            const on = mine.includes(item);
            return (
              <li
                key={item}
                className={`flex flex-col gap-2.5 rounded-xl border bg-card p-3 ${on ? "border-shu" : "border-line"}`}
                data-plan-item={item}
                data-count={count}
              >
                <Link href={c.href} className="flex gap-3">
                  <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-line">
                    <Visual visual={c.visual} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-ink2">
                      {c.kind === "trip" ? "旅" : c.note} ・ {c.area}
                      {c.sponsored && <PrBadge />}
                    </span>
                    <span className="block text-sm leading-snug font-bold">{c.title}</span>
                    <span className="mt-0.5 block text-xs text-mute">
                      {c.by}の動画 ・ <span className="num">{c.price}</span>
                      {c.kind === "trip" && ` ・ ${c.note}`}
                    </span>
                  </span>
                </Link>
                <span className="flex items-center gap-2" aria-hidden="true">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-wash">
                    <span className="block h-full rounded-full bg-ink2" style={{ width: `${(count / maxCount) * 100}%` }} />
                  </span>
                  <span className="num w-10 text-right text-sm font-bold">{count}人</span>
                </span>
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-pressed={on}
                    disabled={!meName || full}
                    onClick={() => setDraft(on ? mine.filter((k) => k !== item) : [...mine, item])}
                    className={`btn ${on ? "btn-on" : "btn-sub"}`}
                  >
                    <Icon name={on ? "check" : "plus"} className="h-4 w-4" />
                    行きたい
                  </button>
                  <span className="num min-w-0 flex-1 text-right text-xs text-ink2">{count ? `${count}人:${names.join("、")}` : "まだ0人"}</span>
                </span>
              </li>
            );
          })}
        </ol>
        {full && <p className="text-xs text-shu">この相談は{PLAN_LIMITS.voters}人が回答済みのため、新しい呼び名では回答できません。</p>}
        {/* 押したけれどリンクに入れていない間は、下のメニューの上に止めて見えるようにする */}
        <div className={changed && !full ? "sticky bottom-[calc(3.5rem+1px+0.75rem+env(safe-area-inset-bottom,0px))] z-10" : ""}>
          <button type="button" onClick={save} disabled={!meName || !unsaved || full} className="btn btn-main min-h-12 w-full text-base">
            {unsaved ? "選んだ内容をリンクに入れる" : (
              <>
                <Icon name="check" className="h-4 w-4" />
                リンクに入っています
              </>
            )}
          </button>
        </div>
      </section>

      <section aria-labelledby="share" className="flex flex-col gap-3 rounded-xl bg-wash p-4">
        <h2 id="share" className="font-bold">
          {sendLabel}
        </h2>
        <p className="text-xs leading-relaxed text-ink2">
          {isOwner
            ? decided
              ? "決まったことを同行者に知らせるには、このリンクを送ってください。"
              : "受け取った人が選んで送り返したリンクをこの端末で開くと、合わせて数えます。"
            : "このリンクには、あなたの選んだ内容と、これまでの回答が入っています。送り返すまで相手には届きません。"}
        </p>
        {changed && <p className="text-xs font-bold text-shu">先に「選んだ内容をリンクに入れる」を押してください。</p>}
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(planUrl(plan))}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("plan_send", { via: "line" })}
            className="btn btn-sub"
          >
            <span className="grid h-6 w-6 place-items-center rounded-md bg-[#06C755] text-xs font-bold text-white">LINE</span>
            LINEで送る
          </a>
          <button type="button" onClick={copy} className={`btn ${sent === "copied" ? "btn-on" : "btn-sub"}`}>
            <Icon name={sent === "copied" ? "check" : "copy"} className="h-4 w-4" />
            {sent === "copied" ? "コピーしました" : "リンクをコピー"}
          </button>
          {shareable && (
            <button
              type="button"
              onClick={nativeShare}
              className="btn btn-sub"
            >
              <Icon name="share" className="h-4 w-4" />
              ほかのアプリで送る
            </button>
          )}
        </div>
        {sent === "failed" && (
          <label className="flex flex-col gap-1 text-xs text-shu">
            うまく送れませんでした。下のリンクを長押ししてコピーし、送ってください。
            <input
              readOnly
              value={planUrl(plan)}
              onFocus={(e) => e.currentTarget.select()}
              className="h-11 rounded-xl border border-line bg-card px-3 text-sm text-ink"
              data-plan-url
            />
          </label>
        )}
        <details className="text-xs leading-relaxed text-ink2">
          <summary className="inline-flex min-h-11 cursor-pointer items-center font-bold underline">送る内容と、届く範囲</summary>
          <p>
            呼び名と票はリンクの # より後ろだけに入り、タビオシのサーバーには送りません。ただし、リンクを送ったアプリ(LINE
            など)と、リンクを受け取った人には中身が届きます。同じ呼び名は同じ人として数えます(最大
            {PLAN_LIMITS.voters}人)。「送る」を押しても、相手が開いたかどうかはわかりません。
          </p>
        </details>
      </section>

      <a href="/pick" className="inline-flex h-11 w-fit items-center text-sm font-bold text-shu underline">
        これまでの相談・別の相談を作る
      </a>
    </div>
  );
}
