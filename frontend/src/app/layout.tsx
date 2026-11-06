import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";
import { getPlatformSettings } from "@/lib/api/client";
import { SITE_URL } from "@/lib/site-url";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

/** Títulos con la letra redondeada y gruesa del logo de khipu. */
const nunito = Nunito({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["800", "900"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPlatformSettings();
  // Sin imagen propia, una generada con el nombre del sitio (ver app/og/sitio).
  const ogImage = settings.ogImageUrl || "/og/sitio";
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: settings.seoDefaultTitle || settings.name,
      template: `%s · ${settings.name}`,
    },
    description: settings.description || undefined,
    alternates: { canonical: "/", types: { "application/rss+xml": "/rss.xml" } },
    openGraph: { images: [ogImage], siteName: settings.name, locale: "es_PE", type: "website" },
    verification: settings.googleSearchConsoleVerification
      ? { google: settings.googleSearchConsoleVerification }
      : undefined,
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-PE" className={`${inter.variable} ${nunito.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
