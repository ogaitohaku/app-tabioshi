// 旅タイプ診断の計算(採点・確かさ・相性)。画面からも、サーバーからも使う。
import { AXES, CORE_COUNT, QUESTIONS, type AxisId } from "@/data/travelType";

export type Scores = Record<AxisId, number>;

export type Clarity = "僅差" | "やや" | "はっきり";
export type Certainty = "高い" | "ふつう" | "低い";

export type TypeResult = {
  code: string;
  /** 各軸の合計(−15〜+15)。+ なら左の文字 */
  scores: Scores;
  /** 左の文字(D・I・M・Q)寄りの割合(0〜100) */
  pct: Scores;
  clarity: Record<AxisId, Clarity>;
  /** 結果の確かさ。「どちらでもない」の多さと、同じ軸の答えのそろい方で決める */
  certainty: Certainty;
};


export const clarityOf = (pct: number): Clarity => {
  const d = Math.abs(pct - 50);
  return d < 10 ? "僅差" : d < 30 ? "やや" : "はっきり";
};

/** 答え(QUESTIONS と同じ順。各問 +3〜−3、+ が「そう思う」。聞いていない問は undefined)から結果を出す */
export function scoreAnswers(answers: (number | undefined)[]): TypeResult {
  const given = answers.slice(0, QUESTIONS.length).filter((a): a is number => a !== undefined);
  // 何にでも「そう思う」(または「そう思わない」)と答えるくせを打ち消す。
  // 各軸に両方の向きの文があるので、その人の答えの平均を引くと、くせの分だけが消える
  // くせは最初の20問(左右の向きをそろえた問)だけで測る
  const core = answers.slice(0, CORE_COUNT).filter((a): a is number => a !== undefined);
  const bias = core.reduce((n, a) => n + a, 0) / Math.max(1, core.length);
  const scores: Scores = { where: 0, decide: 0, with: 0, depth: 0 };
  const parts: Record<AxisId, number[]> = { where: [], decide: [], with: [], depth: [] };
  QUESTIONS.forEach((q, i) => {
    const a = answers[i];
    if (a === undefined) return;
    const v = (a - bias) * q.key;
    scores[q.axis] += v;
    parts[q.axis].push(v);
  });

  const pct = {} as Scores;
  const clarity = {} as Record<AxisId, Clarity>;
  let agree = 0;
  let counted = 0;
  const code = AXES.map((ax) => {
    let v = scores[ax.id];
    // 合計がちょうど0なら、いちばん強く答えた問で決める
    if (Math.abs(v) < 1e-9) v = parts[ax.id].reduce((m, x) => (Math.abs(x) > Math.abs(m) ? x : m), 0) || 1;
    const max = Math.max(1, parts[ax.id].length * 3);
    pct[ax.id] = Math.round(Math.max(0, Math.min(100, 50 + (scores[ax.id] / max) * 50)));
    clarity[ax.id] = clarityOf(pct[ax.id]);
    for (const x of parts[ax.id]) {
      if (Math.abs(x) < 0.5) continue;
      counted++;
      if (Math.sign(x) === Math.sign(v)) agree++;
    }
    scores[ax.id] = Math.round(scores[ax.id] * 10) / 10;
    return v > 0 ? ax.left : ax.right;
  }).join("");

  const neutral = given.filter((a) => a === 0).length;
  const consistency = counted ? agree / counted : 0;
  const close = AXES.filter((ax) => clarity[ax.id] === "僅差").length;
  const certainty: Certainty =
    neutral > given.length / 2 || consistency < 0.6 || close >= 2 ? "低い" : close === 0 && consistency >= 0.7 ? "高い" : "ふつう";
  return { code, scores, pct, clarity, certainty };
}

/** 各軸の強さ(1〜5)。左右どちらかへの寄り方で決める */
/** 20問で僅差だった軸(追加で聞く軸) */
export const closeAxes = (r: TypeResult) => AXES.filter((ax) => r.clarity[ax.id] === "僅差").map((ax) => ax.id);

/** 僅差の軸の文字を入れ替えた「もう一つの可能性」のタイプ */
export function altCode(r: TypeResult) {
  const close = closeAxes(r);
  if (close.length !== 1) return null;
  const i = AXES.findIndex((ax) => ax.id === close[0]);
  const ax = AXES[i];
  return r.code.slice(0, i) + (r.code[i] === ax.left ? ax.right : ax.left) + r.code.slice(i + 1);
}

export const stars = (pct: number) => Math.max(1, Math.min(5, Math.round((Math.abs(pct - 50) / 50) * 4) + 1));

export type CompatRow = { label: string; level: number; text: string };

/** 2つのタイプの旅の相性。良い・悪いの一言ではなく、場面ごとに出す */
export function compat(a: string, b: string): { title: string; rows: CompatRow[] } {
  const same = (i: number) => a[i] === b[i];
  const rows: CompatRow[] = [];
  rows.push(
    same(0)
      ? { label: "行き先選び", level: 5, text: a[0] === "D" ? "どちらも知らない場所が好き。行き先で揉めません" : "どちらも定番が好き。安心できる旅になります" }
      : { label: "行き先選び", level: 3, text: "冒険派と定番派。交互に行き先を決めると旅の幅が広がります" },
  );
  rows.push(
    same(1)
      ? a[1] === "P"
        ? { label: "計画づくり", level: 3, text: "しおりが2冊できるかも。役割を分けると最強です" }
        : { label: "計画づくり", level: 2, text: "どちらも当日決め。宿だけは先に取っておきましょう" }
      : { label: "計画づくり", level: 5, text: "計画する人と、その場で変える人。いちばん強い分担です" },
  );
  rows.push(
    same(2)
      ? a[2] === "M"
        ? { label: "旅先での過ごし方", level: 4, text: "別行動もOKな気楽な二人。夜にお互いの発見を話しましょう" }
        : { label: "旅先での過ごし方", level: 5, text: "ずっと話していられる二人。宿でも話が尽きません" }
      : { label: "旅先での過ごし方", level: 3, text: "一人の時間がほしい人と、話したい人。夜の過ごし方を先に決めると楽です" },
  );
  rows.push(
    same(3)
      ? { label: "旅のペース", level: 5, text: "歩く速さと朝の出発時刻が合います" }
      : { label: "旅のペース", level: 2, text: "たくさん回りたい人と、じっくりいたい人。朝の出発時刻でぶつかりやすいです" },
  );
  const diff = [0, 1, 2, 3].filter((i) => !same(i)).length;
  rows.push({
    label: "お互いを成長させる",
    level: diff >= 2 ? 5 : diff === 1 ? 4 : 3,
    text: diff >= 2 ? "一人では行かない旅を、相手が連れて行ってくれます" : diff === 1 ? "似ているけれど、一つだけ違う所が新しい発見になります" : "似た者同士。安心できるぶん、たまに新しい旅を混ぜましょう",
  });
  const total = rows.reduce((n, r) => n + r.level, 0);
  const title =
    !same(1) && total >= 19 ? "最強の旅の相棒" : total >= 20 ? "最高の旅仲間" : diff >= 3 ? "刺激し合う凸凹コンビ" : same(3) ? "ペースの合う旅仲間" : "役割を分ければいいコンビ";
  return { title, rows };
}
