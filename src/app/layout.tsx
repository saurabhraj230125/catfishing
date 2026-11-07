import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CATCH ME IF YOU CAN // Gamified Social Deduction Chat",
  description: "A cozy pond Boy-meets-Girl social deduction chat game. Deceive or Detect!",
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
