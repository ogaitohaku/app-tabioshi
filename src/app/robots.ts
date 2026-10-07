import type { MetadataRoute } from "next";
import { IS_SAMPLE } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

// サンプルデータの間は検索エンジンに載せない(架空の宿が検索結果に出ないように)
export default function robots(): MetadataRoute.Robots {
  if (IS_SAMPLE) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${SITE_URL}/sitemap.xml` };
}
