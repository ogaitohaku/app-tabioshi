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

export type TypeQuestion = { axis: AxisId; text: string; options: { label: string; score: number }[] };

/** 設問。日常の旅の場面で聞く。各軸4問、選択肢の点は +2 / +1 / −1 / −2 */
export const QUESTIONS: TypeQuestion[] = [
  { axis: "where", text: "旅先で、気になる細い路地を見つけた。", options: [
    { label: "予定を変えて入ってみる", score: 2 },
    { label: "帰りに時間があれば寄る", score: 1 },
    { label: "写真だけ撮って予定通り進む", score: -1 },
    { label: "知らない道には入らない", score: -2 },
  ] },
  { axis: "decide", text: "宿を決めるのは、だいたいいつ?", options: [
    { label: "当日、着いてから", score: 2 },
    { label: "1週間前くらい", score: 1 },
    { label: "1か月前に、比べて決める", score: -1 },
    { label: "半年前から、一番いい日を狙う", score: -2 },
  ] },
  { axis: "with", text: "理想の旅の人数は?", options: [
    { label: "一人", score: 2 },
    { label: "気の合う一人と", score: 1 },
    { label: "3〜4人の仲間と", score: -1 },
    { label: "大人数でわいわい", score: -2 },
  ] },
  { axis: "depth", text: "1泊2日で回りたい場所の数は?", options: [
    { label: "5か所以上", score: 2 },
    { label: "3〜4か所", score: 1 },
    { label: "2か所くらい", score: -1 },
    { label: "宿から出なくてもいい", score: -2 },
  ] },
  { axis: "where", text: "久しぶりの3連休。行き先は?", options: [
    { label: "行ったことのない県", score: 2 },
    { label: "前から気になっていた場所", score: 1 },
    { label: "前に行って良かった場所", score: -1 },
    { label: "いつもの温泉", score: -2 },
  ] },
  { axis: "decide", text: "旅の前の日の夜。", options: [
    { label: "何も決めずに寝る", score: 2 },
    { label: "行きたい所を3つだけメモ", score: 1 },
    { label: "時間ごとの予定を作る", score: -1 },
    { label: "雨の日の予定まで作る", score: -2 },
  ] },
  { axis: "with", text: "宿で、夜ごはんのあと。", options: [
    { label: "部屋で一人のんびり", score: 2 },
    { label: "一人で夜の散歩に出る", score: 1 },
    { label: "一緒に来た人と語る", score: -1 },
    { label: "宿の人や他のお客さんと話す", score: -2 },
  ] },
  { axis: "depth", text: "同じ旅先には、何回行く?", options: [
    { label: "一度行ったら次の場所へ", score: 2 },
    { label: "たまにまた行く", score: 1 },
    { label: "気に入ったら毎年", score: -1 },
    { label: "季節ごとに通う", score: -2 },
  ] },
  { axis: "where", text: "ご飯どきの店選び。", options: [
    { label: "看板もない地元の店", score: 2 },
    { label: "地元の人に聞いた店", score: 1 },
    { label: "名物が食べられる有名店", score: -1 },
    { label: "味を知っているいつもの店", score: -2 },
  ] },
  { axis: "decide", text: "予定していた店が、臨時休業だった。", options: [
    { label: "歩いて、目についた店に入る", score: 2 },
    { label: "その場の気分で次を決める", score: 1 },
    { label: "用意していた第2候補へ", score: -1 },
    { label: "口コミを比べ直してから決める", score: -2 },
  ] },
  { axis: "with", text: "旅の写真は?", options: [
    { label: "自分のために撮る。誰にも見せない", score: 2 },
    { label: "あとで自分で見返す用", score: 1 },
    { label: "一緒に行った人とLINEで分ける", score: -1 },
    { label: "その日のうちにSNSに載せる", score: -2 },
  ] },
  { axis: "depth", text: "旅の朝。", options: [
    { label: "日の出前に出発", score: 2 },
    { label: "朝ごはんを食べたらすぐ出る", score: 1 },
    { label: "チェックアウトぎりぎりまでのんびり", score: -1 },
    { label: "連泊なので予定なし", score: -2 },
  ] },
  { axis: "where", text: "旅のお土産は?", options: [
    { label: "地元のスーパーで見つけた謎の調味料", score: 2 },
    { label: "工房で作り手から買う器", score: 1 },
    { label: "定番の銘菓", score: -1 },
    { label: "帰りの駅でまとめて買う", score: -2 },
  ] },
  { axis: "decide", text: "旅先で一番うれしい瞬間は?", options: [
    { label: "予想していなかった出会い", score: 2 },
    { label: "ふと見つけた景色", score: 1 },
    { label: "予定通り全部回れた時", score: -1 },
    { label: "調べた通りの味だった時", score: -2 },
  ] },
  { axis: "with", text: "行きたい店で、同行者と意見が分かれた。", options: [
    { label: "別行動して、あとで合流", score: 2 },
    { label: "自分の行きたい方を推す", score: 1 },
    { label: "相手に合わせる", score: -1 },
    { label: "両方行けるように組み直す", score: -2 },
  ] },
  { axis: "depth", text: "旅から帰って、一番残っているのは?", options: [
    { label: "回った場所の数", score: 2 },
    { label: "撮った写真", score: 1 },
    { label: "ある一日の空気", score: -1 },
    { label: "現地で聞いた話や、人の名前", score: -2 },
  ] },
];

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
