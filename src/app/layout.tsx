import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: 'swap'
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://owlrsvp.com'),
  title: "OwlRSVP - Beautiful Event RSVP Management | Create Custom Event Pages",
  description: "Create stunning RSVP pages in seconds. Perfect for corporate events, parties, conferences with custom branding, QR codes, and guest management. No signup required.",
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
    title: "OwlRSVP - Beautiful Event RSVP Management",
    description: "Create stunning RSVP pages in seconds with custom branding, QR codes, and powerful guest management tools.",
    url: "https://owlrsvp.com",
    siteName: "OwlRSVP",
    images: [
      {
        url: "/images/owlrsvp-og.png",
        width: 1200,
        height: 630,
        alt: "OwlRSVP - Beautiful Event RSVP Management",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OwlRSVP - Beautiful Event RSVP Management",
    description: "Create stunning RSVP pages in seconds with custom branding, QR codes, and powerful guest management tools.",
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
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico?v=2" />
        <link rel="apple-touch-icon" href="/images/logo.png?v=2" />
      </head>
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
