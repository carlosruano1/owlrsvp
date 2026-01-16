import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - Event Management & RSVP Tips | OwlRSVP",
  description: "Expert guides on event management, RSVP best practices, digital invitations, and event planning. Learn how to create better events with our comprehensive guides.",
  keywords: "event management blog, RSVP tips, event planning guide, digital invitations, event management best practices",
  openGraph: {
    title: "Blog - Event Management & RSVP Tips | OwlRSVP",
    description: "Expert guides on event management, RSVP best practices, and event planning.",
    url: "https://owlrsvp.com/blog",
    siteName: "OwlRSVP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Blog - Event Management & RSVP Tips | OwlRSVP",
    description: "Expert guides on event management, RSVP best practices, and event planning.",
  },
  alternates: {
    canonical: "https://owlrsvp.com/blog",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
