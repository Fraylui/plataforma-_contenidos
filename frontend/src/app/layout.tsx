import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getPlatformSettings } from "@/lib/api/client";
import { SITE_URL } from "@/lib/site-url";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPlatformSettings();
  const ogImage = settings.ogImageUrl || undefined;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: settings.seoDefaultTitle || settings.name,
      template: `%s · ${settings.name}`,
    },
    description: settings.description || undefined,
    alternates: { canonical: "/", types: { "application/rss+xml": "/rss.xml" } },
    openGraph: ogImage ? { images: [ogImage] } : undefined,
    verification: settings.googleSearchConsoleVerification
      ? { google: settings.googleSearchConsoleVerification }
      : undefined,
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
