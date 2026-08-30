import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { getPlatformSettings } from "@/lib/api/client";
import { SITE_URL } from "@/lib/site-url";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPlatformSettings();
  const ogImage = settings.seoDefaultImageUrl || settings.ogImageUrl || undefined;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: settings.seoDefaultTitle || settings.name,
      template: `%s · ${settings.name}`,
    },
    description: settings.seoDefaultDescription || settings.description || undefined,
    alternates: { canonical: "/" },
    openGraph: ogImage ? { images: [ogImage] } : undefined,
    verification: settings.googleSearchConsoleVerification
      ? { google: settings.googleSearchConsoleVerification }
      : undefined,
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getPlatformSettings();

  const dataTheme = settings.theme === "LIGHT" ? "light" : settings.theme === "DARK" ? "dark" : undefined;

  return (
    <html lang="es" data-theme={dataTheme} className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        {children}
        {settings.analyticsId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${settings.analyticsId}`} strategy="afterInteractive" />
            <Script id="analytics-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${settings.analyticsId}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
