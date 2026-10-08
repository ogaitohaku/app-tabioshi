import type { MetadataRoute } from "next";
import { allAreas, allCreators, allPlaces, allTravelTypes, allVideos } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/shorts",
    "/map",
    "/welcome",
    "/about",
    "/type",
    ...allTravelTypes().map((t) => `/type/${t.code}`),
    "/terms",
    "/privacy",
    "/tokushoho",
    ...allAreas().map((a) => `/areas/${a.id}`),
    ...allVideos().map((v) => `/trips/${v.id}`),
    ...allPlaces().map((p) => `/places/${p.id}`),
    ...allCreators().map((c) => `/creators/${c.id}`),
  ];
  return paths.map((p) => ({ url: `${SITE_URL}${p}` }));
}
