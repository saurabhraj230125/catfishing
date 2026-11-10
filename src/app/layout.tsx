import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CATCH ME IF YOU CAN // Gamified Social Deduction Chat",
  description: "A cozy pond Boy-meets-Girl social deduction chat game. Deceive or Detect!",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
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
      <body className="bg-[#E0F7FA] text-slate-900 min-h-screen antialiased selection:bg-teal-300 selection:text-slate-900">
        {children}
      </body>
    </html>
  );
}
