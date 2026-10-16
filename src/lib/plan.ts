// 「行き先をいっしょに決める」の相談データ。
// 候補と、だれがどれに「行きたい」を押したかを、リンクの # の後ろに入れて受け渡す。
// # の後ろはブラウザがサーバーへ送らないので、タビオシのサーバーには名前も票も届かない。
// 集計は、選んだ人が送り返したリンクを、相談した人が開いたときに端末の中で合わせる。

/** 候補のID。旅(動画)は "t:動画ID"、場所は "p:場所ID" */
export type PlanItem = string;

export type Plan = {
  v: 1;
  /** 相談ごとのID(送り返されたリンクを同じ相談として合わせるため) */
  id: string;
  title: string;
  /** 相談を作った人のニックネーム */
  by: string;
  items: PlanItem[];
  /** ニックネーム → 「行きたい」を押した候補 */
  votes: Record<string, PlanItem[]>;
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
  const votes: Record<string, PlanItem[]> = {};
  if (r.votes && typeof r.votes === "object") {
    for (const [name, picks] of Object.entries(r.votes as Record<string, unknown>)) {
      const n = cleanName(name);
      if (!n || !Array.isArray(picks) || Object.keys(votes).length >= PLAN_LIMITS.voters) continue;
      // 空の配列は「回答したけれど、どれも選ばなかった」。前の票を消すために残す
      votes[n] = [...new Set(picks.filter((p): p is string => typeof p === "string" && items.includes(p)))];
    }
  }
  return { v: 1, id: r.id, title: clean(r.title, PLAN_LIMITS.title) || DEFAULT_PLAN_TITLE, by: cleanName(r.by), items, votes };
}

/** 自分の「行きたい」を入れる。何も選ばなければ「回答したが選ばなかった」として空で残す。上限人数を超える新しい名前は入れない */
export function withVote(plan: Plan, name: string, picks: PlanItem[]): Plan {
  const n = cleanName(name);
  if (!n) return plan;
  const votes = { ...plan.votes };
  const ok = [...new Set(picks.filter((p) => plan.items.includes(p)))];
  if (votes[n] || Object.keys(votes).length < PLAN_LIMITS.voters) votes[n] = ok;
  return { ...plan, votes };
}

/**
 * 同じ相談の2つの版を合わせる。届いたリンク(incoming)に入っている人の票は、届いた方を使う。
 * 手元にしかない人の票は残す(別の人から送り返されたリンクを順に開くと、全員分がそろう)。
 */
export function mergePlans(local: Plan | undefined, incoming: Plan): Plan {
  if (!local || local.id !== incoming.id) return incoming;
  const votes: Record<string, PlanItem[]> = { ...incoming.votes };
  for (const [n, picks] of Object.entries(local.votes)) {
    if (!(n in votes) && Object.keys(votes).length < PLAN_LIMITS.voters) votes[n] = picks;
  }
  return { ...incoming, votes };
}

/** 候補ごとの「行きたい」の数。多い順、同じ数なら最初の並び順 */
export function tally(plan: Plan) {
  return plan.items
    .map((item, order) => {
      const names = Object.entries(plan.votes)
        .filter(([, picks]) => picks.includes(item))
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
