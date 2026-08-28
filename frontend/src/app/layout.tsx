import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import type { CSSProperties } from "react";
import "./globals.css";
import { getPlatformSettings } from "@/lib/api/client";
import { SITE_URL } from "@/lib/site-url";
import { contrastingForeground, isValidHexColor } from "@/lib/theme";

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

  // Solo primaryColor/backgroundColor se conectan a tokens existentes
  // (--accent/--background). secondaryColor se deja sin usar a propósito:
  // el sistema de diseño (.interface-design/system.md) prohíbe un segundo
  // hue, y no hay ningún token pensado para él todavía.
  const themeStyle: CSSProperties & Record<string, string> = {};
  if (settings.primaryColor && isValidHexColor(settings.primaryColor)) {
    themeStyle["--accent"] = settings.primaryColor;
    themeStyle["--accent-foreground"] = contrastingForeground(settings.primaryColor);
  }
  if (settings.backgroundColor && isValidHexColor(settings.backgroundColor)) {
    themeStyle["--background"] = settings.backgroundColor;
  }
  if (settings.fontFamily) {
    themeStyle["--font-sans"] = `"${settings.fontFamily}", ${inter.style.fontFamily}, ui-sans-serif, system-ui, sans-serif`;
  }

  return (
    <html
      lang="es"
      data-theme={dataTheme}
      className={`${inter.variable} h-full antialiased`}
      style={themeStyle}
    >
      <head>
        {settings.fontFamily && (
          <link
            rel="stylesheet"
            href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(settings.fontFamily)}:wght@400;500;600;700&display=swap`}
          />
        )}
      </head>
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
