// 前の版(842d272)で作られたリンクと端末の保存データを、いまの版で読めるか・回答を消さないかを確かめる。
// 前の版の回答は時刻のない配列 { 名前: ["t:a"] }、いまは { 名前: { p: ["t:a"], t: 秒 } }。
// fixtures/legacy-2026-10-16.json は、前の版の plan.ts そのもの(git show 842d272:src/lib/plan.ts)で作った実物。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  decodePlan,
  encodePlan,
  LEGACY_T,
  legacyVoters,
  mergePlans,
  migratePlansStore,
  type Plan,
  planKey,
  tally,
  withDecision,
  withPlan,
  withVote,
} from "../../src/lib/plan.ts";

const legacy = JSON.parse(readFileSync(new URL("./fixtures/legacy-2026-10-16.json", import.meta.url), "utf8"));
const T = 1_760_600_000;
const KEY = "k3v9q2m8x1:t:otaru,t:beppu";
const count = (p: Plan, item: string) => tally(p).find((r) => r.item === item)!.count;

test("前の版の共有リンク: 回答を時刻なし(いちばん古い)として読み、中身が残る", () => {
  const p = decodePlan(legacy.links.fromKen)!;
  assert.equal(p.title, "冬の連休");
  assert.deepEqual(p.items, ["t:otaru", "t:beppu"]);
  assert.deepEqual(p.votes, { けん: { p: ["t:otaru", "t:beppu"], t: LEGACY_T } });
  assert.deepEqual(legacyVoters(p), ["けん"]);
  assert.equal(count(p, "t:beppu"), 1, "数えられる(tally で落ちない)");
});

test("前の版の保存データ: キーを付け直し、2人分の回答とほかの相談が残る", () => {
  const s = migratePlansStore(legacy.store);
  assert.equal(s.me, "ゆう");
  assert.deepEqual(Object.keys(s.plans).sort(), [KEY, "p7a1b2c3d4:t:tadami,p:otaru-canal"]);
  const p = s.plans[KEY].plan;
  assert.deepEqual(Object.keys(p.votes).sort(), ["けん", "みさき"]);
  assert.equal(count(p, "t:otaru"), 2);
  assert.equal(count(p, "t:beppu"), 1);
  assert.equal(s.plans[KEY].at, "2026-10-16T07:50:00.000Z", "最後に開いた日時も残す");
  assert.deepEqual(s.plans["p7a1b2c3d4:t:tadami,p:otaru-canal"].plan.votes, { ゆう: { p: ["t:tadami"], t: LEGACY_T } });
});

test("前の版の保存データ + いまの版のリンク: 新しい回答と合流する", () => {
  const local = migratePlansStore(legacy.store).plans[KEY].plan;
  // みさきが新しい版で選び直した(小樽 → 別府)。あやは新しく回答
  const fresh = withVote(withVote(decodePlan(legacy.links.fromMisaki)!, "みさき", ["t:beppu"], T), "あや", ["t:otaru"], T + 1);
  const r = mergePlans(local, decodePlan(encodePlan(fresh))!);
  assert.deepEqual(r.report.updated, ["みさき"]);
  assert.deepEqual(r.report.added, ["あや"]);
  assert.deepEqual(r.plan.votes["けん"], { p: ["t:otaru", "t:beppu"], t: LEGACY_T }, "前の版のけんの回答は消えない");
  assert.equal(count(r.plan, "t:otaru"), 2); // けん・あや
  assert.equal(count(r.plan, "t:beppu"), 2); // けん・みさき
});

test("いまの版で選び直した後に、前の版の古いリンクを開いても新しい回答が残る", () => {
  const newer = withVote(decodePlan(legacy.links.fromMisaki)!, "みさき", ["t:beppu"], T);
  const r = mergePlans(newer, decodePlan(legacy.links.fromMisaki)!);
  assert.deepEqual(r.report.kept, ["みさき"]);
  assert.deepEqual(r.plan.votes["みさき"].p, ["t:beppu"]);
});

test("前の版どうし: 同じリンクの開き直しは変化なし、中身が違えば届いた方(前の版と同じふるまい)", () => {
  const local = migratePlansStore(legacy.store).plans[KEY].plan;
  const same = mergePlans(local, decodePlan(legacy.links.fromKen)!);
  assert.deepEqual(same.report, { added: [], updated: [], kept: [], dropped: [] });
  assert.deepEqual(same.plan.votes, local.votes);
});

test("再読み込み(保存→読み直し)と再共有(リンク→読み直し)を何度しても、回答も相談の数も変わらない", () => {
  let s = migratePlansStore(legacy.store);
  for (let i = 0; i < 3; i++) s = migratePlansStore(JSON.parse(JSON.stringify(s)));
  assert.equal(Object.keys(s.plans).length, 2);
  const p = s.plans[KEY].plan;
  const reshared = decodePlan(encodePlan(p))!;
  assert.deepEqual(reshared, p, "前の版の回答も、いまの形のリンクにそのまま入る");
  assert.deepEqual(mergePlans(p, reshared).report, { added: [], updated: [], kept: [], dropped: [] });
});

test("前の版のキー(相談ID)と、いまの版のキー(相談ID:候補)が両方残っていても1件にまとまる(二重の相談にしない)", () => {
  const old = legacy.store.plans["k3v9q2m8x1"];
  const newer = withVote(decodePlan(legacy.links.created)!, "ゆう", ["t:beppu"], T);
  const raw = { me: "ゆう", plans: { k3v9q2m8x1: old, [KEY]: { plan: newer, at: "2026-10-16T08:20:00.000Z" } } };
  const s = migratePlansStore(raw);
  assert.deepEqual(
    Object.keys(s.plans).filter((k) => k.startsWith("k3v9q2m8x1")),
    [KEY],
  );
  assert.deepEqual(Object.keys(s.plans[KEY].plan.votes).sort(), ["けん", "みさき", "ゆう"]);
  assert.equal(s.plans[KEY].at, "2026-10-16T08:20:00.000Z");
});

test("前の版の相談に「ここに決める」・候補を変えた別の相談を作っても、元の相談と混ざらない", () => {
  const s = migratePlansStore(legacy.store);
  const decided = withDecision(s.plans[KEY].plan, "t:otaru", T);
  const s2 = withPlan(s, decided, "2026-10-16T09:00:00.000Z");
  assert.equal(Object.keys(s2.plans).length, 2, "同じ相談は上書きで1件のまま");
  assert.equal(s2.plans[KEY].plan.decided!.item, "t:otaru");
  // 候補を変えた相談(同じIDでも候補が違う)は別の相談として並ぶ。元の回答は消えない
  const changed: Plan = { ...decided, items: ["t:otaru", "t:tadami"], votes: {}, decided: undefined };
  delete changed.decided;
  const s3 = withPlan(s2, changed, "2026-10-16T09:10:00.000Z");
  assert.notEqual(planKey(changed), KEY);
  assert.deepEqual(Object.keys(s3.plans[KEY].plan.votes).sort(), ["けん", "みさき"]);
});

test("壊れた保存データ: 読めない相談だけを外し、ほかは残す(エラーにしない)", () => {
  const raw = { me: 123, plans: { a: null, b: { plan: { v: 9 } }, c: "x", ...legacy.store.plans } };
  const s = migratePlansStore(raw);
  assert.equal(s.me, "");
  assert.equal(Object.keys(s.plans).length, 2);
  assert.deepEqual(migratePlansStore(null), { me: "", plans: {} });
  assert.deepEqual(migratePlansStore("壊れた"), { me: "", plans: {} });
});
