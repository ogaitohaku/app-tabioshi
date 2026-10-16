// 今回の更新の確認(スマホ幅 390px)。
// 「動画 → 場所の情報・地図 → 保存 → 旅先で再発見」と、出典・予約先の表示、既存の保存データが残ることを通しで見る。
// 実行: npx next start -p 3100 のあと  BASE=http://localhost:3100 node tests/e2e/flow.cjs
// (Playwright は package.json に入れていない。グローバルに入っているものを NODE_PATH で使う)
const { chromium } = require("playwright");
const B = process.env.BASE || "http://localhost:3100";
const results = [];
const ok = (name, pass, info = "") => results.push({ name, pass: !!pass, info });

// これまでの版で保存されているはずの端末内データ(この形のまま残ることを確かめる)
const OLD = {
  "tabioshi.savedTrips": JSON.stringify(["beppu"]),
  "tabioshi.prefs": JSON.stringify({ themes: ["onsen"], budget: 20000, done: true }),
  "tabioshi.dailyQuiz": JSON.stringify({ last: "2026-10-01", streak: 4, best: 6, picked: null }),
  "tabioshi.type": JSON.stringify({ code: "DIMQ", result: null, at: "2026-10-01T00:00:00.000Z", history: [], fit: {} }),
  "tabioshi.welcome": JSON.stringify({ closed: true }),
};

async function sizes(page) {
  return page.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll("button, [aria-pressed], a.inline-flex, a.rounded-full")) {
      const r = el.getBoundingClientRect();
      if (r.width && r.height && r.height < 44)
        bad.push(`${el.tagName} ${Math.round(r.height)}px "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 16)}"`);
    }
    for (const el of document.querySelectorAll("main *")) {
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (own && !el.closest(".sr-only,svg") && el.getBoundingClientRect().width && parseFloat(getComputedStyle(el).fontSize) < 12)
        bad.push("small " + el.textContent.trim().slice(0, 16));
    }
    return { bad, wide: document.documentElement.scrollWidth > innerWidth + 1 };
  });
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await ctx.addInitScript((old) => {
    if (!sessionStorage.getItem("seeded")) {
      for (const [k, v] of Object.entries(old)) localStorage.setItem(k, v);
      sessionStorage.setItem("seeded", "1");
    }
  }, OLD);
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));

  // 1. 既存データの引き継ぎ: 前の版でコピーした旅が、そのままマイ旅に出る
  await page.goto(B + "/me", { waitUntil: "networkidle" });
  ok("引き継ぎ: 前の版でコピーした旅(別府)がマイ旅に出る", await page.locator('a[href="/trips/beppu"]').count());
  ok(
    "引き継ぎ: 旅に出てくる4か所が「保存した場所」に出る",
    (await page.locator("[data-place]").count()) === 4,
    `${await page.locator("[data-place]").count()}件`,
  );

  // 2. 動画(旅ショート): 出典の一行と、予約先がない宿は「宿を見る」
  await page.goto(B + "/shorts", { waitUntil: "networkidle" });
  const first = page.locator("article").first();
  ok("旅ショート: 出典(投稿者・投稿時期)を出す", /出典:.+の投稿 ・ \d{4}年\d+月/.test(await first.innerText()));
  ok("旅ショート: 元の投稿がない動画は「リンク未登録」と出す", (await first.innerText()).includes("元の投稿リンク未登録"));
  ok("旅ショート: 予約先がない宿に「空室を見る」と出さない", (await page.getByText("空室を見る", { exact: true }).count()) === 0);
  ok("旅ショート: 代わりに「宿を見る」", (await page.getByText("宿を見る", { exact: true }).count()) >= 1);

  // 3. 旅程: 出典の表と、場所ごとの「行きたい」
  await page.goto(B + "/trips/otaru", { waitUntil: "networkidle" });
  const credit = page.locator('dl[aria-label="出典"]');
  ok("旅程: 出典に投稿者のリンク", await credit.locator('a[href^="/creators/"]').count());
  ok("旅程: 出典に「リンク未登録」(サンプルのため)", await credit.locator("[data-source-missing]").count());
  ok("旅程: 予約先の状態を一行で出す", (await page.locator("[data-booking-status]").first().innerText()).startsWith("予約先:"));
  const disc = await page.locator("main").innerText();
  ok("旅程: 予約先がないのに紹介料の説明を出さない", !disc.includes("紹介料を受け取ります"));
  await page.getByRole("button", { name: "行きたいに保存" }).nth(2).click(); // 小樽運河の夜景ポイント
  ok("旅程: 「行きたい」を押すと保存済みになる", (await page.locator('button[aria-pressed="true"][aria-label="行きたいから外す"]').count()) === 1);
  let s = await sizes(page);
  ok("旅程: ボタン44px以上・文字12px以上・横はみ出しなし", !s.bad.length && !s.wide, s.bad.join(" / "));

  // 4. 場所: 地図、出典(何分ごろ・確認日)、保存と「行った」
  await page.goto(B + "/places/otaru-canal", { waitUntil: "networkidle" });
  ok("場所: 保存したことが場所のページにも反映", (await page.getByRole("button", { name: "行きたいに保存済み" }).getAttribute("aria-pressed")) === "true");
  const map = await page.getByRole("link", { name: "地図で開く" }).getAttribute("href");
  ok("場所: 地図で開く(その場所の座標)", map === "https://www.google.com/maps/search/?api=1&query=43.188,140.975", map);
  const pc = await page.locator('dl[aria-label="出典"]').innerText();
  ok("場所: 出典に動画の何分ごろと確認日", /12:40 ごろ/.test(pc) && pc.includes("情報の確認日"), pc.replace(/\n/g, " "));
  await page.getByRole("button", { name: "行ったら記録" }).click();
  ok("場所: 「行った」を記録できる", await page.getByRole("button", { name: "行った", exact: true }).count());
  s = await sizes(page);
  ok("場所: ボタン44px以上・文字12px以上・横はみ出しなし", !s.bad.length && !s.wide, s.bad.join(" / "));

  // 5. 宿: 予約先の表示が実データと一致(今は全宿が未接続)
  await page.goto(B + "/places/akari", { waitUntil: "networkidle" });
  ok("宿: 予約先がない宿は「予約先:まだつないでいません」", (await page.locator('[data-booking-status="none"]').innerText()) === "予約先:まだつないでいません");
  ok("宿: 押せる予約リンクを出さない", (await page.locator('a[rel~="sponsored"]').count()) === 0);
  await page.goto(B + "/about", { waitUntil: "networkidle" });
  ok(
    "タビオシについて: つながっている予約先の集計",
    /掲載中の宿 4件のうち、紹介リンクでつながっている宿 0件、通常のリンクの宿 0件、予約先を準備中の宿 4件/.test(
      await page.locator("[data-booking-summary]").innerText(),
    ),
  );

  // 6. マイ旅: エリアごと → 旅先で近い順(小樽にいるつもり)
  await page.goto(B + "/me", { waitUntil: "networkidle" });
  ok("マイ旅: 別府4か所＋小樽1か所", (await page.locator("[data-place]").count()) === 5);
  ok("マイ旅: 「行った」の数を出す", (await page.locator("main").innerText()).includes("1 / 5か所 行った"));
  await ctx.grantPermissions(["geolocation"], { origin: B });
  await ctx.setGeolocation({ latitude: 43.19, longitude: 140.99 });
  await page.getByRole("button", { name: /近い順に並べる/ }).click();
  await page.locator('ol[aria-label="近い順"]').waitFor();
  const order = await page.locator('ol[aria-label="近い順"] [data-place]').evaluateAll((els) => els.map((e) => e.getAttribute("data-place")));
  ok("マイ旅: 旅先(小樽)では小樽の場所がいちばん上", order[0] === "otaru-canal", order.join(","));
  ok("マイ旅: 距離を出す", /\d+(\.\d)?(km|m)/.test(await page.locator('ol[aria-label="近い順"] [data-place]').first().innerText()));
  s = await sizes(page);
  ok("マイ旅: ボタン44px以上・文字12px以上・横はみ出しなし", !s.bad.length && !s.wide, s.bad.join(" / "));

  // 7. ホーム: 次に開く理由(マイ旅の続き)
  await page.goto(B + "/", { waitUntil: "networkidle" });
  const cont = page.getByRole("link", { name: "マイ旅の続き" });
  ok("ホーム: 「マイ旅の続き」に保存数と行った数", /保存した場所 5か所 ・ 行った 1か所/.test(await cont.innerText()));

  // 8. 共有: リンクに ?ref=share が付き、開いた人に一言出る
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: B });
  await page.goto(B + "/trips/otaru", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    delete Navigator.prototype.share;
  });
  await page.getByRole("button", { name: "共有" }).click();
  await page.getByText("リンクをコピー").click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  ok("共有: コピーしたリンクに ?ref=share", copied === B + "/trips/otaru?ref=share", copied);
  await page.goto(copied, { waitUntil: "networkidle" });
  ok("共有: 友だちから届いた旅だと一言出る", await page.getByText("友だちから届いた旅です").count());

  // 9. 位置情報を断ったとき
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx2.addInitScript(() => localStorage.setItem("tabioshi.savedTrips", JSON.stringify(["tadami"])));
  const p2 = await ctx2.newPage();
  await p2.goto(B + "/me", { waitUntil: "networkidle" });
  await p2.getByRole("button", { name: /近い順に並べる/ }).click();
  await p2
    .getByText("位置情報を使えませんでした")
    .waitFor({ timeout: 5000 })
    .catch(() => {});
  ok("位置情報を断ったら、エリアごとの一覧のまま案内", await p2.getByText("位置情報を使えませんでした").count());
  await ctx2.close();

  // 10. 既存データは上書きされていない(新しい保存は別のキー)
  const after = await page.evaluate((keys) => Object.fromEntries(keys.map((k) => [k, localStorage.getItem(k)])), Object.keys(OLD));
  const same = Object.keys(OLD)
    .filter((k) => k !== "tabioshi.welcome" && k !== "tabioshi.dailyQuiz")
    .every((k) => after[k] === OLD[k]);
  ok("引き継ぎ: これまでのキー(旅・好み・診断)は書き換わっていない", same, JSON.stringify(after));
  const mine = await page.evaluate(() => JSON.parse(localStorage.getItem("tabioshi.myPlaces")));
  ok("新しいキー tabioshi.myPlaces に保存・行った", mine.saved["otaru-canal"] && mine.visited["otaru-canal"], JSON.stringify(mine));

  ok("ページのエラーなし", !errs.length, errs.join(" / "));
  await page.goto(B + "/me", { waitUntil: "networkidle" });
  await page.screenshot({ path: (process.env.OUT || ".") + "/flow-me.png", fullPage: true });
  await browser.close();

  const fail = results.filter((r) => !r.pass);
  for (const r of results) console.log(`${r.pass ? "OK " : "NG "} ${r.name}${r.info && !r.pass ? "  ← " + r.info : ""}`);
  console.log(`\n${results.length - fail.length}/${results.length} OK`);
  process.exit(fail.length ? 1 : 0);
})();
