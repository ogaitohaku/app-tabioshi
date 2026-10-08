import { BackBar } from "./BackBar";

/** 利用規約・プライバシーポリシーなどの文書ページ */
export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: [string, string[]][] }) {
  return (
    <main className="pb-10">
      <BackBar title={title} />
      <article className="flex flex-col gap-6 px-4 pt-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-black">{title}</h1>
          <p className="text-xs text-mute">最終更新日:{updated}</p>
          <p className="rounded-2xl bg-shu-soft p-3 text-xs leading-relaxed text-ink2">
            これは公開前の下書きです。〔 〕の部分を埋め、正式に公開する前に弁護士などの専門家に確認してもらってください。
          </p>
        </header>
        {sections.map(([h, paras]) => (
          <section key={h} className="flex flex-col gap-1.5">
            <h2 className="font-black">{h}</h2>
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
