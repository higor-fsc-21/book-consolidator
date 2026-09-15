import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:8443";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/login"],
      disallow: ["/biblioteca", "/livros/", "/sessoes/", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
