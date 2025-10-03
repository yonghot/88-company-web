import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "88 Company - 비즈니스 성장을 위한 전문 컨설팅",
  description: "창업 컨설팅, 경영 전략, 마케팅, 투자 유치까지. 88 Company와 함께 비즈니스를 성장시키세요.",
  keywords: "창업 컨설팅, 경영 컨설팅, 마케팅 전략, 투자 유치, 비즈니스 전략",
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
      <body
        className={`${inter.variable} font-sans antialiased h-screen overflow-hidden bg-background`}
      >
        {children}
      </body>
    </html>
  );
}