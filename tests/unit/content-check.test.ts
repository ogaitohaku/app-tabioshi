// 掲載前チェックが、足りないものを正しく拾うかを確かめる。
import assert from "node:assert/strict";
import { test } from "node:test";
import type { Creator, Place, Video } from "../../src/data/types.ts";
import { checkContent, parseJpDate } from "../../src/lib/content-check.ts";

const visual = { scene: "onsen", seed: 1 } as const;
const creator: Creator = {
  id: "c",
  name: "架空の人",
  genre: "",
  followers: "",
  bio: "",
  visual,
  links: [],
  consent: { agreedAt: "2026-10-01", scope: "動画の引用と旅程の掲載" },
};
const video: Video = {
  ...({} as Video),
  id: "v",
  creatorId: "c",
  title: "架空の旅",
  visual,
  source: { platform: "youtube", url: "https://example.com/v" },
};
const place: Place = {
  ...({} as Place),
  id: "p",
  videoId: "v",
  name: "架空の宿",
  category: "stay",
  checkedAt: "2026年9月1日",
  stay: { booking: { url: "https://example.com/b" } } as Place["stay"],
};
const today = new Date(Date.UTC(2026, 9, 16));

test("そろっていれば何も出ない", () => {
  assert.deepEqual(checkContent({ creators: [creator], videos: [video], places: [place] }, today), []);
});

test("同意・元の投稿・確認日・予約先の不足を拾う", () => {
  const f = checkContent(
    {
      creators: [{ ...creator, consent: undefined }],
      videos: [{ ...video, source: undefined }],
      places: [
        { ...place, checkedAt: "2025年12月1日", stay: { booking: undefined } as Place["stay"] },
        { ...place, id: "q", checkedAt: "そのうち" },
      ],
    },
    today,
  );
  const errors = f.filter((x) => x.level === "error").map((x) => x.what);
  const warns = f.filter((x) => x.level === "warn").map((x) => x.what);
  assert.equal(errors.length, 3);
  assert.ok(errors.some((w) => w.includes("掲載の同意")));
  assert.ok(errors.some((w) => w.includes("元の投稿")));
  assert.ok(errors.some((w) => w.includes("確認日が読めません")));
  assert.ok(warns.some((w) => w.includes("180日")));
  assert.ok(warns.some((w) => w.includes("予約先")));
});

test("日付の読み取り", () => {
  assert.equal(parseJpDate("2026年9月20日")?.toISOString().slice(0, 10), "2026-09-20");
  assert.equal(parseJpDate("2026年2月30日"), null);
  assert.equal(parseJpDate("9/20"), null);
});
