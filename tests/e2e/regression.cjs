// 前の版までの確認(85項目・スマホ幅 390px)。今回の更新で、これまでの画面と操作がこわれていないかを見る。
// 実行: BASE=http://localhost:3100 node tests/e2e/regression.cjs(Playwright はグローバルのものを NODE_PATH で使う)
const { chromium } = require("playwright");
const B = process.env.BASE || "http://localhost:3100";
const OUT = (process.env.OUT || ".") + "/";
const results = [];
const ok = (name, pass, info = "") => results.push({ name, pass: !!pass, info });

const PAGES = ["/", "/welcome", "/shorts", "/me", "/map", "/type", "/about", "/terms", "/privacy"];

async function audit(page) {
  return page.evaluate(() => {
    const vis = (el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && !el.closest(".sr-only");
    };
    const small = [];
    const shortBtn = [];
    const fx = [];
    const colors = new Set();
    for (const el of document.querySelectorAll("body *")) {
      if (!vis(el) || el.closest("svg") || el.tagName === "CANVAS") continue;
      const cs = getComputedStyle(el);
      const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (ownText && parseFloat(cs.fontSize) < 12) small.push(`${el.tagName}.${el.className} ${cs.fontSize} "${el.textContent.trim().slice(0, 20)}"`);
      if (cs.backgroundImage.includes("gradient")) fx.push("gradient " + el.className);
      if (cs.backdropFilter && cs.backdropFilter !== "none") fx.push("backdrop " + el.className);
      for (const p of ["color", "backgroundColor", "borderTopColor"]) {
        const v = cs[p];
        if (p === "borderTopColor" && cs.borderTopWidth === "0px") continue;
        if (p === "backgroundColor" && v === "rgba(0, 0, 0, 0)") continue;
        colors.add(v);
      }
      const isBtn =
        el.tagName === "BUTTON" ||
        (el.tagName === "A" && /rounded-full|rounded-xl|h-1[12]/.test(el.className) && /(^|\s)(h-|py-|flex|inline-flex)/.test(el.className));
      if (isBtn) {
        const r = el.getBoundingClientRect();
        if (r.height < 44 && !el.closest("[data-q]"))
          shortBtn.push(`${el.tagName} ${Math.round(r.height)}px "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 18)}"`);
      }
    }
    return { small, shortBtn, fx, colors: [...colors], width: document.documentElement.scrollWidth };
  });
}

// 朱・グレー・白・黒(文字)系だけ許す。LINE の公式色はロゴなので別扱い
function offPalette(c) {
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) return false;
  const [r, g, b] = m[1].split(",").map((x) => parseFloat(x));
  const grey = Math.max(r, g, b) - Math.min(r, g, b) <= 24;
  const shu = r > 200 && g < 120 && b < 90; // #e8502e
  const shuSoft = r > 245 && g > 225 && b > 215 && r - b < 30; // #fdede7
  const line = r === 6 && g === 199 && b === 85;
  return !(grey || shu || shuSoft || line);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push("pageerror " + e.message));
  page.on("response", (r) => r.status() >= 400 && errs.push("http " + r.status() + " " + r.url()));
  page.on("console", (m) => m.type() === "error" && errs.push("console " + m.text()));

  // 1. 見た目のルール(全ページ)
  const trips = [];
  for (const p of PAGES) {
    await page.goto(B + p, { waitUntil: "networkidle" });
    const a = await audit(page, p);
    ok(`${p}: 横スクロールなし`, a.width <= 390, `width ${a.width}`);
    ok(`${p}: 12px未満の文字なし`, !a.small.length, a.small.slice(0, 3).join(" / "));
    ok(`${p}: 44px未満のボタンなし`, !a.shortBtn.length, a.shortBtn.slice(0, 4).join(" / "));
    ok(`${p}: グラデーション・すりガラスなし`, !a.fx.length, a.fx.slice(0, 3).join(" / "));
    const off = a.colors.filter(offPalette);
    ok(`${p}: 白・グレー・朱以外の色なし`, !off.length, off.join(" "));
    if (p === "/") for (const h of await page.$$eval('a[href^="/trips/"]', (as) => as.map((x) => x.getAttribute("href")))) trips.push(h);
  }
  const extra = [...new Set(trips)].slice(0, 1);
  const places = await page
    .goto(B + "/", { waitUntil: "networkidle" })
    .then(() => page.$$eval('a[href^="/places/"]', (as) => [...new Set(as.map((x) => x.getAttribute("href")))]));
  const areas = await page.$$eval('a[href^="/areas/"]', (as) => [...new Set(as.map((x) => x.getAttribute("href")))]);
  for (const p of [...extra, places[0], areas[0]]) {
    await page.goto(B + p, { waitUntil: "networkidle" });
    const a = await audit(page, p);
    ok(`${p}: 横スクロールなし`, a.width <= 390, `width ${a.width}`);
    ok(`${p}: 12px未満の文字なし`, !a.small.length, a.small.slice(0, 3).join(" / "));
    ok(`${p}: 44px未満のボタンなし`, !a.shortBtn.length, a.shortBtn.slice(0, 4).join(" / "));
    ok(`${p}: グラデーション・すりガラスなし`, !a.fx.length, a.fx.slice(0, 3).join(" / "));
    const off = a.colors.filter(offPalette);
    ok(`${p}: 白・グレー・朱以外の色なし`, !off.length, off.join(" "));
  }

  // 2. はじめての案内
  await ctx.clearCookies();
  await page.goto(B + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  ok("ホーム: はじめての案内が出る", await page.getByRole("complementary", { name: "はじめての方へ" }).count());
  ok("ホーム: 4ステップが出る", (await page.getByText("外部サイトで空室を確認").count()) >= 1);
  await page.getByRole("button", { name: "この案内を閉じる" }).click();
  await page.reload({ waitUntil: "networkidle" });
  ok("ホーム: 閉じた案内は次から出ない", !(await page.getByRole("complementary", { name: "はじめての方へ" }).count()));
  await page.screenshot({ path: OUT + "e2e-home.png" });

  // 3. LP
  await page.goto(B + "/welcome", { waitUntil: "networkidle" });
  const lp = await page.textContent("main");
  ok("LP: 合言葉", lp.includes("推しの旅を、") && lp.includes("そのまま予約。"));
  ok(
    "LP: 4ステップの流れ",
    ["動画を見る", "旅をまるごとコピー", "マイ旅に保存", "外部サイトで空室を確認"].every((t) => lp.includes(t)),
  );
  ok("LP: 試作・架空のサンプル", lp.includes("架空"));
  ok("LP: 予約・支払いは外部サイト", lp.includes("予約と支払いは、外部の予約サイトで"));
  await page.screenshot({ path: OUT + "e2e-welcome.png", fullPage: true });

  // 4. 旅ショート:縦スワイプ・サンプル表示・コピー
  await page.goto(B + "/shorts", { waitUntil: "networkidle" });
  ok("ショート: サンプル表示", (await page.getByText("サンプル", { exact: true }).count()) >= 1);
  ok("ショート: スワイプの案内", await page.getByText("上にスワイプすると").count());
  const box = await page.locator("main").boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(900);
  const top = await page.evaluate(() => {
    const m = document.querySelector("main");
    const arts = [...m.querySelectorAll("article")];
    return arts.findIndex((a) => Math.abs(a.getBoundingClientRect().top - m.getBoundingClientRect().top) < 4);
  });
  ok("ショート: スクロールで次の1本にぴったり切り替わる", top === 1, `index ${top}`);
  const second = await page.locator("article").nth(1);
  await second.getByRole("button", { name: /まるごとコピー/ }).click();
  ok("ショート: コピーすると「コピー済み」", (await second.getByRole("button", { name: /コピー済み/ }).count()) === 1);
  await page.screenshot({ path: OUT + "e2e-shorts.png" });

  // 5. マイ旅に保存されている
  await page.goto(B + "/me", { waitUntil: "networkidle" });
  ok("マイ旅: コピーした旅が並ぶ", (await page.locator('main a[href^="/trips/"]').count()) >= 1);
  ok("マイ旅: サンプル表示", (await page.getByText("架空のもの").count()) >= 1);

  // 6. 旅程:地図・共有・予約導線
  await page.goto(B + extra[0], { waitUntil: "networkidle" });
  ok("旅程: 地図が出る", (await page.locator("svg").count()) >= 1);
  await page.getByRole("button", { name: "共有" }).first().click();
  ok("旅程: 共有メニュー(LINE・X・リンク)", (await page.getByText("LINE", { exact: true }).count()) >= 1);
  ok("旅程: マイ旅への案内", await page.getByText("に保存されます").count());

  // 7. 宿:予約は外部サイトだけ・自社の決済入力なし
  let external = true;
  let forms = 0;
  let pr = 0;
  for (const p of [...new Set([...places, "/places/midori", "/places/kitanoshizuku"])]) {
    await page.goto(B + p, { waitUntil: "networkidle" });
    forms += await page.locator("form, input[type=tel], input[autocomplete^=cc]").count();
    for (const a of await page.$$eval('a[href^="http"]', (as) => as.map((x) => ({ href: x.href, t: x.target, txt: x.textContent })))) {
      if (/空室|予約/.test(a.txt) && a.t !== "_blank") external = false;
    }
    pr += await page.locator('[title="掲載料を受け取っています"]').count();
  }
  ok("予約: 予約ボタンはすべて外部サイト(別タブ)", external);
  ok("予約: 自社の申込・決済フォームがない", forms === 0, `forms ${forms}`);
  ok("PR: 掲載料を受ける場所に PR 表示", pr >= 2, `PR ${pr}件`);

  // 8. 毎日クイズ
  await page.goto(B + "/", { waitUntil: "networkidle" });
  const quiz = page.locator("section", { has: page.getByText("今日の1問") }).last();
  await quiz.locator("button").first().click();
  await page.waitForTimeout(300);
  ok("毎日クイズ: 答えると結果が出る", (await quiz.locator('[role="status"]').count()) >= 1);

  // 9. 旅マップ
  await page.goto(B + "/map", { waitUntil: "networkidle" });
  ok("旅マップ: 地球儀が出る", (await page.locator("canvas, svg").count()) >= 1);

  // 10. 診断(20問)
  await page.goto(B + "/type", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "診断をはじめる" }).click();
  const pattern = [3, -2, 2, 3, 0, 1, -2, -3, 2, -3, 1, 2, 0, 2, -1, -2, -1, -1, -2, -3];
  let n = 0;
  while (!/\/type\/[A-Z]{4}$/.test(page.url()) && n < 40) {
    if (!(await page.locator("h2[data-q]").count())) {
      await page.waitForTimeout(150);
      continue;
    }
    await page.locator(`button[data-v="${n < 20 ? pattern[n] : 1}"]`).click();
    n++;
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(400);
  ok("診断: 最後まで答えると結果ページへ", /\/type\/[A-Z]{4}$/.test(page.url()), `${n}問 → ${page.url().replace(B, "")}`);
  ok("診断: エンタメ診断の注記", (await page.getByText("性格検査や医学的な診断ではありません").count()) >= 1);
  ok("診断: 守護重神は準備中・NFT表記なし", (await page.getByText("守護重神(準備中)").count()) >= 1 && !(await page.textContent("body")).includes("NFT"));

  ok("ページのエラーなし", !errs.length, errs.slice(0, 3).join(" / "));
  await browser.close();
  const fail = results.filter((r) => !r.pass);
  for (const r of results) console.log(`${r.pass ? "OK " : "NG "} ${r.name}${r.info && !r.pass ? "  ← " + r.info : ""}`);
  console.log(`\n${results.length - fail.length}/${results.length} OK`);
  process.exit(fail.length ? 1 : 0);
})();
