// 見た目の確認用の撮影(同じ画面・同じテストデータで Before/After を撮る)。
// 実行: npx next start -p 3100 のあと  BASE=http://localhost:3100 OUT=出力先 node tests/e2e/visual.cjs
// 幅 390(スマホ)・1440(PC)・320(小さいスマホ)と、文字を1.5倍にした 390 で撮る。
// あわせて、横はみ出し・12px未満の文字・44px未満のボタン・下のメニューに隠れる要素を数える。
const { chromium } = require("playwright");
const fs = require("fs");
const B = process.env.BASE || "http://localhost:3100";
const OUT = process.env.OUT || ".";
const PLAN = process.env.PLAN; // 相談リンクの #p= の中身(テストデータ)

const SEED = {
  "tabioshi.savedTrips": JSON.stringify(["beppu"]),
  "tabioshi.myPlaces": JSON.stringify({ saved: { "otaru-canal": "2026-10-10T00:00:00.000Z", akari: "2026-10-11T00:00:00.000Z" }, visited: { "otaru-canal": "2026-10-12T00:00:00.000Z" } }),
  "tabioshi.plans": JSON.stringify({ me: "ゆう", plans: {} }),
  "tabioshi.welcome": JSON.stringify({ closed: true }),
};

const SCREENS = [
  { name: "1-shorts", path: "/shorts" },
  { name: "2-place", path: "/places/otaru-canal" },
  { name: "3-stay", path: "/places/akari" },
  { name: "4-me", path: "/me" },
  { name: "5-pick", path: "/pick#p=" + PLAN },
  { name: "6-pick-new", path: "/pick" },
];
const VIEWS = [
  { name: "390", width: 390, height: 844 },
  { name: "1440", width: 1440, height: 900 },
  { name: "320", width: 320, height: 640 },
  { name: "390-text150", width: 390, height: 844, text: 1.5 },
];

async function audit(page) {
  return page.evaluate(() => {
    const small = [];
    const tiny = [];
    for (const el of document.querySelectorAll("button, a[href], input, [aria-pressed]")) {
      const r = el.getBoundingClientRect();
      if (r.width && r.height && r.height < 44 && !el.closest("nav[aria-label='メイン']") && getComputedStyle(el).display !== "inline")
        tiny.push(`${el.tagName} ${Math.round(r.height)}px ${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 14)}`);
    }
    for (const el of document.querySelectorAll("main *")) {
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (own && el.getBoundingClientRect().width && parseFloat(getComputedStyle(el).fontSize) < 12) small.push(el.textContent.trim().slice(0, 14));
    }
    // 横にはみ出している要素
    const over = [];
    for (const el of document.querySelectorAll("main *")) {
      const r = el.getBoundingClientRect();
      if (r.width && r.right > innerWidth + 1 && !el.closest(".hscroll") && getComputedStyle(el).position !== "fixed") over.push(el.tagName + "." + String(el.className).slice(0, 30));
    }
    // ページの最後の要素が、下に固定したメニューに隠れないか(いちばん下までスクロールして確かめる)
    window.scrollTo(0, document.documentElement.scrollHeight);
    const nav = [...document.querySelectorAll("nav, div")].find((n) => getComputedStyle(n).position === "fixed" && n.getBoundingClientRect().bottom >= innerHeight - 1);
    const mainEls = [...document.querySelectorAll("main *")].filter((e) => e.getBoundingClientRect().height > 0);
    const last = mainEls.reduce((a, e) => (e.getBoundingClientRect().bottom > (a?.getBoundingClientRect().bottom ?? 0) ? e : a), null);
    // 画面の中でスクロールする作り(ショート)は、その枠の下端がメニューの上端より上にあるかで見る
    const main = document.querySelector("main");
    const fixedMain = main && getComputedStyle(main).position === "fixed";
    const hidden = nav && (fixedMain ? main.getBoundingClientRect().bottom > nav.getBoundingClientRect().top + 1 : last && last.getBoundingClientRect().bottom > nav.getBoundingClientRect().top + 1);
    window.scrollTo(0, 0);
    return { tiny: tiny.length, tinyList: tiny.slice(0, 6), small: small.length, over: over.length, overList: over.slice(0, 4), hiddenByNav: !!hidden, wide: document.documentElement.scrollWidth > innerWidth + 1 };
  });
}

(async () => {
  const browser = await chromium.launch();
  const report = {};
  for (const v of VIEWS) {
    const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.width >= 1440 ? 1 : 2, reducedMotion: "reduce" });
    await ctx.addInitScript((seed) => {
      if (!sessionStorage.getItem("seeded")) {
        for (const [k, val] of Object.entries(seed)) localStorage.setItem(k, val);
        sessionStorage.setItem("seeded", "1");
      }
    }, SEED);
    if (v.text) await ctx.addInitScript((t) => document.addEventListener("DOMContentLoaded", () => (document.documentElement.style.fontSize = `${16 * t}px`)), v.text);
    const page = await ctx.newPage();
    for (const s of SCREENS) {
      await page.goto(B + s.path, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      const a = await audit(page);
      report[`${s.name}@${v.name}`] = a;
      // 最初に見える1画面(下のメニュー込み)と、ページ全体(下のメニューは途中に写り込むので隠す)
      await page.screenshot({ path: `${OUT}/${s.name}@${v.name}-first.png` });
      await page.addStyleTag({ content: "nav[aria-label='メイン']{visibility:hidden!important}" });
      await page.screenshot({ path: `${OUT}/${s.name}@${v.name}-full.png`, fullPage: true });
    }
    await ctx.close();
  }
  fs.writeFileSync(`${OUT}/audit.json`, JSON.stringify(report, null, 1));
  for (const [k, a] of Object.entries(report))
    console.log(`${k.padEnd(22)} はみ出し:${a.wide ? "あり" : "なし"} 要素${a.over} / 12px未満:${a.small} / 44px未満:${a.tiny} / 下のメニューに隠れる:${a.hiddenByNav ? "あり" : "なし"}`);
  await browser.close();
})();
