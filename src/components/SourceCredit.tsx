import Link from "next/link";
import type { Creator, Place, Video } from "@/data/types";
import { timecode } from "@/lib/format";

const PLATFORM = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube" } as const;

/**
 * 出典の表示。だれの、どの投稿から来た情報かを必ず見せる。
 * 元の投稿のURLが未登録のときは、そう書く(リンクがあるように見せない)。
 */
export function SourceCredit({ video, creator, place, sample }: { video: Video; creator?: Creator; place?: Place; sample: boolean }) {
  const src = video.source;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-xl border border-line bg-card p-3 text-xs" aria-label="出典">
      <dt className="text-mute">投稿者</dt>
      <dd className="min-w-0">
        {creator ? (
          <Link href={`/creators/${creator.id}`} className="font-bold text-ink underline">
            {creator.name}
          </Link>
        ) : (
          <span className="text-mute">不明</span>
        )}
        {sample && <span className="ml-1.5 text-mute">(架空のサンプル)</span>}
      </dd>
      <dt className="text-mute">元の投稿</dt>
      <dd className="min-w-0">
        {src ? (
          <a href={src.url} target="_blank" rel="noopener" className="font-bold text-shu underline" data-source-link>
            {PLATFORM[src.platform]}で見る
          </a>
        ) : (
          <span className="text-ink2" data-source-missing>
            リンク未登録{sample ? "(サンプルのため元の投稿はありません)" : ""}
          </span>
        )}
        <span className="text-mute"> ・ {video.postedAt}の投稿</span>
      </dd>
      {place && (
        <>
          <dt className="text-mute">出てくる所</dt>
          <dd>
            「{video.title}」の {timecode(place.at)} ごろ
          </dd>
          <dt className="text-mute">情報の確認日</dt>
          <dd>{place.checkedAt}</dd>
        </>
      )}
    </dl>
  );
}
