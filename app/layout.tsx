import { FooterWrapper } from "@/components/footer-wrapper";
import { Header } from "@/components/header";
import { LiveHubChatbot } from "@/components/livehub-chatbot";
import { Providers } from "@/components/providers";
import { SiteFrame } from "@/components/site-frame";
import { SkipToContent } from "@/components/skip-to-content";
import { ThemeSwitch } from "@/components/theme-switch";
import { TrialBannerGuard } from "@/components/trial-banner-guard";
import { baseMetadata } from "@/lib/metadata";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = baseMetadata;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f97316" },
    { media: "(prefers-color-scheme: dark)", color: "#f97316" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactNode {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground flex min-h-screen flex-col font-sans antialiased`}
      >
        <Providers>
          <SiteFrame />

          <Header />
          <ThemeSwitch />

          <TrialBannerGuard />
          <LiveHubChatbot />

          <SkipToContent />
          {children}
          <FooterWrapper />
        </Providers>
      </body>
    </html>
  );
}
