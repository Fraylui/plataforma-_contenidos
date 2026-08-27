import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import { getPlatformSettings } from "@/lib/api/client";
import { SITE_URL } from "@/lib/site-url";

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPlatformSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: settings.seoDefaultTitle || settings.name,
      template: `%s · ${settings.name}`,
    },
    description: settings.seoDefaultDescription || settings.description || undefined,
    alternates: { canonical: "/" },
    openGraph: settings.seoDefaultImageUrl ? { images: [settings.seoDefaultImageUrl] } : undefined,
    verification: settings.googleSearchConsoleVerification
      ? { google: settings.googleSearchConsoleVerification }
      : undefined,
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${newsreader.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
