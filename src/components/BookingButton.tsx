import type { StayDetail } from "@/data/types";
import { bookingLink } from "@/lib/booking";
import { Icon } from "./Icon";
import { OutLink } from "./OutLink";

/** 予約は外部サイトで行う。予約先が未登録の宿はボタンを押せない状態で出す */
export function BookingButton({ stay, placeId, compact = false }: { stay: StayDetail; placeId: string; compact?: boolean }) {
  const link = bookingLink(stay.booking);
  const size = compact ? "h-11 px-4 text-sm" : "h-12 w-full text-base";
  if (!link) {
    return (
      <span aria-disabled="true" className={`inline-flex items-center justify-center rounded-full bg-line font-bold text-mute ${size}`}>
        予約先を準備中
      </span>
    );
  }
  return (
    <OutLink
      event="booking_click"
      props={{ place: placeId }}
      href={link.href}
      target="_blank"
      rel="noopener sponsored"
      className={`inline-flex items-center justify-center gap-1.5 rounded-full bg-shu font-bold text-white ${size}`}
    >
      {link.label}
      <Icon name="external" className="h-4 w-4" />
    </OutLink>
  );
}

export function BookingDisclosure() {
  return (
    <p className="text-xs leading-relaxed text-mute">
      予約は楽天トラベルなど外部の予約サイトで行います。予約が成立すると、タビオシと旅を紹介したクリエイターが紹介料を受け取ります。紹介リンクを使っても、予約サイトでの料金が上がることはありません。
    </p>
  );
}
