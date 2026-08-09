import type { Metadata, Viewport } from "next";
import { Oswald, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/**
 * Font-Entscheidung (Revision gegenüber Phase 2):
 * "Archivo Expanded" ist als feste Schnittvariante nicht über Google
 * Fonts/next-font ladbar (Archivo ist dort nur als Variable-Font ohne
 * "Expanded"-Preset verfügbar). Für die geforderte Rolle — condensed,
 * kräftig, Stadion-/Scoreboard-Charakter — trifft Oswald in Bold/Semibold
 * die Wirkung direkt und ist ein etablierter, sehr gut unterstützter
 * Google Font. Die Rolle (Display) bleibt identisch zum Design System,
 * nur die konkrete Schriftfamilie wurde bewusst ausgetauscht.
 */
const display = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const text = Inter({
  subsets: ["latin"],
  variable: "--font-text",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-data",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ZEBRA — MSV Duisburg",
  description: "Das persönliche digitale MSV-Duisburg-Command-Center.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ZEBRA",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0E13",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`dark ${display.variable} ${text.variable} ${mono.variable}`}>
      <body className="font-text antialiased">{children}</body>
    </html>
  );
}
