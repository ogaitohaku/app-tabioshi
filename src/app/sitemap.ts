import type { MetadataRoute } from "next";
import { allAreas, allCreators, allPlaces, allVideos } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/shorts",
    "/map",
    "/about",
    "/terms",
    "/privacy",
    ...allAreas().map((a) => `/areas/${a.id}`),
    ...allVideos().map((v) => `/trips/${v.id}`),
    ...allPlaces().map((p) => `/places/${p.id}`),
    ...allCreators().map((c) => `/creators/${c.id}`),
  ];
  return paths.map((p) => ({ url: `${SITE_URL}${p}` }));
}
