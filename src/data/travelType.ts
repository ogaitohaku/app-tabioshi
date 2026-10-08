// TRAVEL TYPE(旅タイプ診断)のデータ。娯楽と自己理解のための診断で、科学的な性格検査ではない。
import type { Budget } from "@/lib/prefs";
import type { Theme } from "./types";

/** 4つの軸。値が + なら左の文字、− なら右の文字 */
export const AXES = [
  { id: "where", left: "D", right: "S", leftName: "DISCOVER", rightName: "STABLE", leftLabel: "未知を探す", rightLabel: "定番・安心", stat: "冒険心" },
  { id: "decide", left: "I", right: "P", leftName: "INTUITION", rightName: "PROOF", leftLabel: "直感で決める", rightLabel: "調べて比べる", stat: "直感" },
  { id: "with", left: "M", right: "O", leftName: "MY PACE", rightName: "OPEN", leftLabel: "自分のペース", rightLabel: "人と分かち合う", stat: "共有力" },
  { id: "depth", left: "Q", right: "G", leftName: "QUICK", rightName: "GROW", leftLabel: "たくさん回る", rightLabel: "じっくり深く", stat: "深さ" },
] as const;

export type AxisId = (typeof AXES)[number]["id"];

/** 設問は「旅の中でよくする行動」の文。そう思う〜そう思わないの7段階で答える。
 *  key が 1 なら「そう思う」ほど左の文字(D・I・M・Q)、-1 なら右の文字(S・P・O・G)に寄る。
 *  同じ向きの文ばかりだと「なんでも、そう思う」と答える人の結果が偏るので、各軸に両方の向きを混ぜている */
export type TypeQuestion = { axis: AxisId; text: string; key: 1 | -1; extra?: true };

/** 7段階の答え。左から そう思う(+3)… どちらでもない(0) … そう思わない(−3) */
export const SCALE = [3, 2, 1, 0, -1, -2, -3] as const;

/** 各軸5問・計20問(+僅差の軸だけ追加3問)。軸が続かないように順番を混ぜて並べる */
export const QUESTIONS: TypeQuestion[] = [
  { axis: "where", key: 1, text: "旅先には、行ったことのない場所を選ぶことが多い" },
  { axis: "decide", key: -1, text: "旅の前に、時間ごとの予定を立てる" },
  { axis: "with", key: 1, text: "一人旅をよくする(または、してみたい)" },
  { axis: "depth", key: 1, text: "1泊2日なら、できるだけ多くの場所を回りたい" },
  { axis: "where", key: -1, text: "旅先は、評判の確かな定番の場所から選ぶ" },
  { axis: "decide", key: 1, text: "宿を、直前や当日に決めることがある" },
  { axis: "with", key: -1, text: "旅の写真や感想は、その日のうちに誰かと分け合う" },
  { axis: "depth", key: -1, text: "気に入った場所には、半日以上いることがある" },
  { axis: "where", key: 1, text: "地図で見つけた知らない地名に、ふらっと行ってみたくなる" },
  { axis: "decide", key: -1, text: "お店は、口コミや値段を比べてから決める" },
  { axis: "with", key: 1, text: "同行者がいても、一人で歩く時間がほしい" },
  { axis: "depth", key: 1, text: "旅の朝は早く出発して、一日を長く使う" },
  { axis: "where", key: -1, text: "前に行って良かった宿に、また泊まりたい" },
  { axis: "decide", key: 1, text: "予定になかった寄り道で、行き先が変わることがよくある" },
  { axis: "with", key: -1, text: "宿の人や地元の人と話すのが、旅の楽しみだ" },
  { axis: "depth", key: -1, text: "名所を回るより、その土地の歴史や作り手の話を聞きたい" },
  { axis: "where", key: 1, text: "ご飯は、ガイドに載っていない地元の店を探す" },
  { axis: "decide", key: -1, text: "雨の日や混んだときの代わりの案も、用意しておく" },
  { axis: "with", key: -1, text: "行き先は、友だちや家族と相談して決めたい" },
  { axis: "depth", key: -1, text: "宿でのんびりする時間も、旅の目的のうちだ" },
  // ここから追加の問。20問で左右がほぼ半々(僅差)だった軸だけ、3問ずつ聞き足す
  { axis: "where", key: 1, extra: true, text: "旅先で、乗ったことのない路線やバスに乗ってみたくなる" },
  { axis: "where", key: -1, extra: true, text: "初めての土地より、勝手がわかる土地のほうが落ち着く" },
  { axis: "where", key: 1, extra: true, text: "まだあまり知られていない場所を、探すのが好きだ" },
  { axis: "decide", key: 1, extra: true, text: "旅の当日の朝に、行き先を変えたことがある" },
  { axis: "decide", key: -1, extra: true, text: "乗る電車やバスの時刻は、出発前に決めておく" },
  { axis: "decide", key: -1, extra: true, text: "旅の予算は、出発前におおよそ決めている" },
  { axis: "with", key: 1, extra: true, text: "旅先の食事は、一人でも気にならない" },
  { axis: "with", key: -1, extra: true, text: "旅は、誰と行くかが一番大事だ" },
  { axis: "with", key: 1, extra: true, text: "旅先では、誰にも気をつかわず静かに過ごしたい" },
  { axis: "depth", key: 1, extra: true, text: "移動が長くなっても、見たい場所は全部回りたい" },
  { axis: "depth", key: -1, extra: true, text: "工房や資料館では、時間をかけてじっくり見る" },
  { axis: "depth", key: 1, extra: true, text: "一つの場所に長くいると、次へ行きたくなる" },
];

/** はじめに必ず聞く20問 */
export const CORE_COUNT = QUESTIONS.filter((q) => !q.extra).length;

export type TravelType = {
  code: string;
  name: string;
  catch: string;
  strengths: string[];
  weaknesses: string[];
  likes: string;
  dislikes: string;
  aruaru: string[];
  /** 守護重神を選ぶときの条件(生態・能力・価値観)。重神の正式な一覧が届いたら名前を入れる */
  guardian: { trait: string; why: string };
  themes: Theme[];
  budget: Budget;
};

export const TYPES: TravelType[] = [
  {
    code: "DIMQ", name: "無計画冒険家", catch: "地図は、着いてから開く。",
    strengths: ["予定外を楽しめる", "フットワークが軽い", "トラブルが土産話になる"],
    weaknesses: ["宿が取れず焦る", "帰りの電車を調べていない"],
    likes: "知らない駅、乗り継ぎ自由な切符", dislikes: "分刻みのツアー",
    aruaru: ["行き先を決めるのは改札の前", "宿の予約は電車の中", "スマホの充電が先に尽きる", "「なんとかなる」が口ぐせ", "旅のあとで地名を調べる"],
    guardian: { trait: "風まかせに渡る生きもの。どこでも道を見つける能力", why: "行き先を決めずに出ても、必ずどこかにたどり着くから" },
    themes: ["town", "train"], budget: "low",
  },
  {
    code: "DIMG", name: "ローカル潜入型", catch: "観光地より、地元の朝ごはん。",
    strengths: ["土地の空気をつかむのが早い", "一人でも溶け込める", "地元の店を見つける嗅覚"],
    weaknesses: ["有名な名所を見逃す", "同行者が置いていかれる"],
    likes: "商店街、銭湯、朝市", dislikes: "観光客向けの行列店",
    aruaru: ["旅先のスーパーに必ず寄る", "地元の銭湯に入りたがる", "「観光地っぽくない所」を探す", "地元の人に道を聞かれる", "同じ街に何日でもいられる"],
    guardian: { trait: "人里に溶け込んで暮らす生きもの。姿を周りに合わせる能力", why: "観光客ではなく、その街の一員として旅をするから" },
    themes: ["town", "food", "craft"], budget: "mid",
  },
  {
    code: "DIOQ", name: "秒速冒険家", catch: "行こう、と言った人が一番早い。",
    strengths: ["仲間を旅に連れ出す力", "決断が速い", "その場を盛り上げる"],
    weaknesses: ["予定が詰まりすぎる", "仲間の疲れに気づきにくい"],
    likes: "週末弾丸、海、夜の屋台", dislikes: "決まらない話し合い",
    aruaru: ["グループLINEで旅を言い出す係", "当日の朝に行き先が変わる", "移動中も一番しゃべっている", "帰りの車でもう次の旅の話", "写真は全員分撮ってあげる"],
    guardian: { trait: "群れの先頭を飛ぶ生きもの。仲間を引っぱる速さ", why: "思い立った瞬間に、みんなを連れて走り出すから" },
    themes: ["sea", "town", "food"], budget: "mid",
  },
  {
    code: "DIOG", name: "旅先の人たらし", catch: "宿の人と友だちになって帰る。",
    strengths: ["人との出会いで旅が深まる", "地元の人から話を引き出す", "再訪先が増える"],
    weaknesses: ["話し込んで予定が崩れる", "一人の時間が少ない"],
    likes: "民宿、相席の居酒屋、地域の祭り", dislikes: "無言のチェックイン",
    aruaru: ["女将さんの名前を覚えて帰る", "居酒屋の隣の席と乾杯している", "年賀状が旅先から届く", "「また来てね」を本気にする", "旅の思い出が全部人の話"],
    guardian: { trait: "人の輪の真ん中にいる生きもの。心を開かせる声", why: "旅先の人と、その日のうちに仲良くなるから" },
    themes: ["food", "craft", "town"], budget: "mid",
  },
  {
    code: "DPMQ", name: "弾丸ルート職人", catch: "1泊で5か所、全部計算済み。",
    strengths: ["限られた時間で一番多く回れる", "乗り換えに強い", "安く遠くまで行ける"],
    weaknesses: ["遅延に弱い", "のんびりする時間がない"],
    likes: "時刻表、早朝の始発、周遊券", dislikes: "ぎりぎりのチェックアウト",
    aruaru: ["乗り換え時間を分単位で覚えている", "旅の後で移動距離を計算する", "1日の歩数が2万歩を超える", "朝ごはんは移動中", "帰りの最終便を逃さない"],
    guardian: { trait: "大陸を最短で渡る生きもの。風と道を読む能力", why: "地図と時刻表から、一番速い道を見つけるから" },
    themes: ["train", "town"], budget: "low",
  },
  {
    code: "DPMG", name: "秘境リサーチャー", catch: "行き方が難しいほど燃える。",
    strengths: ["誰も知らない場所を見つける", "下調べが深い", "一人でも遠くまで行ける"],
    weaknesses: ["同行者がついてこられない", "準備だけで疲れる"],
    likes: "1日数本のローカル線、雪の山あい、工房", dislikes: "混雑した観光地",
    aruaru: ["「ここ、バスが1日2本」がうれしい", "地形図を見るのが好き", "旅の前に郷土史の本を読む", "電波のない宿を選びがち", "行った場所を説明すると長くなる"],
    guardian: { trait: "人の来ない山奥に棲む生きもの。隠れたものを見通す目", why: "地図の端にある場所を、調べ抜いて見つけるから" },
    themes: ["snow", "train", "craft"], budget: "mid",
  },
  {
    code: "DPOQ", name: "旅のしおり番長", catch: "みんなの分まで調べておいた。",
    strengths: ["グループ旅をまとめる", "失敗しない店を選ぶ", "予算の管理がうまい"],
    weaknesses: ["予定通りにいかないと疲れる", "自分が楽しむのを忘れる"],
    likes: "共有メモ、グループ旅、新しい街", dislikes: "誰も決めない旅",
    aruaru: ["しおりを作ってLINEに流す", "割り勘の計算が一番早い", "店の予約は全部自分", "「次はこっち」と先頭を歩く", "帰ってから旅の写真をまとめる"],
    guardian: { trait: "群れの道案内をする生きもの。行き先を照らす灯り", why: "仲間の分まで道を調べて、みんなを迷わせないから" },
    themes: ["town", "food", "sea"], budget: "mid",
  },
  {
    code: "DPOG", name: "土地の物語ガイド", catch: "由来を知ると、景色が変わる。",
    strengths: ["一緒に行く人の旅を深くする", "歴史や文化に詳しい", "工房や職人とつながる"],
    weaknesses: ["説明が長くなる", "見学に時間をかけすぎる"],
    likes: "資料館、伝統工芸、古い町並み", dislikes: "素通りする観光",
    aruaru: ["案内板を全部読む", "同行者に豆知識を話してしまう", "旅の前に予習クイズを解く", "職人さんの話で1時間たつ", "旅先の本屋で郷土本を買う"],
    guardian: { trait: "古い土地の記憶を守る生きもの。昔話を語る力", why: "景色の向こうにある物語を、人に伝えたくなるから" },
    themes: ["craft", "town"], budget: "mid",
  },
  {
    code: "SIMQ", name: "ふらっと週末逃避型", catch: "金曜の夜に決めて、土曜は温泉。",
    strengths: ["気軽に旅に出られる", "近場の良さを知っている", "気分転換が上手"],
    weaknesses: ["いつも同じ方面になる", "遠出を先送りしがち"],
    likes: "日帰り温泉、近場の宿、特急", dislikes: "準備が大変な旅",
    aruaru: ["金曜の夜に宿を探し始める", "車で2時間以内が行動範囲", "温泉に入れば元気になる", "荷物はいつも小さい", "月曜の朝に「行ってよかった」"],
    guardian: { trait: "湯けむりに住む生きもの。疲れをほどく力", why: "思い立ったら、すぐ休みに行けるから" },
    themes: ["onsen"], budget: "low",
  },
  {
    code: "SIMG", name: "癒やし逃避型", catch: "何もしないをしに行く。",
    strengths: ["本当の休み方を知っている", "宿の良さを味わい尽くす", "自分を取り戻すのがうまい"],
    weaknesses: ["観光をしない", "旅の話が短い"],
    likes: "部屋付き露天、雪見風呂、連泊", dislikes: "詰め込みすぎの予定",
    aruaru: ["チェックインの時間に着く", "宿から一歩も出ない", "部屋で本を1冊読み切る", "旅行中の歩数が3000歩", "帰りの車でもう恋しい"],
    guardian: { trait: "冬ごもりする生きもの。静けさを守る力", why: "何もしない時間で、自分を満たすから" },
    themes: ["onsen", "snow"], budget: "high",
  },
  {
    code: "SIOQ", name: "映えグルメ旅人", catch: "この一皿のために来た。",
    strengths: ["食べものの情報が早い", "旅を楽しく見せられる", "仲間を誘うのがうまい"],
    weaknesses: ["行列で時間を使う", "食べすぎる"],
    likes: "名物グルメ、海鮮、景色のいいカフェ", dislikes: "食事の時間が決まった旅",
    aruaru: ["旅先は食べたいもので決まる", "1日5食になる", "料理が来たらまず撮る", "旅のあとで写真を見返して空腹になる", "名物は全部食べる"],
    guardian: { trait: "美味しいものの匂いを嗅ぎ分ける生きもの", why: "旅の目的が、その土地の味だから" },
    themes: ["food", "sea"], budget: "mid",
  },
  {
    code: "SIOG", name: "常連宿の顔なじみ", catch: "また来ました、が言える場所。",
    strengths: ["一つの場所と長く付き合う", "宿や店から大事にされる", "季節ごとの変化に気づく"],
    weaknesses: ["新しい場所に行かない", "旅の話がいつも同じ宿"],
    likes: "毎年行く宿、季節の料理、なじみの店", dislikes: "知らない宿の当たり外れ",
    aruaru: ["同じ宿に5回以上泊まっている", "宿の人に名前で呼ばれる", "「いつもの部屋」がある", "家族の行事が旅先", "季節ごとに同じ景色を撮る"],
    guardian: { trait: "同じ巣に帰ってくる生きもの。縁を結ぶ力", why: "好きな場所に通い続けて、縁を育てるから" },
    themes: ["onsen", "food"], budget: "mid",
  },
  {
    code: "SPMQ", name: "コスパ旅探偵", catch: "同じ宿なら、一番安い日に。",
    strengths: ["少ない予算で満足度の高い旅", "値段の相場に詳しい", "ポイントを貯めるのがうまい"],
    weaknesses: ["比べすぎて決まらない", "安さを優先して疲れる"],
    likes: "平日の割引、ポイント、ゲストハウス", dislikes: "値段が見えないプラン",
    aruaru: ["同じ宿の料金を毎日見る", "予約サイトを3つ比べる", "ポイントで1泊できる", "「1人あたりいくら?」を最初に聞く", "安く行けた話が一番盛り上がる"],
    guardian: { trait: "木の実を賢く貯める生きもの。値打ちを見抜く目", why: "同じ旅を、一番賢く手に入れるから" },
    themes: ["town", "food"], budget: "low",
  },
  {
    code: "SPMG", name: "宿こそ主役派", catch: "旅の目的地は、この宿。",
    strengths: ["良い宿を見分けられる", "特別な日の旅を任される", "体験にお金を使える"],
    weaknesses: ["予算がふくらむ", "宿の外に出ない"],
    likes: "露天風呂付き客室、旅館の会席、上質なホテル", dislikes: "寝るだけの宿",
    aruaru: ["宿を決めてから行き先を決める", "口コミの「部屋の写真」を全部見る", "記念日は必ず旅", "アメニティを比べる", "チェックアウトが一番さみしい"],
    guardian: { trait: "美しい巣を作る生きもの。居場所を整える力", why: "旅の価値を、過ごす場所で決めるから" },
    themes: ["onsen"], budget: "high",
  },
  {
    code: "SPOQ", name: "絶景コンプリーター", catch: "名所は、名所だから行く。",
    strengths: ["一度の旅で名所を見逃さない", "写真の場所と時間を調べ抜く", "仲間に名所を案内できる"],
    weaknesses: ["行程がきつくなる", "人混みに疲れる"],
    likes: "展望台、紅葉と雪景色の名所、朝焼け", dislikes: "見どころのない移動日",
    aruaru: ["日の出の時刻を調べてある", "「ここで撮るといい」の場所を知っている", "日本の絶景リストを埋めている", "同じ景色を季節を変えて見に行く", "旅の写真フォルダが一番多い"],
    guardian: { trait: "高い所から景色を見渡す生きもの。良い時を知る目", why: "一番美しい瞬間に、その場所に立つから" },
    themes: ["sea", "snow"], budget: "mid",
  },
  {
    code: "SPOG", name: "家族旅行プロデューサー", catch: "全員が楽しめる旅を組む。",
    strengths: ["年齢の違う人を満足させる", "安心できる宿と店を選ぶ", "思い出を形に残す"],
    weaknesses: ["自分の行きたい所を後回しにする", "準備が大変"],
    likes: "家族向けの宿、移動の少ない旅、体験教室", dislikes: "下調べなしの冒険",
    aruaru: ["子ども用の予定と大人用の予定がある", "雨の日の予定も用意してある", "移動は1日2時間まで", "旅のアルバムを作る", "家族の誕生日が旅の日"],
    guardian: { trait: "群れ全員を守って旅する生きもの。みんなを包む大きな翼", why: "一緒に行く人全員の笑顔を考えて、旅を組むから" },
    themes: ["onsen", "sea"], budget: "mid",
  },
];

export const getType = (code: string) => TYPES.find((t) => t.code === code.toUpperCase());
