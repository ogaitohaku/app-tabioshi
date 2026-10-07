// 予約は外部の予約サイトで行い、タビオシは紹介料を受け取る(アフィリエイト)。
// 楽天トラベルの紹介IDは環境変数 NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID に入れる。
import type { Booking } from "@/data/types";

export type BookingLink = { href: string; label: string; provider: string };

export function rakutenHotelUrl(hotelNo: string) {
  return `https://travel.rakuten.co.jp/HOTEL/${encodeURIComponent(hotelNo)}/`;
}

/** 楽天アフィリエイトの紹介リンクで包む。IDがなければ元のURLのまま返す */
export function withRakutenAffiliate(url: string, affiliateId: string | undefined) {
  if (!affiliateId) return url;
  const enc = encodeURIComponent(url);
  return `https://hb.afl.rakuten.co.jp/hgc/${affiliateId}/?pc=${enc}&m=${enc}`;
}

export function bookingLink(
  booking: Booking | undefined,
  affiliateId: string | undefined = process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID,
): BookingLink | null {
  if (!booking) return null;
  if (booking.rakutenHotelNo) {
    return {
      href: withRakutenAffiliate(rakutenHotelUrl(booking.rakutenHotelNo), affiliateId),
      label: booking.label ?? "楽天トラベルで空室を見る",
      provider: "楽天トラベル",
    };
  }
  if (booking.url) {
    return { href: booking.url, label: booking.label ?? "予約サイトで空室を見る", provider: new URL(booking.url).hostname };
  }
  return null;
}
