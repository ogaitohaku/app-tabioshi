// 「行き先をいっしょに決める」の通し確認(スマホ幅 390px)。
// 相談する人(ゆう)が候補を送り、みさき・けんが別々に選んで送り返し、ゆうの端末で全員分がそろうまでを見る。
// 実行: npx next start -p 3100 のあと  BASE=http://localhost:3100 node tests/e2e/pick.cjs
const { chromium } = require("playwright");
const B = process.env.BASE || "http://localhost:3100";
const results = [];
const ok = (name, pass, info = "") => results.push({ name, pass: !!pass, info });

const OLD = {
  "tabioshi.savedTrips": JSON.stringify(["beppu"]),
  "tabioshi.prefs": JSON.stringify({ themes: ["onsen"], budget: 20000, done: true }),
  "tabioshi.type": JSON.stringify({ code: "DIMQ", result: null, at: "2026-10-01T00:00:00.000Z", history: [], fit: {} }),
  "tabioshi.myPlaces": JSON.stringify({ saved: { "otaru-canal": "2026-10-10T00:00:00.000Z" }, visited: {} }),
};

async function sizes(page) {
  return page.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll("button, input, [aria-pressed], a.inline-flex, a.rounded-full, main ul a")) {
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

async function person(browser, seed) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: B });
  if (seed)
    await ctx.addInitScript((old) => {
      if (!sessionStorage.getItem("seeded")) {
        for (const [k, v] of Object.entries(old)) localStorage.setItem(k, v);
        sessionStorage.setItem("seeded", "1");
      }
    }, seed);
  const page = await ctx.newPage();
  const errs = [];
  const sentUrls = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("request", (r) => sentUrls.push(r.url() + " " + (r.postData() || "")));
  return { ctx, page, errs, sentUrls };
}

const copyLink = async (page) => {
  await page.getByRole("button", { name: "リンクをコピー" }).click();
  return page.evaluate(() => navigator.clipboard.readText());
};

(async () => {
  const browser = await chromium.launch();
  const yu = await person(browser, OLD);
  const misaki = await person(browser);
  const ken = await person(browser);

  // 1. 旅程から「この旅を候補にする」→ 候補が選ばれた状態で始まる
  let p = yu.page;
  await p.goto(B + "/me", { waitUntil: "networkidle" });
  ok("マイ旅: 「同行者と行き先を決める」の入口", await p.locator('a[href="/pick"]').count());
  await p.goto(B + "/trips/otaru", { waitUntil: "networkidle" });
  await p.getByRole("link", { name: "同行者と決める:この旅を候補にする" }).click();
  await p.waitForURL(/\/pick\?add=t:otaru/);
  await p.locator('[data-candidate="t:otaru"]').waitFor();
  ok("旅程から来ると、その旅が候補に入っている", (await p.locator('[data-candidate="t:otaru"]').getAttribute("aria-pressed")) === "true");
  ok(
    "マイ旅に保存した旅・場所が上に出る",
    (await p.getByText("マイ旅に保存したもの").count()) && (await p.locator('[data-candidate="p:otaru-canal"]').count()),
  );
  ok("候補1つではリンクを作れない", await p.getByRole("button", { name: "候補のリンクを作る" }).isDisabled());
  await p.locator('[data-candidate="t:beppu"]').click();
  ok("呼び名がないとリンクを作れない", await p.getByRole("button", { name: "候補のリンクを作る" }).isDisabled());
  // 6つまで
  for (const k of ["p:otaru-canal", "t:onomichi", "t:tadami"]) await p.locator(`[data-candidate="${k}"]`).click();
  ok("候補は数が見える", (await p.getByRole("status").first().innerText()).includes("5 / 6つ"));
  for (const k of ["p:otaru-canal", "t:onomichi", "t:tadami"]) await p.locator(`[data-candidate="${k}"]`).click();
  await p.getByRole("textbox", { name: /相談の名前/ }).fill("冬の連休");
  await p.getByRole("textbox", { name: /あなたの呼び名/ }).fill("ゆう");
  let s = await sizes(p);
  ok("作る画面: ボタン44px以上・文字12px以上・横はみ出しなし", !s.bad.length && !s.wide, s.bad.join(" / "));
  await p.getByRole("button", { name: "候補のリンクを作る" }).click();
  await p.getByRole("heading", { name: "冬の連休" }).waitFor();
  ok("作ると相談の画面になる", await p.getByText("あなたが作った相談").count());
  const first = await copyLink(p);
  ok("送るリンクは /pick?ref=share#p=…", /\/pick\?ref=share#p=[A-Za-z0-9_-]+$/.test(first), first);
  ok("リンクの長さ(LINEに貼れる長さ)", first.length < 1000, `${first.length}文字`);

  // 2. みさき: 登録なしで開いて選ぶ
  let m = misaki.page;
  await m.goto(first, { waitUntil: "networkidle" });
  ok("受け取った人: だれからの相談か出る", await m.getByText("ゆうさんからの相談").count());
  ok("受け取った人: 候補2つ・まだ回答なし", (await m.getByText("候補2つ ・ まだだれも回答していません").count()) === 1);
  ok("受け取った人: 候補に費用の目安と投稿者", /1人 ¥[\d,]+〜/.test(await m.locator('[data-plan-item="t:otaru"]').innerText()));
  ok("呼び名を入れるまで「行きたい」は押せない", await m.locator('[data-plan-item="t:otaru"] button').isDisabled());
  await m.getByRole("textbox", { name: /あなたの呼び名/ }).fill("みさき");
  await m.locator('[data-plan-item="t:otaru"]').getByRole("button", { name: "行きたい" }).click();
  ok("押しただけでは送らない(入れるよう案内)", await m.getByText("先に「選んだ内容をリンクに入れる」を押してください。").count());
  await m.getByRole("button", { name: "選んだ内容をリンクに入れる" }).click();
  await m.getByText("1人が回答(みさき)").waitFor();
  ok("みさきの票が集計に出る", (await m.locator('[data-plan-item="t:otaru"]').getAttribute("data-count")) === "1");
  ok("送り返す相手の名前", await m.getByRole("heading", { name: "ゆうさんに送り返す" }).count());
  s = await sizes(m);
  ok("相談の画面: ボタン44px以上・文字12px以上・横はみ出しなし", !s.bad.length && !s.wide, s.bad.join(" / "));
  const fromMisaki = await copyLink(m);

  // 3. けん: 同じ最初のリンクから、2つとも選ぶ
  let k = ken.page;
  await k.goto(first, { waitUntil: "networkidle" });
  await k.getByRole("textbox", { name: /あなたの呼び名/ }).fill("けん");
  await k.locator('[data-plan-item="t:otaru"]').getByRole("button", { name: "行きたい" }).click();
  await k.locator('[data-plan-item="t:beppu"]').getByRole("button", { name: "行きたい" }).click();
  await k.getByRole("button", { name: "選んだ内容をリンクに入れる" }).click();
  await k.getByText("1人が回答(けん)").waitFor();
  const fromKen = await copyLink(k);

  // 4. ゆう: 送り返された2本を順に開くと、全員分がそろう
  await p.goto(fromMisaki, { waitUntil: "networkidle" });
  await p.goto(fromKen, { waitUntil: "networkidle" });
  await p
    .getByText("2人が回答")
    .waitFor({ timeout: 5000 })
    .catch(() => {});
  const body = await p.locator("main").innerText();
  ok("ゆうの端末で2人分がそろう", /2人が回答\((けん、みさき|みさき、けん)\)/.test(body), body.slice(0, 120));
  ok(
    "小樽が2票でいちばん上",
    (await p.locator("[data-plan-item]").first().getAttribute("data-plan-item")) === "t:otaru" &&
      (await p.locator('[data-plan-item="t:otaru"]').getAttribute("data-count")) === "2",
  );
  ok("いちばん多い候補から旅程・宿へ進める", (await p.locator('[data-plan-top="t:otaru"] a').getAttribute("href")) === "/trips/otaru");
  ok("相談を作った人には「同行者に送る」", await p.getByRole("heading", { name: "同行者に送る" }).count());

  // 5. これまでの相談
  await p.goto(B + "/pick", { waitUntil: "networkidle" });
  ok("これまでの相談に残る", /冬の連休\s*2人が回答 ・ 候補2つ/.test(await p.locator("main").innerText()));

  // 6. 壊れたリンク
  await m.goto(B + "/pick#p=abc", { waitUntil: "networkidle" });
  ok("壊れたリンクは案内を出す", await m.getByText("この相談のリンクを読み込めませんでした").count());

  // 7. 名前と票はサーバーへ送っていない(# の後ろはリクエストに乗らない)
  const leaked = [yu, misaki, ken].flatMap((x) => x.sentUrls).filter((u) => /#p=|%E3%81%BF%E3%81%95%E3%81%8D|みさき|けん|ゆう/.test(u));
  ok("名前と票がサーバーへのリクエストに入っていない", !leaked.length, leaked.slice(0, 3).join(" | "));

  // 8. これまでのキーは書き換えない・新しいキーに保存
  const after = await p.evaluate((keys) => Object.fromEntries(keys.map((x) => [x, localStorage.getItem(x)])), Object.keys(OLD));
  ok(
    "これまでのキー(旅・好み・診断・行きたい)は書き換わっていない",
    Object.keys(OLD).every((x) => after[x] === OLD[x]),
    JSON.stringify(after),
  );
  const plans = await p.evaluate(() => JSON.parse(localStorage.getItem("tabioshi.plans")));
  ok("新しいキー tabioshi.plans に相談と呼び名", plans.me === "ゆう" && Object.keys(plans.plans).length === 1);

  const errs = [yu, misaki, ken].flatMap((x) => x.errs);
  ok("ページのエラーなし", !errs.length, errs.join(" / "));
  await m.goto(fromKen, { waitUntil: "networkidle" });
  await m.screenshot({ path: (process.env.OUT || ".") + "/pick-plan.png", fullPage: true });
  await browser.close();

  const fail = results.filter((r) => !r.pass);
  for (const r of results) console.log(`${r.pass ? "OK " : "NG "} ${r.name}${r.info && !r.pass ? "  ← " + r.info : ""}`);
  console.log(`\n${results.length - fail.length}/${results.length} OK`);
  process.exit(fail.length ? 1 : 0);
})();
