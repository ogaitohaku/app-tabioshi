"use client";
import Link from "next/link";
import { useState } from "react";
import type { Area, Creator, Place, Video } from "@/data/types";
import { CATEGORY_ICON, PrBadge, TripCard } from "@/components/bits";
import { Icon } from "@/components/Icon";
import { SavePlaceButton, VisitedButton } from "@/components/PlaceActions";
import { Visual } from "@/components/Visual";
import { timecode } from "@/lib/format";
import { distanceKm, googleMapsPlaceUrl, kmLabel } from "@/lib/geo";
import { useMyPlaces } from "@/lib/my-places";
import { useSavedTrips } from "@/lib/saved";
import { track } from "@/lib/track";

type Near = { status: "idle" | "locating" | "ok" | "denied" | "unsupported"; at?: [number, number] };

/**
 * マイ旅。コピーした旅と「行きたい」で保存した場所を、旅先で見返せる形に並べる。
 * - ふだんはエリアごと。旅先では「いまいる場所から近い順」に並べ替えられる
 * - 位置情報はボタンを押したときだけ1回取得し、距離の計算にだけ使う(保存も送信もしない)
 */
export function MyTravel({ videos, places, areas, creators }: { videos: Video[]; places: Place[]; areas: Area[]; creators: Creator[] }) {
  const { ids: tripIds } = useSavedTrips();
  const [mine] = useMyPlaces();
  const [near, setNear] = useState<Near>({ status: "idle" });

  const video = (id: string) => videos.find((v) => v.id === id);
  const trips = tripIds.map(video).filter((v): v is Video => Boolean(v));
  const fromTrips = new Set(trips.map((v) => v.id));
  // 保存した場所 = 「行きたい」の場所 + コピーした旅に出てくる場所(同じ場所は1回だけ)
  const items = places.filter((p) => mine.saved[p.id] || fromTrips.has(p.videoId));
  const visitedCount = (list: Place[]) => list.filter((p) => mine.visited[p.id]).length;

  if (!trips.length && !items.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-card px-6 py-10 text-center">
        <Icon name="bookmark" className="h-8 w-8 text-mute" />
        <p className="font-bold">まだ保存した旅や場所はありません</p>
        <p className="text-sm text-ink2">旅ショートで「この旅をまるごとコピー」を押すか、旅程や場所のページで「行きたい」を押すと、ここに並びます。</p>
        <Link href="/shorts" className="mt-1 inline-flex h-11 items-center rounded-full bg-shu px-5 text-sm font-bold text-white">
          旅ショートを見る
        </Link>
      </div>
    );
  }

  function locate() {
    if (!("geolocation" in navigator)) return setNear({ status: "unsupported" });
    setNear({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNear({ status: "ok", at: [pos.coords.longitude, pos.coords.latitude] });
        track("near_sort", { count: items.length });
      },
      () => setNear({ status: "denied" }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  const row = (p: Place) => {
    const v = video(p.videoId);
    const c = v && creators.find((x) => x.id === v.creatorId);
    const km = near.at && distanceKm(near.at, p.lngLat);
    return (
      <li key={p.id} className="flex flex-col gap-2 rounded-xl border border-line bg-card p-2.5" data-place={p.id}>
        <Link href={`/places/${p.id}`} className="flex gap-3">
          <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-line">
            <Visual visual={p.visual} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-xs font-bold text-mute">
              <Icon name={CATEGORY_ICON[p.category]} className="h-3.5 w-3.5" />
              {v?.area}
              {p.sponsored && <PrBadge />}
              {km !== undefined && <span className="num ml-auto text-ink">{kmLabel(km)}</span>}
            </span>
            <span className="block truncate font-bold">{p.name}</span>
            <span className="block truncate text-xs text-mute">
              出典:{c?.name ?? "不明"}の動画 {timecode(p.at)}ごろ
            </span>
          </span>
        </Link>
        <span className="flex flex-wrap gap-2">
          <VisitedButton placeId={p.id} />
          <a
            href={googleMapsPlaceUrl(p.lngLat)}
            target="_blank"
            rel="noopener"
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-card px-4 text-sm font-bold text-ink ring-1 ring-line"
          >
            <Icon name="map" className="h-4 w-4" />
            地図
          </a>
          {mine.saved[p.id] && <SavePlaceButton placeId={p.id} iconOnly />}
        </span>
      </li>
    );
  };

  const byArea = areas
    .map((a) => ({ area: a, list: items.filter((p) => video(p.videoId)?.areaId === a.id).sort((x, y) => x.videoId.localeCompare(y.videoId) || x.at - y.at) }))
    .filter((g) => g.list.length);

  return (
    <div className="flex flex-col gap-8">
      {items.length > 0 && (
        <section aria-labelledby="places" className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-3">
            <h2 id="places" className="text-lg font-bold">
              保存した場所
            </h2>
            <span className="num text-xs text-mute">
              {visitedCount(items)} / {items.length}か所 行った
            </span>
          </div>
          <div className="flex flex-col gap-1.5 rounded-xl bg-wash p-3">
            <button
              type="button"
              onClick={locate}
              disabled={near.status === "locating"}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-shu px-4 text-sm font-bold text-white"
            >
              <Icon name="pin" className="h-4 w-4" />
              {near.status === "ok" ? "いまの場所で並べ直す" : near.status === "locating" ? "場所を確かめています…" : "旅先で:いまいる場所から近い順に並べる"}
            </button>
            <p className="text-xs leading-relaxed text-mute" role="status">
              {near.status === "denied"
                ? "位置情報を使えませんでした。エリアごとの一覧のまま表示しています。"
                : near.status === "unsupported"
                  ? "この端末では位置情報を使えません。エリアごとの一覧で表示しています。"
                  : "位置情報は、ボタンを押したときだけ距離の計算に使います。保存も送信もしません。"}
            </p>
          </div>

          {near.status === "ok" && near.at ? (
            <ol className="flex flex-col gap-2" aria-label="近い順">
              {[...items].sort((a, b) => distanceKm(near.at!, a.lngLat) - distanceKm(near.at!, b.lngLat)).map(row)}
            </ol>
          ) : (
            byArea.map(({ area, list }) => (
              <div key={area.id} className="flex flex-col gap-2">
                <h3 className="flex items-center justify-between gap-2 text-sm font-bold">
                  <Link href={`/areas/${area.id}`} className="inline-flex min-h-11 items-center underline">
                    {area.name}
                  </Link>
                  <span className="num text-xs font-normal text-mute">
                    {visitedCount(list)} / {list.length}か所 行った
                  </span>
                </h3>
                <ul className="flex flex-col gap-2">{list.map(row)}</ul>
              </div>
            ))
          )}
        </section>
      )}

      {trips.length > 0 && (
        <section aria-labelledby="trips" className="flex flex-col gap-3">
          <h2 id="trips" className="text-lg font-bold">
            コピーした旅
          </h2>
          {trips.map((v) => {
            const list = places.filter((p) => p.videoId === v.id);
            return (
              <div key={v.id} className="flex flex-col gap-1.5">
                <TripCard video={v} wide />
                <p className="num text-xs text-mute">
                  {visitedCount(list)} / {list.length}か所 行った
                </p>
              </div>
            );
          })}
        </section>
      )}
      <p className="text-xs text-mute">保存した旅と場所は、いまはこの端末の中だけに保存されます。ブラウザのデータを消すと消えます。</p>
    </div>
  );
}
