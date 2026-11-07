import { IBM_Plex_Sans, Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/layout/ScrollToTop";
import Web3Providers from "@/components/providers/Web3Providers";
import { Toaster } from "react-hot-toast";

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "BuySpace | Air rights on Hedera",
  description:
    "Tokenize and lease urban airspace on Hedera Testnet. Lease offers indexed on Arkiv Rabdi.",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="font-sans antialiased bg-bg text-ink">
        <Web3Providers>
          <Header />
          <main className="min-h-screen pt-[4.75rem]">{children}</main>
          <Footer />
          <ScrollToTop />
          <Toaster position="top-right" />
        </Web3Providers>
      </body>
    </html>
  );
}
