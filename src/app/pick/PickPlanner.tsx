"use client";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { PrBadge } from "@/components/bits";
import { Icon } from "@/components/Icon";
import { Visual } from "@/components/Visual";
import type { PlanCandidate } from "@/lib/content";
import { useMyPlaces } from "@/lib/my-places";
import { cleanName, decodePlan, DEFAULT_PLAN_TITLE, encodePlan, mergePlans, newPlanId, type Plan, PLAN_LIMITS, planParam, tally, withVote } from "@/lib/plan";
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
    location.hash = `p=${encodePlan(plan)}`;
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
          className="inline-flex h-12 items-center justify-center gap-1.5 rounded-full bg-shu px-5 font-bold text-white disabled:bg-mute"
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

function PlanView({ param, candidates }: { param: string; candidates: PlanCandidate[] }) {
  const [store, setStore] = usePlansStore();
  const map = byKey(candidates);
  const incoming = decodePlan(param, (k) => map.has(k));
  const stored = incoming ? store.plans[incoming.id]?.plan : undefined;
  const plan = incoming ? mergePlans(stored, incoming) : null;
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
    track("plan_open", { items: plan.items.length, voters: Object.keys(plan.votes).length });
    // 相談が変わったときだけ動かす
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encoded]);

  if (!plan) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-card px-6 py-10 text-center" role="alert">
        <p className="font-bold">この相談のリンクを読み込めませんでした</p>
        <p className="text-sm text-ink2">リンクが途中で切れているかもしれません。送ってくれた人にもう一度送ってもらうか、新しく相談を作ってください。</p>
        <a href="/pick" className="inline-flex h-11 items-center rounded-full bg-shu px-5 text-sm font-bold text-white">
          新しく相談を作る
        </a>
      </div>
    );
  }

  const meName = cleanName(me);
  const mine = draft ?? (meName ? (plan.votes[meName] ?? []) : []);
  const rows = tally(plan);
  const voters = Object.keys(plan.votes);
  const top = rows[0] && rows[0].count > 0 && rows[0].count !== rows[1]?.count ? map.get(rows[0].item) : undefined;
  const isOwner = !!meName && meName === plan.by;
  const answered = !!meName && meName in plan.votes;
  // 押したけれど、まだリンクに入れていない
  const changed = !!meName && draft !== null && JSON.stringify([...draft].sort()) !== JSON.stringify([...(plan.votes[meName] ?? [])].sort());
  const unsaved = changed || (!!meName && !answered);

  function save() {
    if (!meName || !plan) return;
    const next = withVote(plan, meName, mine);
    setStore({ ...withPlan(store, next), me: meName });
    setDraft(null);
    track("plan_vote", { picks: mine.length, voters: Object.keys(next.votes).length });
    location.hash = `p=${encodePlan(next)}`;
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
    } catch {
      // 閉じただけなら何もしない
    }
  }

  const sendLabel = isOwner || !plan.by ? "同行者に送る" : `${plan.by}さんに送り返す`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold text-mute">{isOwner ? "あなたが作った相談" : plan.by ? `${plan.by}さんからの相談` : "届いた相談"}</p>
        <h1 className="text-2xl font-bold">{plan.title}</h1>
        <p className="num text-sm text-ink2">
          候補{plan.items.length}つ ・ {voters.length ? `${voters.length}人が回答(${voters.join("、")})` : "まだだれも回答していません"}
        </p>
      </div>

      {top && (
        <div className="flex flex-col gap-2 rounded-xl bg-shu-soft p-4" data-plan-top={top.key}>
          <p className="text-xs font-bold text-ink2">いまいちばん「行きたい」が多い候補</p>
          <p className="font-bold">{top.title}</p>
          <Link href={top.href} className="inline-flex h-11 w-fit items-center gap-1.5 rounded-full bg-shu px-4 text-sm font-bold text-white">
            {top.kind === "trip" ? "旅程と宿を見る" : "場所を見る"}
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      )}

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
            className="h-11 rounded-xl border border-line bg-card px-3 text-base font-normal"
          />
        </label>
        <ol className="flex flex-col gap-2" aria-label="候補と集計">
          {rows.map(({ item, count, names }) => {
            const c = map.get(item)!;
            const on = mine.includes(item);
            return (
              <li key={item} className="flex flex-col gap-2 rounded-xl border border-line bg-card p-2.5" data-plan-item={item} data-count={count}>
                <Link href={c.href} className="flex gap-3">
                  <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-line">
                    <Visual visual={c.visual} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-mute">
                      {c.kind === "trip" ? "旅" : c.note} ・ {c.area}
                      {c.sponsored && <PrBadge />}
                    </span>
                    <span className="block text-sm leading-snug font-bold">{c.title}</span>
                    <span className="block text-xs text-mute">
                      {c.by}の動画 ・ {c.price}
                      {c.kind === "trip" && ` ・ ${c.note}`}
                    </span>
                  </span>
                </Link>
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-pressed={on}
                    disabled={!meName}
                    onClick={() => setDraft(on ? mine.filter((k) => k !== item) : [...mine, item])}
                    className={`inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold disabled:opacity-50 ${on ? "bg-shu text-white" : "bg-card text-ink ring-1 ring-line"}`}
                  >
                    <Icon name={on ? "check" : "plus"} className="h-4 w-4" />
                    行きたい
                  </button>
                  <span className="num min-w-0 flex-1 text-right text-xs text-mute">{count ? `${count}人:${names.join("、")}` : "まだ0人"}</span>
                </span>
              </li>
            );
          })}
        </ol>
        {!meName && <p className="text-xs text-mute">呼び名を入れると「行きたい」を押せます(本名でなくて大丈夫です)。</p>}
        <button
          type="button"
          onClick={save}
          disabled={!meName || !unsaved}
          className="inline-flex h-12 items-center justify-center rounded-full bg-shu px-5 font-bold text-white disabled:bg-line disabled:text-ink2"
        >
          {unsaved ? "選んだ内容をリンクに入れる" : "リンクに入っています"}
        </button>
      </section>

      <section aria-labelledby="share" className="flex flex-col gap-3 rounded-xl bg-wash p-4">
        <h2 id="share" className="font-bold">
          {sendLabel}
        </h2>
        <p className="text-xs leading-relaxed text-ink2">
          {isOwner
            ? "受け取った人が選んで送り返したリンクを開くと、この端末で全員分を合わせて数えます。"
            : "このリンクには、あなたの選んだ内容と、これまでの回答が入っています。"}
        </p>
        {changed && <p className="text-xs font-bold text-shu">先に「選んだ内容をリンクに入れる」を押してください。</p>}
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(planUrl(plan))}`}
            target="_blank"
            rel="noopener"
            onClick={() => track("plan_send", { via: "line" })}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-card px-4 text-sm font-bold ring-1 ring-line"
          >
            <span className="grid h-6 w-6 place-items-center rounded-md bg-[#06C755] text-xs font-bold text-white">LINE</span>
            LINEで送る
          </a>
          <button type="button" onClick={copy} className="inline-flex h-11 items-center gap-2 rounded-full bg-card px-4 text-sm font-bold ring-1 ring-line">
            <Icon name={sent === "copied" ? "check" : "copy"} className="h-4 w-4" />
            {sent === "copied" ? "コピーしました" : "リンクをコピー"}
          </button>
          {shareable && (
            <button
              type="button"
              onClick={nativeShare}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-card px-4 text-sm font-bold ring-1 ring-line"
            >
              <Icon name="share" className="h-4 w-4" />
              ほかのアプリで送る
            </button>
          )}
        </div>
        {sent === "failed" && <p className="text-xs text-shu">コピーできませんでした。アドレス欄のリンクをそのまま送ってください。</p>}
        <p className="text-xs leading-relaxed text-mute">
          呼び名と票はリンクの #
          より後ろだけに入り、タビオシのサーバーには送りません。リンクを受け取った人はだれでも中身を見られます。同じ呼び名は同じ人として数えます(最大
          {PLAN_LIMITS.voters}人)。
        </p>
      </section>

      <a href="/pick" className="inline-flex h-11 w-fit items-center text-sm font-bold text-shu underline">
        別の相談を作る
      </a>
    </div>
  );
}
