// 予約先の表示が、実際につながっている先と一致するかを確かめる。
// 実行: npm run test:unit(Node 22 の型ストリップで動かす)
import assert from "node:assert/strict";
import { test } from "node:test";
import { bookingLink, bookingStatusText } from "../../src/lib/booking.ts";

test("予約先が未登録なら null(画面は「予約先を準備中」)", () => {
  assert.equal(bookingLink(undefined, "AFF"), null);
  assert.equal(bookingLink({}, "AFF"), null);
  assert.equal(bookingStatusText(null), "予約先:まだつないでいません");
});

test("楽天の施設番号と紹介IDがあれば紹介リンク", () => {
  const l = bookingLink({ rakutenHotelNo: "12345" }, "AFF-ID");
  assert.ok(l);
  assert.equal(l.affiliate, true);
  assert.equal(l.provider, "楽天トラベル");
  assert.match(l.href, /^https:\/\/hb\.afl\.rakuten\.co\.jp\/hgc\/AFF-ID\/\?pc=/);
  assert.equal(bookingStatusText(l), "予約先:楽天トラベル(紹介リンク)");
});

test("紹介IDが未設定なら、楽天への通常リンクで「紹介料なし」と出す", () => {
  const l = bookingLink({ rakutenHotelNo: "12345" }, undefined);
  assert.ok(l);
  assert.equal(l.affiliate, false);
  assert.equal(l.href, "https://travel.rakuten.co.jp/HOTEL/12345/");
  assert.equal(bookingStatusText(l), "予約先:楽天トラベル(通常のリンク・紹介料なし)");
});

test("任意のURLは affiliate: true を付けたときだけ紹介リンク扱い", () => {
  assert.equal(bookingLink({ url: "https://example.com/stay" }, "AFF")?.affiliate, false);
  assert.equal(bookingLink({ url: "https://example.com/stay", affiliate: true }, undefined)?.affiliate, true);
  assert.equal(bookingLink({ url: "https://example.com/stay" }, undefined)?.provider, "example.com");
});

test("壊れたURLは押せるリンクにしない", () => {
  assert.equal(bookingLink({ url: "not a url" }, "AFF"), null);
});
