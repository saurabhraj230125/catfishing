import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

export const metadata: Metadata = {
  title: "CATCH ME IF YOU CAN // Gamified Social Deduction Chat",
  description: "A cozy pond Boy-meets-Girl social deduction chat game. Deceive or Detect!",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Catch Me",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#E0F7FA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google AdSense Official Script */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7031826557252909"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="bg-[#E0F7FA] text-slate-900 min-h-screen antialiased selection:bg-teal-300 selection:text-slate-900">
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
