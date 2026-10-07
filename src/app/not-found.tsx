import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center gap-3 px-6 pt-24 text-center">
      <h1 className="text-xl font-black">ページが見つかりません</h1>
      <p className="text-sm text-ink2">リンクが古いか、旅が削除された可能性があります。</p>
      <Link href="/" className="rounded-full bg-shu px-5 py-2.5 text-sm font-bold text-white">
        ホームへ戻る
      </Link>
    </main>
  );
}
