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
      <footer className="py-12 border-t border-white/10 bg-slate-950">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
            <div className="mb-4 md:mb-0">
              <p>&copy; {new Date().getFullYear()} RunAds Network. All rights reserved.</p>
            </div>
            <div className="flex gap-6">
              <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/legal/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/legal/cookie" className="hover:text-white transition-colors">Cookie Policy</Link>
              <Link href="/legal/contact" className="hover:text-white transition-colors">Contact Us</Link>
              <Link href="/legal/about" className="hover:text-white transition-colors">About US</Link>
            </div>
          </div>
        </div>
      </footer>
      </body>
    </html>
  );
}

