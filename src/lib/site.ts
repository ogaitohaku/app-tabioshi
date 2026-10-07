// 公開URL。独自ドメインに変えたら環境変数 NEXT_PUBLIC_SITE_URL を設定する
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://app-tabioshi.vercel.app").replace(/\/$/, "");
export const SITE_NAME = "タビオシ";
export const TAGLINE = "推しの旅を、そのまま予約。";
