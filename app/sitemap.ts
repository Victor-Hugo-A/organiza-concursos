import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://organizaseusestudos.example";
  return ["", "/entrar", "/criar-conta"].map((route) => ({ url: baseUrl + route, lastModified: new Date() }));
}
