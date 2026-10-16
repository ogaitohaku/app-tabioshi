// 「行き先をいっしょに決める」の相談データ。
// 候補と、だれがどれに「行きたい」を押したかを、リンクの # の後ろに入れて受け渡す。
// # の後ろはブラウザがサーバーへ送らないので、タビオシのサーバーには名前も票も届かない。
// 集計は、選んだ人が送り返したリンクを、相談した人が開いたときに端末の中で合わせる。

/** 候補のID。旅(動画)は "t:動画ID"、場所は "p:場所ID" */
export type PlanItem = string;

/** ひとりの回答。t はその人が最後に選び直した時刻(秒)。同じ人の古いリンクを開いても、新しい回答を上書きしないために使う */
export type Vote = { p: PlanItem[]; t: number };

export type Plan = {
  v: 1;
  /** 相談ごとのID(送り返されたリンクを同じ相談として合わせるため) */
  id: string;
  title: string;
  /** 相談を作った人のニックネーム */
  by: string;
  items: PlanItem[];
  /** ニックネーム → 回答。p が空なら「回答したが、どれも選ばなかった」 */
  votes: Record<string, Vote>;
  /** 相談を作った人が「ここに決める」を押した候補。item が null なら決定を取り消した。予約ではない */
  decided?: { item: PlanItem | null; t: number };
};

export const PLAN_LIMITS = { items: 6, minItems: 2, voters: 10, name: 12, title: 30 } as const;
export const DEFAULT_PLAN_TITLE = "次の旅、どこにする?";

const clean = (s: unknown, max: number) =>
  typeof s === "string"
    ? s
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .trim()
        .slice(0, max)
    : "";

export const cleanName = (s: unknown) => clean(s, PLAN_LIMITS.name);

export function newPlanId() {
  const a = new Uint8Array(6);
  crypto.getRandomValues(a);
  return [...a]
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 10);
}

function toBase64Url(text: string) {
  let bin = "";
  for (const b of new TextEncoder().encode(text)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

const validTime = (t: unknown): t is number => typeof t === "number" && Number.isInteger(t) && t >= 0 && t < 4_000_000_000;

/** いまの時刻(秒) */
export const nowSec = () => Math.floor(Date.now() / 1000);

/** 同じ相談かどうか。候補が1つでも違えば別の相談として扱う(候補を変えたら作り直す) */
export const planKey = (plan: Plan) => `${plan.id}:${plan.items.join(",")}`;

export function encodePlan(plan: Plan): string {
  return toBase64Url(JSON.stringify(plan));
}

/**
 * リンクから相談を読み出す。形が崩れていれば null。
 * known に渡した候補だけを残す(掲載が終わった旅などは落とす)。名前・件数は上限で切る。
 */
export function decodePlan(s: string, known: (item: PlanItem) => boolean): Plan | null {
  let raw: unknown;
  try {
    raw = JSON.parse(fromBase64Url(s));
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.v !== 1 || typeof r.id !== "string" || !/^[0-9a-z]{4,16}$/.test(r.id) || !Array.isArray(r.items)) return null;
  const items = [...new Set(r.items.filter((i): i is string => typeof i === "string" && known(i)))].slice(0, PLAN_LIMITS.items);
  if (!items.length) return null;
  const votes: Record<string, Vote> = {};
  if (r.votes && typeof r.votes === "object") {
    for (const [name, raw] of Object.entries(r.votes as Record<string, unknown>)) {
      const n = cleanName(name);
      const v = raw as Partial<Vote> | null;
      if (!n || !v || !Array.isArray(v.p) || !validTime(v.t) || Object.keys(votes).length >= PLAN_LIMITS.voters) continue;
      // 空の配列は「回答したけれど、どれも選ばなかった」。前の票を消すために残す
      votes[n] = { p: [...new Set(v.p.filter((x): x is string => typeof x === "string" && items.includes(x)))], t: v.t };
    }
  }
  const plan: Plan = { v: 1, id: r.id, title: clean(r.title, PLAN_LIMITS.title) || DEFAULT_PLAN_TITLE, by: cleanName(r.by), items, votes };
  const d = r.decided as Plan["decided"] | undefined;
  if (d && validTime(d.t) && (d.item === null || items.includes(d.item as string))) plan.decided = { item: d.item, t: d.t };
  return plan;
}

/** 自分の「行きたい」を入れる。何も選ばなければ「回答したが選ばなかった」として空で残す。上限人数を超える新しい名前は入れない */
export function withVote(plan: Plan, name: string, picks: PlanItem[], now = nowSec()): Plan {
  const n = cleanName(name);
  if (!n) return plan;
  const votes = { ...plan.votes };
  const prev = votes[n];
  if (!prev && Object.keys(votes).length >= PLAN_LIMITS.voters) return plan;
  // 端末の時計が戻っていても、選び直すたびに必ず新しくなるようにする
  votes[n] = { p: [...new Set(picks.filter((p) => plan.items.includes(p)))], t: Math.max(now, (prev?.t ?? 0) + 1) };
  return { ...plan, votes };
}

/** 相談を作った人が「ここに決める」(null で取り消し) */
export function withDecision(plan: Plan, item: PlanItem | null, now = nowSec()): Plan {
  if (item !== null && !plan.items.includes(item)) return plan;
  return { ...plan, decided: { item, t: Math.max(now, (plan.decided?.t ?? 0) + 1) } };
}

export type MergeReport = {
  /** このリンクで新しく加わった人 */
  added: string[];
  /** このリンクの方が新しかったので選び直しを反映した人 */
  updated: string[];
  /** このリンクの方が古かったので、手元の新しい回答をそのまま使った人 */
  kept: string[];
  /** 上限(10人)を超えたので入れなかった人 */
  dropped: string[];
};

/**
 * 同じ相談の2つの版を合わせる。人ごとに、選び直した時刻が新しい方を使う(同じなら届いた方)。
 * 同じリンクを開き直しても、古いリンクを転送されても、数が増えたり新しい回答が消えたりしない。
 * 候補が違うもの・IDが違うものは合わせない(届いた方をそのまま使う)。
 */
export function mergePlans(local: Plan | undefined, incoming: Plan): { plan: Plan; report: MergeReport } {
  const report: MergeReport = { added: [], updated: [], kept: [], dropped: [] };
  if (!local || planKey(local) !== planKey(incoming)) return { plan: incoming, report: { ...report, added: Object.keys(incoming.votes) } };
  const votes: Record<string, Vote> = { ...local.votes };
  for (const [n, v] of Object.entries(incoming.votes)) {
    const mine = votes[n];
    if (!mine) {
      if (Object.keys(votes).length >= PLAN_LIMITS.voters) report.dropped.push(n);
      else {
        votes[n] = v;
        report.added.push(n);
      }
    } else if (v.t > mine.t) {
      votes[n] = v;
      report.updated.push(n);
    } else if (v.t < mine.t) report.kept.push(n);
  }
  const decided = !local.decided ? incoming.decided : !incoming.decided || local.decided.t >= incoming.decided.t ? local.decided : incoming.decided;
  const plan: Plan = { ...incoming, votes };
  if (decided) plan.decided = decided;
  else delete plan.decided;
  return { plan, report };
}

/** 候補ごとの「行きたい」の数。多い順、同じ数なら最初の並び順 */
export function tally(plan: Plan) {
  return plan.items
    .map((item, order) => {
      const names = Object.entries(plan.votes)
        .filter(([, v]) => v.p.includes(item))
        .map(([n]) => n);
      return { item, order, count: names.length, names };
    })
    .sort((a, b) => b.count - a.count || a.order - b.order);
}

/** ページのURLの # 部分から相談の文字列を取り出す(#p=...) */
export function planParam(hash: string) {
  const m = /(?:^#|&)p=([A-Za-z0-9_-]+)/.exec(hash);
  return m ? m[1] : null;
}
