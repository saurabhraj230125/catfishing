import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { ToastContainer } from "@/components/Toast";

export const metadata: Metadata = {
  title: "CATCH ME IF YOU CAN // Gamified Social Deduction Chat",
  description: "A cozy pond Boy-meets-Girl social deduction chat game. Deceive or Detect!",
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
  viewportFit: "cover",
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
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7031826557252909"
          crossOrigin="anonymous"
        />

        {/* Automatic stale-chunk 404 reload recovery handler */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                var isChunkError = e.message && (
                  e.message.indexOf('Loading chunk') !== -1 ||
                  e.message.indexOf('ChunkLoadError') !== -1 ||
                  e.message.indexOf('Failed to fetch dynamically imported module') !== -1
                );
                var target = e.target || e.srcElement;
                var isStaticChunk404 = target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK') && target.src && (
                  target.src.indexOf('/_next/static/') !== -1
                );
                if (isChunkError || isStaticChunk404) {
                  var key = '__pond_chunk_reload';
                  var last = sessionStorage.getItem(key);
                  var now = Date.now();
                  if (!last || now - parseInt(last, 10) > 8000) {
                    sessionStorage.setItem(key, String(now));
                    window.location.reload();
                  }
                }
              }, true);
            `,
          }}
        />
      </head>
      <body className="bg-[#E0F7FA] text-slate-900 min-h-screen antialiased selection:bg-teal-300 selection:text-slate-900">
        <GoogleAnalytics />
        <ToastContainer />
        {children}
      </body>
    </html>
  );
}
