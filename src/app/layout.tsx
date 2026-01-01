import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RunAds",
  description: "Next generation advertising platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9944004180654653"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      {/* Footer */}
      <footer className="bg-slate-950 border-t border-white/10 py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <span className="font-bold text-white text-xs">R</span>
            </div>
            <span className="text-lg font-bold text-white">RunAds</span>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-slate-400">
            <Link href="/legal/about" className="hover:text-white transition-colors">About Us</Link>
            <Link href="/legal/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/legal/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/sitemap.xml" className="hover:text-white transition-colors">Sitemap</Link>
          </div>
          <p className="text-slate-500 text-xs">
            &copy; {new Date().getFullYear()} RunAds. All rights reserved.
          </p>
        </div>
      </footer>
      </body>
    </html>
  );
}

