// 予約は外部の予約サイトで行い、タビオシは紹介料を受け取る(アフィリエイト)。
// 楽天トラベルの紹介IDは環境変数 NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID に入れる。
// 画面には「実際につながっている予約先」と「紹介料が発生するか」をそのまま出す。
import type { Booking } from "@/data/types";

/**
 * affiliate: 紹介リンク(予約が成立すると紹介料が入る)
 * direct: 予約サイトへの通常リンク(紹介IDの設定前など。紹介料は入らない)
 */
export type BookingLink = { href: string; label: string; provider: string; affiliate: boolean };

export function rakutenHotelUrl(hotelNo: string) {
  return `https://travel.rakuten.co.jp/HOTEL/${encodeURIComponent(hotelNo)}/`;
}

/** 楽天アフィリエイトの紹介リンクで包む。IDがなければ元のURLのまま返す */
export function withRakutenAffiliate(url: string, affiliateId: string | undefined) {
  if (!affiliateId) return url;
  const enc = encodeURIComponent(url);
  return `https://hb.afl.rakuten.co.jp/hgc/${affiliateId}/?pc=${enc}&m=${enc}`;
}

export function bookingLink(booking: Booking | undefined, affiliateId: string | undefined = process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID): BookingLink | null {
  if (!booking) return null;
  if (booking.rakutenHotelNo) {
    return {
      href: withRakutenAffiliate(rakutenHotelUrl(booking.rakutenHotelNo), affiliateId),
      label: booking.label ?? "楽天トラベルで空室を見る",
      provider: "楽天トラベル",
      affiliate: Boolean(affiliateId),
    };
  }
  if (booking.url) {
    let provider: string;
    try {
      provider = new URL(booking.url).hostname;
    } catch {
      return null; // 壊れたURLは「準備中」として扱い、押せるリンクを出さない
    }
    return { href: booking.url, label: booking.label ?? "予約サイトで空室を見る", provider, affiliate: Boolean(booking.affiliate) };
  }
  return null;
}

/** 画面に出す「予約先」の一行 */
export function bookingStatusText(link: BookingLink | null) {
  if (!link) return "予約先:まだつないでいません";
  return link.affiliate ? `予約先:${link.provider}(紹介リンク)` : `予約先:${link.provider}(通常のリンク・紹介料なし)`;
}
