// コンテンツの型。本物のデータに差し替えるときも、この形に合わせて書く。

/** 写真がまだない場所に描く、イメージ画像の種類 */
export type SceneName =
  | "onsen"
  | "sea"
  | "snow"
  | "canal"
  | "snowtown"
  | "sakura"
  | "room"
  | "dish"
  | "craft"
  | "exterior";

/** 画像。photo があれば写真を使い、なければ scene のイメージ画像を描く */
export type Visual = {
  photo?: string; // public/ からのパス(例: /photos/beppu.jpg)
  scene: SceneName;
  seed: number;
  view?: SceneName; // room / exterior の窓から見える景色
};

export type Creator = {
  id: string;
  name: string;
  genre: string;
  followers: string;
  bio: string;
  visual: Visual;
  links: { platform: Platform; url: string }[];
};

export type Platform = "tiktok" | "instagram" | "youtube";

/** 旅の好み。診断と絞り込みで使う */
export type Theme = "onsen" | "sea" | "snow" | "town" | "food" | "train" | "craft";

export type Area = {
  id: string;
  name: string; // 表示用(例: 大分・別府)
  pref: string;
  intro: string;
  visual: Visual;
};

export type Video = {
  id: string;
  creatorId: string;
  areaId: string;
  themes: Theme[];
  title: string;
  caption: string;
  area: string; // 表示用(例: 大分・別府)
  pref: string;
  center: [number, number]; // [経度, 緯度]
  postedAt: string; // 表示用(例: 2024年11月)
  views: string;
  visual: Visual;
  /** 元の投稿。あればアプリ内で再生・リンクする */
  source?: { platform: Platform; url: string; youtubeId?: string };
};

export type PlaceCategory = "stay" | "food" | "gift" | "spot";

export type Review = { by: string; score: number; text: string; fromVideo: boolean };

export type Place = {
  id: string;
  videoId: string;
  /** 動画の何秒目に出てくるか */
  at: number;
  category: PlaceCategory;
  name: string;
  address: string;
  lngLat: [number, number];
  priceLabel: string;
  cost: number; // 1人あたりの目安(円)
  creatorWord: string; // 推しのひとこと
  visual: Visual;
  /** お店・宿がお金を払って載せている場合は true。画面に必ず PR と出す */
  sponsored?: boolean;
  checkedAt: string; // 情報を確認した日
  status: string;
  stay?: StayDetail;
};

export type StayDetail = {
  kind: string; // 温泉旅館・ホテルなど
  access: string;
  meal: string;
  pricePerNight: number; // 1室2名の目安
  score: number;
  reviewCount: number;
  tags: string[];
  reviews: Review[];
  booking?: Booking;
};

/**
 * 予約先。タビオシでは予約を受けず、予約サイトへ紹介する。
 * rakutenHotelNo があれば楽天トラベルの施設ページへ、url があればその URL へ送る。
 */
export type Booking = {
  rakutenHotelNo?: string;
  url?: string;
  label?: string;
};

export type LearnCard = { title: string; body: string };

export type Quiz = {
  id: string;
  videoId: string;
  question: string;
  options: string[];
  answer: number;
  explain: string; // 正解のあとに出す説明
  creatorSays?: string;
};
