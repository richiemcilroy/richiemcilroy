import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { absoluteUrl, homeUpdated, wikiUpdated } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();

  const postUrls = posts.map((post) => ({
    url: absoluteUrl(`/posts/${post.slug}`),
    lastModified: post.updated || post.date || undefined,
  }));

  return [
    {
      url: absoluteUrl("/"),
      lastModified: [
        homeUpdated,
        ...posts.map((post) => post.updated || post.date),
      ]
        .filter(Boolean)
        .sort()
        .at(-1),
    },
    {
      url: absoluteUrl("/wiki"),
      lastModified: wikiUpdated,
    },
    ...postUrls,
  ];
}
