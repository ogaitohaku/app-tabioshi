import type { Theme } from "@/data/types";

/** タイプの一番好きなテーマから、共有画像の背景色を選ぶ */
export const SCENE_OF_THEME: Record<Theme, string> = {
  onsen: "onsen",
  sea: "sea",
  snow: "snow",
  town: "canal",
  food: "dish",
  train: "snowtown",
  craft: "craft",
};
