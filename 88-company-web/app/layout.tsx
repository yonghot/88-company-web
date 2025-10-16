import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MetaPixel from "@/components/MetaPixel";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "88",
  description: "예비창업자를 위한 최저가 토털 솔루션",
  keywords: "예비창업자를 위한 최저가 토털 솔루션",
  authors: [{ name: "88 Company" }],
  icons: {
    icon: "/88-logo.png",
    apple: "/88-logo.png",
  },
  openGraph: {
    title: "에이티에잇 컴퍼니",
    description: "예비창업자를 위한 최저가 토털 솔루션",
    url: "https://www.88-company.com",
    siteName: "88 Company",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "88 Company",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "에이티에잇 컴퍼니",
    description: "예비창업자를 위한 최저가 토털 솔루션",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <head />
      <body
        className={`${inter.variable} font-sans antialiased h-screen overflow-hidden bg-background`}
      >
        <MetaPixel />
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}