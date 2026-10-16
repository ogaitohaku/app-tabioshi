// 「行き先をいっしょに決める」の通し確認(スマホ幅 390px)。
// 相談する人(ゆう)が候補を送り、みさき・けんが別々に選んで送り返し、ゆうの端末で全員分がそろうまでを見る。
// あわせて、呼び名と票がサーバー・アクセス解析・外部リンク・Referer に出ないこと、
// 再読み込み・古いリンク・転送・選び直し・別の端末で数を誤らないこと、共有の失敗から戻れることを確かめる。
// 実行: npx next start -p 3100 のあと  BASE=http://localhost:3100 node tests/e2e/pick.cjs
const { chromium } = require("playwright");
const LEGACY = require("../unit/fixtures/legacy-2026-10-16.json"); // 前の版(842d272)で作った実物のリンクと保存データ
const B = process.env.BASE || "http://localhost:3100";
const results = [];
const ok = (name, pass, info = "") => results.push({ name, pass: !!pass, info });

const OLD = {
  "tabioshi.savedTrips": JSON.stringify(["beppu"]),
  "tabioshi.prefs": JSON.stringify({ themes: ["onsen"], budget: 20000, done: true }),
  "tabioshi.type": JSON.stringify({ code: "DIMQ", result: null, at: "2026-10-01T00:00:00.000Z", history: [], fit: {} }),
  "tabioshi.myPlaces": JSON.stringify({ saved: { "otaru-canal": "2026-10-10T00:00:00.000Z" }, visited: {} }),
};
const NAMES = ["ゆう", "みさき", "けん"];
const SECRET = (s) => /#p=/.test(s) || NAMES.some((n) => s.includes(n) || s.includes(encodeURIComponent(n)));

// 本物の解析スクリプト(/_vercel/insights/script.js)はこの環境から取れないので、同じ受け渡し(window.va / vaq)で動く代わりを置く。
// 登録された beforeSend を通した結果を、本物と同じ宛先へ送る。送られた中身を後で調べる。
const FAKE_INSIGHTS = `(function(){
  var bs=null, q=window.vaq||[];
  function send(a){
    var kind=a[0]==='event'?'event':'view';
    var ev={type:a[0]==='event'?'event':'pageview', url:location.href};
    if(a[0]==='event'&&a[1]){ev.name=a[1].name; ev.data=a[1].data;}
    var out=bs?bs(ev):ev; if(out) navigator.sendBeacon('/_vercel/insights/'+kind, JSON.stringify(out));
  }
  function run(a){ if(a[0]==='beforeSend') bs=a[1]; else if(a[0]==='pageview'||a[0]==='event') send(a); }
  q.filter(function(a){return a[0]==='beforeSend'}).forEach(run);
  q.filter(function(a){return a[0]!=='beforeSend'}).forEach(run);
  window.va=function(){ run([].slice.call(arguments)); };
})();`;

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

const net = { requests: [], insights: [], external: [] };

async function person(browser, seed) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: B });
  await ctx.route("**/_vercel/insights/script.js", (r) => r.fulfill({ contentType: "text/javascript", body: FAKE_INSIGHTS }));
  await ctx.route("**/_vercel/insights/*", (r) => {
    if (r.request().method() === "POST") {
      net.insights.push(r.request().postData() || "");
      return r.fulfill({ status: 200, body: "" });
    }
    return r.fallback();
  });
  await ctx.route("https://social-plugins.line.me/**", (r) => {
    net.external.push({ url: r.request().url(), referer: r.request().headers()["referer"] || "" });
    return r.fulfill({ status: 200, contentType: "text/html", body: "<p>LINE</p>" });
  });
  ctx.on("request", (r) => {
    const h = r.headers();
    net.requests.push({ url: r.url(), body: r.postData() || "", referer: h["referer"] || "" });
  });
  // 端末の共有メニュー(テストでは押したときの結果を切り替える)
  await ctx.addInitScript(() => {
    navigator.share = (data) => {
      const mode = window.__shareMode || "ok";
      if (mode === "ok") {
        window.__shared = data;
        return Promise.resolve();
      }
      const e = new Error(mode);
      e.name = mode;
      return Promise.reject(e);
    };
  });
  if (seed)
    await ctx.addInitScript((old) => {
      if (!sessionStorage.getItem("seeded")) {
        for (const [k, v] of Object.entries(old)) localStorage.setItem(k, v);
        sessionStorage.setItem("seeded", "1");
      }
    }, seed);
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  return { ctx, page, errs };
}

const copyLink = async (page) => {
  await page.getByRole("button", { name: "リンクをコピー" }).click();
  return page.evaluate(() => navigator.clipboard.readText());
};
const count = (page, item) => page.locator(`[data-plan-item="${item}"]`).getAttribute("data-count");
const nameBox = (page) => page.getByRole("textbox", { name: /あなたの呼び名/ });
const vote = async (page, name, items) => {
  await nameBox(page).fill(name);
  for (const it of items) await page.locator(`[data-plan-item="${it}"]`).getByRole("button", { name: "行きたい" }).click();
  await page.getByRole("button", { name: "選んだ内容をリンクに入れる" }).click();
  await page.getByRole("button", { name: "リンクに入っています" }).waitFor();
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
  ok("マイ旅に保存した旅・場所が上に出る", (await p.getByText("マイ旅に保存したもの").count()) && (await p.locator('[data-candidate="p:otaru-canal"]').count()));
  ok("候補1つではリンクを作れない", await p.getByRole("button", { name: "候補のリンクを作る" }).isDisabled());
  await p.locator('[data-candidate="t:beppu"]').click();
  ok("呼び名がないとリンクを作れない", await p.getByRole("button", { name: "候補のリンクを作る" }).isDisabled());
  for (const k of ["p:otaru-canal", "t:onomichi", "t:tadami"]) await p.locator(`[data-candidate="${k}"]`).click();
  ok("候補は数が見える", (await p.getByRole("status").first().innerText()).includes("5 / 6つ"));
  for (const k of ["p:otaru-canal", "t:onomichi", "t:tadami"]) await p.locator(`[data-candidate="${k}"]`).click();
  await p.getByRole("textbox", { name: /相談の名前/ }).fill("冬の連休");
  await nameBox(p).fill("ゆう");
  let s = await sizes(p);
  ok("作る画面: ボタン44px以上・文字12px以上・横はみ出しなし", !s.bad.length && !s.wide, s.bad.join(" / "));
  await p.getByRole("button", { name: "候補のリンクを作る" }).click();
  await p.getByRole("heading", { name: "冬の連休" }).waitFor();
  ok("作ると相談の画面になる", await p.getByText("あなたが作った相談").count());
  ok("作った人に「集計はこの端末の中だけ・同期しない」と出す", /この端末の中だけの集計.*ほかの端末とは同期しません/s.test(await p.locator("[data-sync-note]").innerText()));
  ok("作った直後に「このリンクで変わったこと」を出さない", !(await p.locator("[data-sync-note] [role=status]").count()));
  const first = await copyLink(p);
  ok("送るリンクは /pick?ref=share#p=…", /\/pick\?ref=share#p=[A-Za-z0-9_-]+$/.test(first), first);

  // 2. 共有の取り消し・失敗から戻れる
  await p.evaluate(() => (window.__shareMode = "AbortError"));
  await p.getByRole("button", { name: "ほかのアプリで送る" }).click();
  await p.waitForTimeout(200);
  ok("共有メニューを閉じただけなら、何も出さず続けられる", !(await p.locator("[data-plan-url]").count()) && !(await p.getByText("うまく送れませんでした").count()));
  await p.evaluate(() => (window.__shareMode = "NotAllowedError"));
  await p.getByRole("button", { name: "ほかのアプリで送る" }).click();
  await p.locator("[data-plan-url]").waitFor();
  ok("共有に失敗したら、リンクをそのまま見せてコピーできる", (await p.locator("[data-plan-url]").inputValue()) === first);
  await p.evaluate(() => (window.__shareMode = "ok"));
  await p.getByRole("button", { name: "ほかのアプリで送る" }).click();
  ok("端末の共有では相談のリンクを渡す", (await p.evaluate(() => window.__shared.url)) === first);

  // 3. LINEで送る: リンクは LINE に渡る(これは送る操作そのもの)。どこから来たか(Referer)は送らない
  const [popup] = await Promise.all([p.waitForEvent("popup"), p.getByRole("link", { name: /LINEで送る/ }).click()]);
  await popup.waitForLoadState().catch(() => {});
  await popup.close();
  const line = net.external[0];
  ok("LINEへは、送ると決めたリンクだけが渡る", line && decodeURIComponent(line.url).includes(first), line && line.url.slice(0, 80));
  ok("LINEへの移動に Referer を付けない", line && line.referer === "", line && line.referer);

  // 4. みさき: 登録なしで開いて選ぶ
  let m = misaki.page;
  await m.goto(first, { waitUntil: "networkidle" });
  ok("受け取った人: だれからの相談か出る", await m.getByText("ゆうさんからの相談").count());
  ok("受け取った人: 候補2つ・まだ回答なし", (await m.getByText("候補2つ ・ まだだれも回答していません").count()) === 1);
  ok("受け取った人: 候補に費用の目安と投稿者", /1人 ¥[\d,]+〜/.test(await m.locator('[data-plan-item="t:otaru"]').innerText()));
  ok(
    "受け取った人に「このリンクに入っている分だけ・全員分はゆうさんの端末で」と出す",
    /このリンクに入っている回答だけ.*ゆうさん.*端末でそろいます/s.test(await m.locator("[data-sync-note]").innerText()),
  );
  ok("呼び名を入れるまで「行きたい」は押せない", await m.locator('[data-plan-item="t:otaru"] button').isDisabled());
  await nameBox(m).fill("みさき");
  await m.locator('[data-plan-item="t:otaru"]').getByRole("button", { name: "行きたい" }).click();
  ok("押しただけでは送らない(入れるよう案内)", await m.getByText("先に「選んだ内容をリンクに入れる」を押してください。").count());
  await m.getByRole("button", { name: "選んだ内容をリンクに入れる" }).click();
  await m.getByText("1人が回答(みさき)").waitFor();
  ok("みさきの票が集計に出る", (await count(m, "t:otaru")) === "1");
  ok("送り返す相手の名前", await m.getByRole("heading", { name: "ゆうさんに送り返す" }).count());
  s = await sizes(m);
  ok("相談の画面: ボタン44px以上・文字12px以上・横はみ出しなし", !s.bad.length && !s.wide, s.bad.join(" / "));
  const fromMisakiOld = await copyLink(m);
  // みさきが選び直す(小樽 → 別府)
  await m.locator('[data-plan-item="t:otaru"]').getByRole("button", { name: "行きたい" }).click();
  await m.locator('[data-plan-item="t:beppu"]').getByRole("button", { name: "行きたい" }).click();
  await m.getByRole("button", { name: "選んだ内容をリンクに入れる" }).click();
  await m.getByRole("button", { name: "リンクに入っています" }).waitFor();
  ok("同じ人が選び直しても1人のまま", (await m.getByText("1人が回答(みさき)").count()) === 1 && (await count(m, "t:otaru")) === "0");
  const fromMisakiNew = await copyLink(m);

  // 5. けん: みさきの古いリンクを転送されて、そこに回答する
  let k = ken.page;
  await k.goto(fromMisakiOld, { waitUntil: "networkidle" });
  await vote(k, "けん", ["t:otaru"]);
  const fromKen = await copyLink(k);

  // 6. ゆう: 新しい → 転送された古いもの、の順で開いても、みさきの選び直しが残る
  await p.goto(fromMisakiNew, { waitUntil: "networkidle" });
  ok("ゆう: 開いたリンクで加わった人を出す", (await p.locator("[data-sync-note]").innerText()).includes("このリンクで加わった回答:みさき"));
  await p.goto(fromKen, { waitUntil: "networkidle" });
  await p.getByText("2人が回答").waitFor({ timeout: 5000 }).catch(() => {});
  let note = await p.locator("[data-sync-note]").innerText();
  ok("ゆう: 転送された古い回答は使わず、そう伝える", note.includes("手元の新しい回答のままにしました:みさき") && note.includes("このリンクで加わった回答:けん"), note);
  ok("ゆう: みさきは別府(選び直し後)、けんは小樽 → どちらも1票", (await count(p, "t:beppu")) === "1" && (await count(p, "t:otaru")) === "1");
  // 再読み込みしても数は変わらない
  await p.reload({ waitUntil: "networkidle" });
  note = await p.locator("[data-sync-note]").innerText();
  ok(
    "再読み込み: だれも「加わった」ことにならず、数は変わらない",
    !note.includes("加わった") && !note.includes("選び直しを反映") && (await count(p, "t:beppu")) === "1" && (await count(p, "t:otaru")) === "1",
    note,
  );
  // 古い方のみさきのリンクを、後からもう一度開いても
  await p.goto(fromMisakiOld, { waitUntil: "networkidle" });
  ok("古いリンクを後から開いても、みさきの票は小樽に戻らない", (await count(p, "t:otaru")) === "1" && (await count(p, "t:beppu")) === "1");
  ok("同点のあいだは「いちばん多い候補」を出さない", !(await p.locator("[data-plan-top]").count()));

  // 7. ゆうも回答 → 別府が2票 → 「ここに決める」(票とは別に、決定として記録)
  await vote(p, "ゆう", ["t:beppu"]);
  ok("ゆう: 別府が2票でいちばん上", (await p.locator("[data-plan-item]").first().getAttribute("data-plan-item")) === "t:beppu" && (await count(p, "t:beppu")) === "2");
  ok("いちばん多い候補は「まだ決定ではありません」", (await p.locator('[data-plan-top="t:beppu"]').innerText()).includes("まだ決定ではありません"));
  await p.getByRole("button", { name: "ここに決める" }).click();
  await p.locator('[data-plan-decided="t:beppu"]').waitFor();
  const decidedText = await p.locator('[data-plan-decided="t:beppu"]').innerText();
  ok("決めると「決めた行き先」と「まだ予約はされていません」", decidedText.includes("ゆうさんが決めた行き先") && decidedText.includes("まだ予約はされていません"));
  ok("決めても票は増えない", (await count(p, "t:beppu")) === "2");
  ok("決定から旅程・宿へ進める", (await p.locator('[data-plan-decided] a[href="/trips/beppu"]').count()) === 1);
  const decidedLink = await copyLink(p);
  await m.goto(decidedLink, { waitUntil: "networkidle" });
  ok("同行者にも決定が届く(リンクを送ったとき)", await m.locator('[data-plan-decided="t:beppu"]').count());
  ok("同行者には「決定を取り消す」を出さない", !(await m.getByRole("button", { name: "決定を取り消す" }).count()));
  await p.getByRole("button", { name: "決定を取り消す" }).click();
  await p.locator("[data-plan-top]").waitFor();
  await p.goto(decidedLink, { waitUntil: "networkidle" });
  ok("取り消した後に古い決定のリンクを開いても、決定に戻らない", !(await p.locator("[data-plan-decided]").count()));

  // 8. 送り主が別の端末で開くと、その端末で開いたリンクの分だけ(そう表示する)
  const yu2 = await person(browser);
  await yu2.page.goto(fromKen, { waitUntil: "networkidle" });
  await nameBox(yu2.page).fill("ゆう");
  ok("別の端末: そのリンクの分だけ(みさき・けん)を数える", (await yu2.page.getByText("2人が回答").count()) === 1 && (await count(yu2.page, "t:otaru")) === "2");
  ok("別の端末: 作った人として「ほかの端末とは同期しません」と出す", (await yu2.page.locator("[data-sync-note]").innerText()).includes("ほかの端末とは同期しません"));
  await yu2.ctx.close();

  // 9. これまでの相談・壊れたリンク(知らない候補を落とすのは単体テストで確認)
  await p.goto(B + "/pick", { waitUntil: "networkidle" });
  ok("これまでの相談に残る(3人が回答)", /冬の連休\s*3人が回答 ・ 候補2つ/.test(await p.locator("main").innerText()));
  await m.goto(B + "/pick#p=" + first.split("#p=")[1].slice(0, 40), { waitUntil: "networkidle" });
  ok("途中で切れたリンクは案内を出す", await m.getByText("この相談のリンクを読み込めませんでした").count());
  await m.getByRole("link", { name: "これまでの相談・新しく作る" }).click();
  await m.waitForURL(B + "/pick");
  ok("案内から「これまでの相談」に戻れる", /冬の連休/.test(await m.locator("main").innerText()));

  // 10. 漏れの確認
  const leaked = net.requests.filter((r) => SECRET(r.url) || SECRET(r.body));
  ok("呼び名と票がタビオシのサーバーへのリクエストに入っていない", !leaked.filter((r) => r.url.startsWith(B)).length, leaked.map((r) => r.url).slice(0, 3).join(" | "));
  const refLeak = net.requests.filter((r) => SECRET(r.referer));
  ok("どのリクエストの Referer にも呼び名と票が入っていない", !refLeak.length, refLeak.map((r) => r.referer).slice(0, 2).join(" | "));
  ok("アクセス解析が動いている(代わりのスクリプトで確認)", net.insights.length >= 5, `${net.insights.length}件`);
  const anaLeak = net.insights.filter((b) => b.includes("#") || SECRET(b));
  ok("アクセス解析に送るURLに # の後ろ・呼び名・票が入っていない", !anaLeak.length, anaLeak.slice(0, 2).join(" | "));
  const events = net.insights.map((b) => JSON.parse(b)).filter((e) => e.type === "event");
  const names = new Set(events.map((e) => e.name));
  ok("解析では「送った」「回答した」「決めた」を別の出来事として数える", ["plan_send", "plan_vote", "plan_decide"].every((n) => names.has(n)), [...names].join(","));
  const otherHosts = net.requests.filter((r) => !r.url.startsWith(B) && !r.url.startsWith("data:") && !r.url.startsWith("https://social-plugins.line.me/"));
  ok("LINE(送るとき)以外の外部へは何も送っていない", !otherHosts.length, otherHosts.map((r) => r.url).slice(0, 3).join(" | "));

  // 11. これまでのキーは書き換えない・新しいキーに保存
  const after = await p.evaluate((keys) => Object.fromEntries(keys.map((x) => [x, localStorage.getItem(x)])), Object.keys(OLD));
  ok("これまでのキー(旅・好み・診断・行きたい)は書き換わっていない", Object.keys(OLD).every((x) => after[x] === OLD[x]), JSON.stringify(after));
  const plans = await p.evaluate(() => JSON.parse(localStorage.getItem("tabioshi.plans")));
  ok("新しいキー tabioshi.plans に相談と呼び名", plans.me === "ゆう" && Object.keys(plans.plans).length === 1);

  // 12. 前の版(時刻のない回答)で保存した端末と、前の版で配ったリンク
  const old = await person(browser, { "tabioshi.plans": JSON.stringify(LEGACY.store) });
  const o = old.page;
  await o.goto(B + "/pick", { waitUntil: "networkidle" });
  let main = await o.locator("main").innerText();
  ok("旧保存: これまでの相談に2件が出る(冬の連休は2人が回答)", /冬の連休\s*2人が回答 ・ 候補2つ/.test(main) && main.includes("次の旅、どこにする?"), main.slice(0, 200));
  await o.goto(B + "/pick#p=" + LEGACY.links.fromKen, { waitUntil: "networkidle" });
  ok("旧リンク: 開ける・保存していた2人分が残る", (await o.getByText("2人が回答").count()) === 1 && (await count(o, "t:otaru")) === "2" && (await count(o, "t:beppu")) === "1");
  ok("旧リンク: 「時刻のない前の版の回答」として扱うと表示", (await o.locator("[data-legacy-note]").innerText()).includes("けん、みさき"));
  ok("旧リンク: すでに入っている回答を「加わった」と言わない", !(await o.locator("[data-sync-note]").innerText()).includes("加わった"));
  // 新しい版で回答 → 合流
  await vote(o, "ゆう", ["t:otaru"]);
  ok("旧データ + 新しい回答: 3人で合流", (await o.getByText(/3人が回答/).count()) === 1 && (await count(o, "t:otaru")) === "3" && (await count(o, "t:beppu")) === "1");
  const reshared = await copyLink(o);
  ok("再共有: 新しい形のリンクに3人分が入る", JSON.parse(Buffer.from(reshared.split("#p=")[1], "base64url").toString()).votes["けん"].t === 0);
  await o.reload({ waitUntil: "networkidle" });
  ok("再読み込み: 3人のまま", (await o.getByText(/3人が回答/).count()) === 1 && (await count(o, "t:otaru")) === "3");
  await o.goto(B + "/pick#p=" + LEGACY.links.fromMisaki, { waitUntil: "networkidle" });
  ok("旧リンクを後から開いても3人のまま・数も同じ", (await o.getByText(/3人が回答/).count()) === 1 && (await count(o, "t:otaru")) === "3");
  await o.getByRole("button", { name: "ここに決める" }).click();
  await o.locator("[data-plan-decided]").waitFor();
  await o.goto(B + "/pick", { waitUntil: "networkidle" });
  main = await o.locator("main").innerText();
  ok("これまでの相談: 冬の連休は1件だけ(二重にならない)", (main.match(/冬の連休/g) || []).length === 1 && /冬の連休\s*3人が回答/.test(main), main.slice(0, 200));
  const stored = await o.evaluate(() => JSON.parse(localStorage.getItem("tabioshi.plans")));
  ok("保存は新しいキーの形に付け直され、前の版のキーは残らない", Object.keys(stored.plans).sort().join(",") === "k3v9q2m8x1:t:otaru,t:beppu,p7a1b2c3d4:t:tadami,p:otaru-canal", Object.keys(stored.plans).join(","));
  ok("前の版の回答は消えずに残る(けん)", JSON.stringify(stored.plans["k3v9q2m8x1:t:otaru,t:beppu"].plan.votes["けん"]) === JSON.stringify({ p: ["t:otaru", "t:beppu"], t: 0 }));
  // 保存のない端末で旧リンクを開く(受け取った人)
  const fresh = await person(browser);
  await fresh.page.goto(B + "/pick?ref=share#p=" + LEGACY.links.fromMisaki, { waitUntil: "networkidle" });
  ok("保存のない端末でも旧リンクを開ける", (await fresh.page.getByText("ゆうさんからの相談").count()) === 1 && (await count(fresh.page, "t:otaru")) === "1");
  await fresh.ctx.close();

  const errs = [yu, misaki, ken, old].flatMap((x) => x.errs);
  ok("ページのエラーなし", !errs.length, errs.join(" / "));
  await p.goto(decidedLink, { waitUntil: "networkidle" });
  await p.screenshot({ path: (process.env.OUT || ".") + "/pick-plan.png", fullPage: true });
  await browser.close();

  const fail = results.filter((r) => !r.pass);
  for (const r of results) console.log(`${r.pass ? "OK " : "NG "} ${r.name}${r.info && !r.pass ? "  ← " + r.info : ""}`);
  console.log(`\n${results.length - fail.length}/${results.length} OK`);
  process.exit(fail.length ? 1 : 0);
})();
