"use client";
import { toggled, useMyPlaces } from "@/lib/my-places";
import { track } from "@/lib/track";
import { Icon } from "./Icon";

/**
 * 場所を「行きたい」に保存する。保存した場所はマイ旅に並び、旅先で近い順に見返せる。
 * 押した状態は、ほかのボタンと同じ「朱のうすい面＋朱の線」。アイコンだけのときは、保存済みを塗りつぶしたしおりで表す
 */
export function SavePlaceButton({ placeId, iconOnly = false, main = false }: { placeId: string; iconOnly?: boolean; main?: boolean }) {
  const [mine, setMine] = useMyPlaces();
  const saved = Boolean(mine.saved[placeId]);
  const label = saved ? "行きたいに保存済み" : "行きたい";
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={iconOnly ? (saved ? "行きたいから外す" : "行きたいに保存") : undefined}
      title={iconOnly ? (saved ? "行きたいから外す" : "行きたいに保存") : undefined}
      onClick={() => {
        if (!saved) track("save_place", { place: placeId });
        setMine({ ...mine, saved: toggled(mine.saved, placeId) });
      }}
      className={`btn shrink-0 ${iconOnly ? "w-11 px-0" : ""} ${saved ? "btn-on" : main ? "btn-main" : "btn-sub"}`}
    >
      {iconOnly ? <Icon name="bookmark" fill={saved} className="h-5 w-5" /> : <Icon name={saved ? "check" : "bookmark"} className="h-4 w-4" />}
      {!iconOnly && label}
    </button>
  );
}

/** 旅先で「行った」を記録する。マイ旅の進み具合(3/5か所 など)に使う */
export function VisitedButton({ placeId }: { placeId: string }) {
  const [mine, setMine] = useMyPlaces();
  const done = Boolean(mine.visited[placeId]);
  return (
    <button
      type="button"
      aria-pressed={done}
      onClick={() => {
        if (!done) track("visited", { place: placeId });
        setMine({ ...mine, visited: toggled(mine.visited, placeId) });
      }}
      className={`btn shrink-0 ${done ? "btn-on" : "btn-sub"}`}
    >
      <Icon name={done ? "check" : "pin"} className="h-4 w-4" />
      {done ? "行った" : "行ったら記録"}
    </button>
  );
}
