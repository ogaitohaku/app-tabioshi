import { BackBar } from "./BackBar";

/** 利用規約・プライバシーポリシーなどの文書ページ */
export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: [string, string[]][] }) {
  return (
    <main className="pb-10">
      <BackBar title={title} />
      <article className="flex flex-col gap-6 px-4 pt-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-xs text-mute">最終更新日:{updated}</p>
          <p className="rounded-xl bg-shu-soft p-3 text-xs leading-relaxed text-ink2">
            これは公開前の案です(専門家の確認前)。【要記入】は内容を書き入れる箇所、【要確認】は事実や方針を確かめる箇所です。正式に公開する前に、弁護士などの専門家に確認してもらってください。
          </p>
        </header>
        {sections.map(([h, paras]) => (
          <section key={h} className="flex flex-col gap-1.5">
            <h2 className="font-bold">{h}</h2>
            {paras.map((t) => (
              <p key={t} className="text-sm leading-relaxed text-ink2">
                {t}
              </p>
            ))}
          </section>
        ))}
      </article>
    </main>
  );
}
