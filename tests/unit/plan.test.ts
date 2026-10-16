// 「行き先をいっしょに決める」のリンクの中身(候補と票)と、送り返された票の合わせ方を確かめる。
// 実行: npm run test:unit
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  decodePlan,
  DEFAULT_PLAN_TITLE,
  encodePlan,
  mergePlans,
  type Plan,
  PLAN_LIMITS,
  planKey,
  planParam,
  tally,
  withDecision,
  withVote,
} from "../../src/lib/plan.ts";

const known = (k: string) => ["t:beppu", "t:otaru", "t:tadami", "t:onomichi", "p:otaru-canal", "p:akari"].includes(k);
const base: Plan = { v: 1, id: "abc123def0", title: "冬の旅", by: "ゆう", items: ["t:beppu", "t:otaru", "p:otaru-canal"], votes: {} };
const T = 1_760_600_000; // 2025-10-16 ごろ(秒)
const roundTrip = (p: Plan) => decodePlan(encodePlan(p), known)!;
const merge = (a: Plan | undefined, b: Plan) => mergePlans(a, b).plan;

test("日本語の名前が入っても、リンクにして戻すと同じ中身", () => {
  const p = withDecision(withVote(base, "みさき", ["t:otaru"], T), "t:otaru", T + 5);
  const s = encodePlan(p);
  assert.match(s, /^[A-Za-z0-9_-]+$/, "URL にそのまま入る文字だけ");
  assert.deepEqual(roundTrip(p), p);
});

test("壊れたリンクは null(画面は読み込めない旨を出す)", () => {
  assert.equal(decodePlan("%%%", known), null);
  const s = encodePlan(base);
  assert.equal(decodePlan(s.slice(0, Math.floor(s.length / 2)), known), null, "途中で切れたリンク");
  assert.equal(decodePlan(s.slice(0, -1) + "*", known), null, "使えない文字が混ざったリンク");
  assert.equal(decodePlan(encodePlan({ ...base, v: 2 } as unknown as Plan), known), null);
  assert.equal(decodePlan(encodePlan({ ...base, items: ["t:nai"] }), known), null, "知らない候補しかなければ null");
});

test("知らない候補・重複・上限を超えた分・形の崩れた票は落とし、名前は12文字・題は30文字まで", () => {
  const raw = {
    ...base,
    title: "あ".repeat(40),
    items: ["t:beppu", "t:beppu", "t:nai", "t:otaru", "t:tadami", "p:otaru-canal", "t:onomichi", "p:akari"],
    votes: {
      ["な".repeat(20)]: { p: ["t:beppu", "t:nai"], t: T },
      "": { p: ["t:beppu"], t: T },
      時刻なし: { p: ["t:beppu"] },
      配列だけ: ["t:beppu"],
    },
    decided: { item: "t:nai", t: T },
  };
  const p = decodePlan(encodePlan(raw as unknown as Plan), known)!;
  assert.deepEqual(p.items, ["t:beppu", "t:otaru", "t:tadami", "p:otaru-canal", "t:onomichi", "p:akari"]);
  assert.equal(p.title.length, 30);
  assert.deepEqual(p.votes, { ["な".repeat(12)]: { p: ["t:beppu"], t: T } });
  assert.equal(p.decided, undefined, "候補にない決定は捨てる");
});

test("題がなければ決まった題にする", () => {
  assert.equal(roundTrip({ ...base, title: " " }).title, DEFAULT_PLAN_TITLE);
});

test("回答できるのは10人まで(すでに回答した人は選び直せる)", () => {
  let p = base;
  for (let i = 0; i < 12; i++) p = withVote(p, `人${i}`, ["t:beppu"], T);
  assert.equal(Object.keys(p.votes).length, PLAN_LIMITS.voters);
  p = withVote(p, "人0", ["t:otaru"], T + 1);
  assert.deepEqual(p.votes["人0"].p, ["t:otaru"]);
});

test("選び直すと時刻は必ず進む(端末の時計が戻っていても)", () => {
  const a = withVote(base, "みさき", ["t:beppu"], T + 100);
  const b = withVote(a, "みさき", ["t:otaru"], T); // 時計が戻った
  assert.ok(b.votes["みさき"].t > a.votes["みさき"].t);
});

test("別々に送り返されたリンクを順に開くと、全員分がそろう", () => {
  const sent = withVote(base, "ゆう", ["p:otaru-canal"], T);
  const fromMisaki = withVote(sent, "みさき", ["t:otaru", "t:beppu"], T + 10);
  const fromKen = withVote(sent, "けん", ["t:otaru"], T + 20);
  const r1 = mergePlans(sent, fromMisaki);
  assert.deepEqual(r1.report.added, ["みさき"]);
  const r2 = mergePlans(r1.plan, fromKen);
  assert.deepEqual(r2.report.added, ["けん"]);
  assert.deepEqual(Object.keys(r2.plan.votes).sort(), ["けん", "みさき", "ゆう"]);
  const rows = tally(r2.plan);
  assert.equal(rows[0].item, "t:otaru");
  assert.equal(rows[0].count, 2);
  assert.deepEqual(rows[0].names.sort(), ["けん", "みさき"]);
  assert.equal(rows[1].item, "t:beppu");
  assert.equal(rows[2].item, "p:otaru-canal", "同じ数なら最初の並び順");
});

test("同じリンクを何度開いても(再読み込み)、数は増えない", () => {
  const link = withVote(base, "みさき", ["t:otaru"], T);
  let local = merge(undefined, link);
  for (let i = 0; i < 3; i++) {
    const r = mergePlans(local, roundTrip(link));
    assert.deepEqual(r.report, { added: [], updated: [], kept: [], dropped: [] });
    local = r.plan;
  }
  assert.equal(tally(local).find((r) => r.item === "t:otaru")!.count, 1);
});

test("同じ人が選び直したリンクのあとに古いリンク(転送・見返し)を開いても、新しい回答が残る", () => {
  const old = withVote(base, "みさき", ["t:otaru"], T);
  const newer = withVote(old, "みさき", ["t:beppu"], T + 60);
  let local = merge(undefined, newer);
  const r = mergePlans(local, roundTrip(old));
  assert.deepEqual(r.report.kept, ["みさき"], "古い方を使わなかったと伝える");
  local = r.plan;
  assert.deepEqual(local.votes["みさき"].p, ["t:beppu"]);
  // 逆の順(古い→新しい)でも同じ結果
  const r2 = mergePlans(merge(undefined, old), newer);
  assert.deepEqual(r2.report.updated, ["みさき"]);
  assert.deepEqual(r2.plan.votes, local.votes);
});

test("どれも選ばずに選び直すと、前の票は消える(古いリンクで戻らない)", () => {
  const a = withVote(base, "みさき", ["t:beppu"], T);
  const b = withVote(a, "みさき", [], T + 30);
  assert.deepEqual(b.votes["みさき"].p, []);
  assert.deepEqual(merge(a, roundTrip(b)).votes["みさき"].p, []);
  assert.deepEqual(merge(b, roundTrip(a)).votes["みさき"].p, [], "古いリンクを後から開いても戻らない");
  assert.equal(tally(merge(b, a)).find((r) => r.item === "t:beppu")!.count, 0);
});

test("転送されたリンクに別の人が回答しても、二重に数えない(名前ごとに1票)", () => {
  const fromMisaki = withVote(base, "みさき", ["t:otaru"], T);
  const forwardedAndKen = withVote(fromMisaki, "けん", ["t:otaru"], T + 5); // みさきの回答入りのリンクがけんに転送された
  const local = merge(merge(undefined, fromMisaki), forwardedAndKen);
  assert.equal(tally(local).find((r) => r.item === "t:otaru")!.count, 2);
  assert.deepEqual(Object.keys(local.votes).sort(), ["けん", "みさき"]);
});

test("候補が違う相談は合わせない(候補を変えたら別の相談)", () => {
  const a = withVote(base, "みさき", ["t:otaru"], T);
  const changed = { ...base, items: ["t:beppu", "t:tadami"], votes: { けん: { p: ["t:tadami"], t: T } } };
  assert.notEqual(planKey(a), planKey(changed));
  const r = mergePlans(a, changed);
  assert.deepEqual(r.plan, changed, "届いた方をそのまま使い、みさきの票を混ぜない");
});

test("違う相談のリンクは合わせない", () => {
  const other: Plan = { ...base, id: "zzz999yyy8", votes: { けん: { p: ["t:beppu"], t: T } } };
  assert.deepEqual(merge(withVote(base, "ゆう", ["t:otaru"], T), other), other);
});

test("上限を超える回答は入れず、入れなかったと伝える", () => {
  let local = base;
  for (let i = 0; i < 10; i++) local = withVote(local, `人${i}`, ["t:beppu"], T);
  const extra: Plan = { ...base, votes: { 新しい人: { p: ["t:otaru"], t: T } } };
  const r = mergePlans(local, extra);
  assert.deepEqual(r.report.dropped, ["新しい人"]);
  assert.equal(Object.keys(r.plan.votes).length, 10);
});

test("「ここに決める」は新しい方が残り、取り消しも伝わる。決定と票は別に数える", () => {
  const voted = withVote(base, "みさき", ["t:otaru"], T);
  const decided = withDecision(voted, "t:otaru", T + 10);
  assert.equal(decided.decided!.item, "t:otaru");
  assert.equal(merge(voted, decided).decided!.item, "t:otaru");
  assert.equal(merge(decided, voted).decided!.item, "t:otaru", "決定前の古いリンクを開いても決定は消えない");
  const undone = withDecision(decided, null, T + 20);
  assert.equal(merge(decided, undone).decided!.item, null);
  assert.equal(merge(undone, decided).decided!.item, null, "取り消しの後に古い決定リンクを開いても戻らない");
  assert.equal(withDecision(voted, "t:nai").decided, undefined, "候補にないものは決められない");
  assert.equal(tally(decided)[0].count, 1, "決定しても票は増えない");
});

test("リンクの長さ:候補6つ・10人・12文字の名前・全員が全部選んだ、いちばん長い場合", () => {
  let p: Plan = { ...base, title: "あ".repeat(30), by: "ゆ".repeat(12), items: ["t:beppu", "t:otaru", "t:tadami", "t:onomichi", "p:otaru-canal", "p:akari"] };
  for (let i = 0; i < 10; i++) p = withVote(p, `${"名".repeat(11)}${i}`, p.items, T + i);
  p = withDecision(p, "t:otaru", T + 99);
  const url = `https://app-tabioshi.vercel.app/pick?ref=share#p=${encodePlan(p)}`;
  assert.deepEqual(roundTrip(p), p);
  // 実際のアプリで切れずに届くかは実機で確かめる。ここでは長さが想定(2,500文字未満)を超えないことだけを見る
  assert.ok(url.length < 2500, `${url.length}文字`);
  console.log(`  いちばん長いリンク: ${url.length}文字`);
});

test("# の後ろから相談の部分を取り出す", () => {
  assert.equal(planParam("#p=abc_-9"), "abc_-9");
  assert.equal(planParam("#x=1&p=abc"), "abc");
  assert.equal(planParam(""), null);
  assert.equal(planParam("#top"), null);
});
