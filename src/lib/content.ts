// 画面からはこのファイル経由でデータを読む。データの置き場所(今はファイル、のちにデータベース)を変えても画面は変えずに済む。
import { areas, creators, learn, places, quizzes, videos } from "@/data/sample";
import type { PlaceCategory, Theme } from "@/data/types";

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
export const placesInVideo = (videoId: string) =>
  places.filter((p) => p.videoId === videoId).sort((a, b) => a.at - b.at);

export const stayOfVideo = (videoId: string) => placesInVideo(videoId).find((p) => p.category === "stay");

export const stays = () => places.filter((p) => p.category === "stay");

export const learnFor = (videoId: string) => learn[videoId];
export const quizzesFor = (videoId: string) => quizzes.filter((q) => q.videoId === videoId);

/** 旅程の1人あたり合計の目安(宿は1室2名の半額で計算) */
export const tripCostPerPerson = (videoId: string) =>
  placesInVideo(videoId).reduce((sum, p) => sum + (p.stay ? Math.round(p.stay.pricePerNight / 2) : p.cost), 0);
