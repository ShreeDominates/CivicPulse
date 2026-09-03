import type { Metadata } from "next";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "CivicPulse — Zero-Touch Citizen Services",
  description:
    "AI-Powered Interoperability & Civic Intelligence Layer. Sarkari Kaam, Ab 3 Second Mein.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
