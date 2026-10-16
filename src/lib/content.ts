// 画面からはこのファイル経由でデータを読む。データの置き場所(今はファイル、のちにデータベース)を変えても画面は変えずに済む。
import { areas, creators, learn, places, quizzes, videos } from "@/data/sample";
import { TYPES } from "@/data/travelType";
import type { PlaceCategory, Theme, Visual } from "@/data/types";
import { bookingLink } from "@/lib/booking";

export { IS_SAMPLE } from "@/data/sample";

export const CATEGORY_LABEL: Record<PlaceCategory, string> = {
  stay: "宿",
  food: "グルメ",
  gift: "お土産",
  spot: "絶景",
};

export const THEME_LABEL: Record<Theme, string> = {
  onsen: "温泉",
  sea: "海・島",
  snow: "雪景色",
  town: "街歩き",
  food: "グルメ",
  train: "鉄道",
  craft: "ものづくり",
};

export const allAreas = () => areas;
export const getArea = (id: string) => areas.find((a) => a.id === id);
export const videosInArea = (areaId: string) => videos.filter((v) => v.areaId === areaId);
export const placesInArea = (areaId: string) => {
  const ids = new Set(videosInArea(areaId).map((v) => v.id));
  return places.filter((p) => ids.has(p.videoId));
};
export const allQuizzes = () => quizzes;

export const allCreators = () => creators;
export const allVideos = () => videos;
export const allPlaces = () => places;

export const getCreator = (id: string) => creators.find((c) => c.id === id);
export const getVideo = (id: string) => videos.find((v) => v.id === id);
export const getPlace = (id: string) => places.find((p) => p.id === id);

export const videosByCreator = (creatorId: string) => videos.filter((v) => v.creatorId === creatorId);

/** 動画に出てくる順に並べた立ち寄り先 = 旅程 */
export const placesInVideo = (videoId: string) => places.filter((p) => p.videoId === videoId).sort((a, b) => a.at - b.at);

export const stayOfVideo = (videoId: string) => placesInVideo(videoId).find((p) => p.category === "stay");

export const stays = () => places.filter((p) => p.category === "stay");

export const learnFor = (videoId: string) => learn[videoId];
export const quizzesFor = (videoId: string) => quizzes.filter((q) => q.videoId === videoId);

/** 旅程の1人あたり合計の目安(宿は1室2名の半額で計算) */
export const tripCostPerPerson = (videoId: string) =>
  placesInVideo(videoId).reduce((sum, p) => sum + (p.stay ? Math.round(p.stay.pricePerNight / 2) : p.cost), 0);

// 旅タイプ診断(TRAVEL TYPE)
export { AXES as TYPE_AXES, QUESTIONS as TYPE_QUESTIONS } from "@/data/travelType";
export { compat as typeCompat, stars as typeStars } from "@/lib/travel-type";
export const allTravelTypes = () => TYPES;
export const getTravelType = (code: string) => TYPES.find((t) => t.code === code.toUpperCase());

/** タイプの好きなテーマが多く入っている旅から順に。themes を複数渡すと、二人の両方に合う旅が上に来る */
export const tripsForThemes = (...wants: Theme[][]) =>
  videos
    .map((v) => ({ v, score: wants.reduce((n, w) => n + (v.themes.some((t) => w.includes(t)) ? 2 : 0) + v.themes.filter((t) => w.includes(t)).length, 0) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.v);

/** 宿の予約先が実際にどこへつながっているかの集計(画面に正確に出すため) */
export function bookingSummary() {
  const links = stays().map((p) => bookingLink(p.stay?.booking));
  return {
    total: links.length,
    affiliate: links.filter((l) => l?.affiliate).length,
    direct: links.filter((l) => l && !l.affiliate).length,
    none: links.filter((l) => !l).length,
    providers: [...new Set(links.flatMap((l) => (l ? [l.provider] : [])))],
  };
}

/** 「行き先をいっしょに決める」で候補にできるもの(旅と場所)。画面に出す分だけに絞って渡す */
export type PlanCandidate = {
  key: string; // "t:動画ID" | "p:場所ID"
  kind: "trip" | "place";
  href: string;
  title: string;
  area: string;
  by: string; // 投稿者名
  price: string; // 1人あたりの目安
  note: string; // 立ち寄り数・種類
  sponsored: boolean;
  visual: Visual;
  videoId: string;
};

export function planCandidates(): PlanCandidate[] {
  const trips = videos.map<PlanCandidate>((v) => ({
    key: `t:${v.id}`,
    kind: "trip",
    href: `/trips/${v.id}`,
    title: v.title,
    area: v.area,
    by: getCreator(v.creatorId)?.name ?? "",
    price: `1人 ¥${tripCostPerPerson(v.id).toLocaleString("ja-JP")}〜`,
    note: `立ち寄り${placesInVideo(v.id).length}か所`,
    sponsored: false,
    visual: v.visual,
    videoId: v.id,
  }));
  const spots = places.map<PlanCandidate>((p) => {
    const v = getVideo(p.videoId);
    return {
      key: `p:${p.id}`,
      kind: "place",
      href: `/places/${p.id}`,
      title: p.name,
      area: v?.area ?? "",
      by: (v && getCreator(v.creatorId)?.name) ?? "",
      price: p.stay ? `1泊 ¥${Math.round(p.stay.pricePerNight / 2).toLocaleString("ja-JP")}〜/人` : p.priceLabel,
      note: CATEGORY_LABEL[p.category],
      sponsored: !!p.sponsored,
      visual: p.visual,
      videoId: p.videoId,
    };
  });
  return [...trips, ...spots];
}
