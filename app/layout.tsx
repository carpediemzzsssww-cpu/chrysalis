import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fontDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const fontBody = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chrysalis",
  description: "A butterfly-themed daily reflection and growth journal.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Chrysalis",
  },
  icons: {
    icon: "/icons/icon-512.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#C4B5E0",
};

const THEME_BOOTSTRAP = `
  (function () {
    try {
      var raw = window.localStorage.getItem('chrysalis-data');
      if (!raw) return;
      var parsed = JSON.parse(raw);
      var s = parsed && parsed.settings;
      if (s && s.theme === 'dark') {
        document.documentElement.dataset.theme = 'dark';
      }
      var validSizes = ['small', 'medium', 'large'];
      if (s && validSizes.indexOf(s.fontSize) !== -1) {
        document.documentElement.dataset.fontSize = s.fontSize;
      }
    } catch (error) {
      console.error('Unable to restore Chrysalis preferences.', error);
    }
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${fontDisplay.variable} ${fontBody.variable}`} suppressHydrationWarning>
      <head>
        {/* Noto Serif SC — CJK fallback for the display font.
            next/font doesn't support chinese-simplified subset in Next.js 14,
            so we load it directly. Google Fonts serves unicode-range optimised
            files so only the glyphs actually used are downloaded. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <Script id="chrysalis-theme" strategy="beforeInteractive">
          {THEME_BOOTSTRAP}
        </Script>
        {children}
      </body>
    </html>
  );
}
