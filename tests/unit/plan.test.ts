// 「行き先をいっしょに決める」のリンクの中身(候補と票)を確かめる。
// 実行: npm run test:unit
import assert from "node:assert/strict";
import { test } from "node:test";
import { decodePlan, DEFAULT_PLAN_TITLE, encodePlan, mergePlans, type Plan, planParam, tally, withVote } from "../../src/lib/plan.ts";

const known = (k: string) => ["t:beppu", "t:otaru", "t:tadami", "p:otaru-canal"].includes(k);
const base: Plan = { v: 1, id: "abc123def0", title: "冬の旅", by: "ゆう", items: ["t:beppu", "t:otaru", "p:otaru-canal"], votes: {} };

test("日本語の名前が入っても、リンクにして戻すと同じ中身", () => {
  const p = withVote(base, "みさき", ["t:otaru"]);
  const s = encodePlan(p);
  assert.match(s, /^[A-Za-z0-9_-]+$/, "URL にそのまま入る文字だけ");
  assert.deepEqual(decodePlan(s, known), p);
});

test("壊れたリンクは null(画面は読み込めない旨を出す)", () => {
  assert.equal(decodePlan("%%%", known), null);
  assert.equal(decodePlan(encodePlan(base).slice(0, 10), known), null);
  assert.equal(decodePlan(encodePlan({ ...base, v: 2 } as unknown as Plan), known), null);
  assert.equal(decodePlan(encodePlan({ ...base, items: ["t:nai"] }), known), null, "知らない候補しかなければ null");
});

test("知らない候補・重複・上限を超えた分は落とし、名前は12文字・題は30文字まで", () => {
  const raw = {
    ...base,
    title: "あ".repeat(40),
    items: ["t:beppu", "t:beppu", "t:nai", "t:otaru", "t:tadami", "p:otaru-canal"],
    votes: { ["な".repeat(20)]: ["t:beppu", "t:nai"], "": ["t:beppu"], 悪い形: "t:beppu" },
  };
  const p = decodePlan(encodePlan(raw as unknown as Plan), known)!;
  assert.deepEqual(p.items, ["t:beppu", "t:otaru", "t:tadami", "p:otaru-canal"]);
  assert.equal(p.title.length, 30);
  assert.deepEqual(p.votes, { ["な".repeat(12)]: ["t:beppu"] });
});

test("題がなければ決まった題にする", () => {
  assert.equal(decodePlan(encodePlan({ ...base, title: " " }), known)!.title, DEFAULT_PLAN_TITLE);
});

test("回答できるのは10人まで(すでに回答した人は選び直せる)", () => {
  let p = base;
  for (let i = 0; i < 12; i++) p = withVote(p, `人${i}`, ["t:beppu"]);
  assert.equal(Object.keys(p.votes).length, 10);
  p = withVote(p, "人0", ["t:otaru"]);
  assert.deepEqual(p.votes["人0"], ["t:otaru"]);
});

test("どれも選ばずに送ると空で残り、前の票は消える", () => {
  const a = withVote(base, "みさき", ["t:beppu"]);
  const b = withVote(a, "みさき", []);
  assert.deepEqual(b.votes, { みさき: [] });
  // 手元に古い票が残っていても、届いたリンクの「選ばなかった」が勝つ
  assert.deepEqual(mergePlans(a, decodePlan(encodePlan(b), known)!).votes, { みさき: [] });
});

test("別々に送り返されたリンクを順に開くと、全員分がそろう", () => {
  const sent = withVote(base, "ゆう", ["p:otaru-canal"]);
  const fromMisaki = withVote(sent, "みさき", ["t:otaru", "t:beppu"]);
  const fromKen = withVote(sent, "けん", ["t:otaru"]);
  let local = mergePlans(sent, fromMisaki);
  local = mergePlans(local, fromKen);
  assert.deepEqual(Object.keys(local.votes).sort(), ["けん", "みさき", "ゆう"]);
  const rows = tally(local);
  assert.equal(rows[0].item, "t:otaru");
  assert.equal(rows[0].count, 2);
  assert.deepEqual(rows[0].names.sort(), ["けん", "みさき"]);
  assert.equal(rows[1].item, "t:beppu");
  assert.equal(rows[2].item, "p:otaru-canal", "同じ数なら最初の並び順");
});

test("違う相談のリンクは合わせない", () => {
  const other = { ...base, id: "zzz999yyy8", votes: { けん: ["t:beppu"] } };
  assert.deepEqual(mergePlans(withVote(base, "ゆう", ["t:otaru"]), other), other);
});

test("# の後ろから相談の部分を取り出す", () => {
  assert.equal(planParam("#p=abc_-9"), "abc_-9");
  assert.equal(planParam("#x=1&p=abc"), "abc");
  assert.equal(planParam(""), null);
  assert.equal(planParam("#top"), null);
});
