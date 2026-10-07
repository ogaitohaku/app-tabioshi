// 旅タイプ診断の計算(採点・星・相性)。画面からも、サーバーからも使う。
import { AXES, QUESTIONS, type AxisId } from "@/data/travelType";

export type Scores = Record<AxisId, number>;

/** 答え(各問の選んだ選択肢の番号)から、軸ごとの合計とコードを出す */
export function scoreAnswers(answers: number[]): { code: string; scores: Scores } {
  const scores: Scores = { where: 0, decide: 0, with: 0, depth: 0 };
  const last: Partial<Scores> = {};
  QUESTIONS.forEach((q, i) => {
    const pick = answers[i];
    if (pick === undefined) return;
    const s = q.options[pick].score;
    scores[q.axis] += s;
    last[q.axis] = s;
  });
  const code = AXES.map((a) => {
    const v = scores[a.id] || (last[a.id] ?? 1); // 合計が0なら、その軸の最後の答えで決める
    return v > 0 ? a.left : a.right;
  }).join("");
  return { code, scores };
}

/** 各軸の強さ(1〜5の星)。合計の幅は −8〜+8 */
export const stars = (v: number) => Math.max(1, Math.min(5, Math.round((Math.abs(v) / 8) * 4) + 1));

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
