import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions About RSVP Management | OwlRSVP",
  description: "Get answers to your questions about creating RSVP pages, custom branding, QR codes, pricing, and more. Everything you need to know about event management.",
  keywords: "OwlRSVP FAQ, event management questions, RSVP help, event planning FAQ, how to create RSVP page, event management features, custom branding FAQ, QR code RSVP",
  openGraph: {
    title: "Frequently Asked Questions About RSVP Management | OwlRSVP",
    description: "Get answers to your questions about creating RSVP pages, custom branding, QR codes, and event management.",
    url: "https://owlrsvp.com/faq",
    siteName: "OwlRSVP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Frequently Asked Questions About RSVP Management | OwlRSVP",
    description: "Get answers to your questions about creating RSVP pages, custom branding, QR codes, and event management.",
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
