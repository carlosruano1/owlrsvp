import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ScrollToTop from "@/components/ScrollToTop";
import { WebSiteSchema, SoftwareApplicationSchema } from "@/components/StructuredData";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: 'swap',
  weight: ['300', '400', '500'], // Lighter weights for cleaner, modern look
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://owlrsvp.com'),
  title: "Create Beautiful RSVP Pages in Seconds | OwlRSVP",
  description: "The easiest way to collect event RSVPs online. Custom branding, QR codes, and real-time tracking—no signup required for guests. Start free today.",
  keywords: "event management, RSVP, event planning, guest list, corporate events, QR code, custom branding, event page",
  authors: [{ name: "OwlRSVP Team" }],
  creator: "OwlRSVP",
  publisher: "OwlRSVP",
  icons: {
    icon: [
      { url: "/images/logo.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    shortcut: ["/images/logo.png"],
    apple: { url: "/images/logo.png", type: "image/png" },
  },
  openGraph: {
    title: "Create Beautiful RSVP Pages in Seconds | OwlRSVP",
    description: "The easiest way to collect event RSVPs online. Custom branding, QR codes, and real-time tracking—no signup required for guests.",
    url: "https://owlrsvp.com",
    siteName: "OwlRSVP",
    images: [
      {
        url: "/images/owlrsvp-og.png",
        width: 1200,
        height: 630,
        alt: "Create Beautiful RSVP Pages in Seconds | OwlRSVP",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Beautiful RSVP Pages in Seconds | OwlRSVP",
    description: "The easiest way to collect event RSVPs online. Custom branding, QR codes, and real-time tracking—no signup required for guests.",
    images: ["/images/owlrsvp-og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "verification_token",
  },
  alternates: {
    canonical: "https://owlrsvp.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content="ca-pub-5389151790314295" />
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico?v=2" />
        <link rel="apple-touch-icon" href="/images/logo.png?v=2" />
      </head>
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WebSiteSchema()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SoftwareApplicationSchema()) }}
        />
        {children}
        <ScrollToTop />
        <SpeedInsights />
      </body>
    </html>
  );
}
