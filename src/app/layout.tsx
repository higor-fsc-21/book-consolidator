import type { Metadata, Viewport } from "next";
import {
  Libre_Caslon_Text,
  Hanken_Grotesk,
  JetBrains_Mono,
} from "next/font/google";
import { PWARegistration } from "@/components/PWARegistration";
import "./globals.css";

const libreCaslonText = Libre_Caslon_Text({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Memora",
  description:
    "Transforme a leitura em conhecimento retido, explicável e aplicável através de sessões de consolidação espaçada.",
  applicationName: "Memora",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Memora",
    statusBarStyle: "default",
  },
  verification: {
    google: "kHxZsMUtcFQGzo1aLfCt-8uelBztF4CH7R8seuKxvFM",
  },
};

export const viewport: Viewport = {
  themeColor: "#172f3b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${libreCaslonText.variable} ${hankenGrotesk.variable} ${jetBrainsMono.variable}`}
    >
      <body>
        <PWARegistration />
        {children}
      </body>
    </html>
  );
}
