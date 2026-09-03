import type { Metadata, Viewport } from "next";
import Providers from "@/components/Providers";
import ScrollToTop from "@/components/ScrollToTop";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CivicPulse — Zero-Touch Citizen Services",
    template: "%s | CivicPulse",
  },
  description:
    "AI-Powered Interoperability & Civic Intelligence Layer. From Citizen Complaints to City Intelligence. Built for SIH 2026 — Problem Statement SIH26129.",
  keywords: [
    "CivicPulse", "Smart India Hackathon", "SIH 2026", "government services",
    "citizen services", "interoperability", "Aadhaar", "DigiLocker", "API Setu",
    "digital India", "zero-touch", "scholarship", "birth registration",
  ],
  authors: [{ name: "Team UrbanIQ" }],
  creator: "Team UrbanIQ",
  metadataBase: new URL("https://civicpulse-v2.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://civicpulse-v2.vercel.app",
    siteName: "CivicPulse",
    title: "CivicPulse — Zero-Touch Citizen Services",
    description:
      "AI-Powered Interoperability & Civic Intelligence Layer. From Citizen Complaints to City Intelligence.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CivicPulse — Government Service Delivery Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CivicPulse — Zero-Touch Citizen Services",
    description:
      "AI-Powered Interoperability & Civic Intelligence Layer. Built for SIH 2026.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0F2240",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:bg-saffron focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold"
        >
          Skip to main content
        </a>
        <Providers>
          <ScrollToTop />
          {children}
        </Providers>
      </body>
    </html>
  );
}
