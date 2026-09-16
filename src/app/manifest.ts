import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Memora",
    short_name: "Memora",
    description:
      "Transforme a leitura em conhecimento retido, explicável e aplicável.",
    start_url: "/painel",
    scope: "/",
    display: "standalone",
    background_color: "#fbf9f8",
    theme_color: "#172f3b",
    lang: "pt-BR",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
