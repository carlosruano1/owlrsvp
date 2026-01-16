import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - Frequently Asked Questions | OwlRSVP",
  description: "Find answers to common questions about OwlRSVP event management. Learn about features, pricing, how to create RSVP pages, custom branding, QR codes, and more. Get help with event planning and guest management.",
  keywords: "OwlRSVP FAQ, event management questions, RSVP help, event planning FAQ, how to create RSVP page, event management features, custom branding FAQ, QR code RSVP",
  openGraph: {
    title: "FAQ - Frequently Asked Questions | OwlRSVP",
    description: "Find answers to common questions about OwlRSVP event management platform.",
    url: "https://owlrsvp.com/faq",
    siteName: "OwlRSVP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "FAQ - Frequently Asked Questions | OwlRSVP",
    description: "Find answers to common questions about OwlRSVP event management platform.",
  },
  alternates: {
    canonical: "https://owlrsvp.com/faq",
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
