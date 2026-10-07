@AGENTS.md

# タビオシ

- 画面の文言はすべて日本語。明るい表示のみ(ダークモードは入れない方針)。
- 色は `src/app/globals.css` の `@theme`(shu=朱がアクセント)。Tailwind のクラスで使う。
- データは `src/lib/content.ts` 経由で読む。画面から `src/data/` を直接 import しない(型は除く)。
- サンプルデータは架空。実在の人物・宿・お店の名前を使わない。実在の建物の写真を架空の宿として出さない。
- 掲載料をもらっている場所は `sponsored: true` にして、必ず PR と表示する。
- 予約は外部サイトへのアフィリエイトリンクだけ(旅行業の登録がないため、自社で予約・決済を受けない)。
- `cacheComponents` が有効なので、動的ルートに `dynamicParams` は書けない。`generateStaticParams` を使う。
