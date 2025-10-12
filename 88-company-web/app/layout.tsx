import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <html lang="ko" className="dark">
      <head>
        {metaPixelId && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${metaPixelId}');
                  fbq('track', 'PageView');
                `,
              }}
            />
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
      </head>
      <body
        className={`${inter.variable} font-sans antialiased h-screen overflow-hidden bg-background`}
      >
        {children}
      </body>
    </html>
  );
}