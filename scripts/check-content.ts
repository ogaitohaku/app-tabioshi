// 掲載前チェック。実行: npm run check:content
// サンプルデータのあいだは一覧を出すだけ。本物のデータ(IS_SAMPLE = false)では、足りないものがあれば失敗にする。
import { creators, IS_SAMPLE, places, videos } from "../src/data/sample.ts";
import { checkContent } from "../src/lib/content-check.ts";

const found = checkContent({ creators, videos, places }, new Date());
const errors = found.filter((f) => f.level === "error");
for (const f of found) console.log(`${f.level === "error" ? "要対応" : "確認"}  ${f.where}: ${f.what}`);
console.log(
  `\n要対応 ${errors.length}件・確認 ${found.length - errors.length}件(投稿者${creators.length}人・動画${videos.length}本・場所${places.length}か所)`,
);
if (IS_SAMPLE) console.log("いまはサンプルデータなので失敗にはしません。本物のデータに差し替えたら、要対応が0件になるまで公開しないでください。");
process.exit(!IS_SAMPLE && errors.length ? 1 : 0);
