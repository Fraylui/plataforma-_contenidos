import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import { getPlatformSettings } from "@/lib/api/client";
import { SITE_URL } from "@/lib/site-url";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CookieConsentBanner } from "@/components/legal/cookie-consent-banner";
import { AdsenseLoader } from "@/components/legal/adsense-loader";

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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getPlatformSettings();

  return (
    <html
      lang="es"
      className={`${newsreader.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <CookieConsentBanner adsenseEnabled={settings.adsenseEnabled} />
        {settings.adsenseEnabled && settings.adsenseClientId && (
          <AdsenseLoader clientId={settings.adsenseClientId} />
        )}
      </body>
    </html>
  );
}
