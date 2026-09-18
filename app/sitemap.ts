import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://organizaseusestudos.example";
  return ["", "/entrar", "/criar-conta", "/recuperar-senha"].map((route) => ({ url: baseUrl + route, lastModified: new Date() }));
}
