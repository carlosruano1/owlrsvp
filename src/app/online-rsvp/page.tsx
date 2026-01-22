import type { Metadata } from "next";
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'
import FAQAccordion from '@/components/FAQAccordion'
import { TOP_10_FAQS } from '@/lib/faqData'

export const metadata: Metadata = {
  title: "Online RSVP Made Simple | Create Event Pages in Seconds",
  description: "Collect RSVPs instantly with beautiful online pages. No guest signup required—perfect for weddings, parties, and corporate events. Free to start.",
  keywords: "online RSVP, digital RSVP, event RSVP, RSVP website, online event registration",
  openGraph: {
    title: "Online RSVP Made Simple | Create Event Pages in Seconds",
    description: "Collect RSVPs instantly with beautiful online pages. No guest signup required—perfect for any event.",
    url: "https://owlrsvp.com/online-rsvp",
    siteName: "OwlRSVP",
    images: [{ url: "/images/owlrsvp-og.png", width: 1200, height: 630, alt: "Online RSVP Made Simple" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online RSVP Made Simple | Create Event Pages in Seconds",
    description: "Collect RSVPs instantly with beautiful online pages. No guest signup required—perfect for any event.",
  },
  alternates: {
    canonical: "https://owlrsvp.com/online-rsvp",
  },
};

const pageFAQs = [
  {
    question: "What is an online RSVP?",
    answer: "An online RSVP is a digital method for collecting event responses through a web page. Instead of traditional paper invitations, guests visit a URL, enter their information, and confirm attendance electronically. Online RSVPs eliminate the need for physical mail, reduce response time, and provide instant tracking for event organizers.",
    category: "getting-started" as const,
  },
  {
    question: "How do I create an online RSVP page?",
    answer: "Creating an online RSVP page with OwlRSVP takes under 60 seconds. Simply visit our create page, enter your event details (title, date, description), customize colors and branding if desired, and you'll instantly receive a shareable RSVP link. No account required to get started—just create and share.",
    category: "getting-started" as const,
  },
  {
    question: "Do guests need to create an account to RSVP online?",
    answer: "No! One of the key advantages of OwlRSVP is that guests never need to create an account or download an app. They simply click your RSVP link, enter their name and response, and submit. This makes the experience seamless and accessible for all your guests.",
    category: "features" as const,
  },
  {
    question: "Can I customize my online RSVP page?",
    answer: "Yes! OwlRSVP offers extensive customization options. On paid plans, you can upload your company logo, customize colors to match your brand, and personalize the entire experience. The free plan includes basic color customization, while paid plans unlock full branding capabilities.",
    category: "features" as const,
  },
];

export default function OnlineRSVPPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Online RSVP',
            description: 'Create beautiful online RSVP pages in seconds with OwlRSVP',
            url: 'https://owlrsvp.com/online-rsvp',
            mainEntity: {
              '@type': 'FAQPage',
              mainEntity: pageFAQs.map(faq => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer,
                },
              })),
            },
          }),
        }}
      />
      <div className="min-h-screen bg-gray-900 text-white">
        <Navigation />
        
        <main className="pt-24 pb-16 px-6">
          <article className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <header className="text-center mb-16">
              <h1 className="text-5xl md:text-6xl font-light mb-6 text-white">
                Online RSVP Made Simple
              </h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
                Create beautiful online RSVP pages in seconds. No signup required for guests. 
                Perfect for events, parties, conferences, and any gathering.
              </p>
              <Link
                href="/create"
                className="inline-block px-8 py-4 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-all shadow-xl text-lg"
              >
                Create Your Online RSVP Page
              </Link>
            </header>

            {/* Main Content */}
            <div className="prose prose-invert max-w-none">
              <section className="mb-12">
                <h2 className="text-3xl font-light mb-6 text-white">What is an Online RSVP?</h2>
                <p className="text-lg text-white/80 leading-relaxed mb-4">
                  An online RSVP (Répondez S'il Vous Plaît) is a digital solution for collecting event responses 
                  through a web-based interface. Unlike traditional paper invitations that require guests to mail 
                  back a response card, online RSVPs allow guests to confirm or decline attendance instantly through 
                  a simple web page.
                </p>
                <p className="text-lg text-white/80 leading-relaxed mb-4">
                  Modern online RSVP systems like OwlRSVP eliminate the friction of traditional methods. Guests 
                  receive a link via email, text message, or social media, click through to your custom RSVP page, 
                  enter their information, and submit their response—all in under 30 seconds. Event organizers receive 
                  instant notifications and can track responses in real-time through an admin dashboard.
                </p>
                <p className="text-lg text-white/80 leading-relaxed">
                  The benefits are clear: faster response times, reduced costs, automatic data collection, and a 
                  better experience for both organizers and guests. Whether you're planning a corporate conference, 
                  wedding, birthday party, or community event, online RSVPs streamline the entire process.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-light mb-6 text-white">Digital RSVP vs Traditional Event Registration</h2>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-medium mb-3 text-white">Instant Responses</h3>
                    <p className="text-white/80">
                      Guests can respond immediately from any device. No waiting for mail delivery or phone calls 
                      during business hours. You'll know who's attending within minutes of sending invitations.
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-medium mb-3 text-white">Cost Effective</h3>
                    <p className="text-white/80">
                      Eliminate printing, postage, and paper costs. Digital invitations and RSVPs are free to send 
                      and can reach unlimited guests instantly.
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-medium mb-3 text-white">Automatic Tracking</h3>
                    <p className="text-white/80">
                      All responses are automatically collected in one place. Export guest lists to CSV, track 
                      attendance in real-time, and never lose a response.
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-medium mb-3 text-white">Better Guest Experience</h3>
                    <p className="text-white/80">
                      Modern, mobile-friendly RSVP pages work on any device. No apps to download, no accounts to 
                      create—just click and respond.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-light mb-6 text-white">How to Build Your Digital RSVP Page</h2>
                <p className="text-lg text-white/80 leading-relaxed mb-4">
                  Creating an online RSVP page with OwlRSVP is designed to be incredibly simple. Here's how it works:
                </p>
                <ol className="list-decimal list-inside space-y-4 mb-6 text-lg text-white/80">
                  <li className="mb-2">
                    <strong className="text-white">Create Your Event</strong> - Visit our create page and enter your 
                    event details: title, date, optional description, and any special instructions for guests.
                  </li>
                  <li className="mb-2">
                    <strong className="text-white">Customize Your Page</strong> - Choose colors that match your brand, 
                    upload your logo (on paid plans), and personalize the experience. The free plan includes basic 
                    customization options.
                  </li>
                  <li className="mb-2">
                    <strong className="text-white">Get Your RSVP Link</strong> - Instantly receive a unique, shareable 
                    URL for your event. We also generate a QR code automatically that you can print on invitations or 
                    display at your venue.
                  </li>
                  <li className="mb-2">
                    <strong className="text-white">Share With Guests</strong> - Send your RSVP link via email, text 
                    message, social media, or embed it on your website. Guests can respond from any device.
                  </li>
                  <li className="mb-2">
                    <strong className="text-white">Track Responses</strong> - Monitor RSVPs in real-time through your 
                    admin dashboard. Export guest lists, view analytics, and manage your event all in one place.
                  </li>
                </ol>
                <p className="text-lg text-white/80 leading-relaxed">
                  The entire process takes under 60 seconds, and you can start collecting responses immediately. No 
                  technical knowledge required—if you can use email, you can create an online RSVP page.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-light mb-6 text-white">Essential Features for Event RSVP Systems</h2>
                <p className="text-lg text-white/80 leading-relaxed mb-4">
                  When choosing an online RSVP solution, look for these essential features:
                </p>
                <ul className="list-disc list-inside space-y-3 mb-6 text-lg text-white/80">
                  <li><strong className="text-white">No Guest Signup Required</strong> - Guests shouldn't need to create accounts or download apps. The best platforms allow instant responses with just a name.</li>
                  <li><strong className="text-white">Mobile-Responsive Design</strong> - Most guests will respond from their phones. Ensure your RSVP page works perfectly on all devices.</li>
                  <li><strong className="text-white">Custom Branding</strong> - Match your event's aesthetic with custom colors, logos, and styling options.</li>
                  <li><strong className="text-white">Real-Time Tracking</strong> - See responses as they come in, with automatic updates to your guest count.</li>
                  <li><strong className="text-white">Data Export</strong> - Download guest lists as CSV files for easy import into other tools or for printing.</li>
                  <li><strong className="text-white">QR Code Support</strong> - Generate QR codes for easy sharing on printed materials or at event venues.</li>
                  <li><strong className="text-white">Plus-One Management</strong> - Allow guests to indicate if they're bringing additional attendees.</li>
                  <li><strong className="text-white">Analytics</strong> - Track response rates, see when guests respond, and understand your event's engagement.</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-light mb-6 text-white">Event Types That Benefit from Digital RSVP</h2>
                <p className="text-lg text-white/80 leading-relaxed mb-4">
                  Online RSVPs work for virtually any event type:
                </p>
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-medium mb-3 text-white">Corporate Events</h3>
                    <p className="text-white/80">
                      Conferences, team building, product launches, and company parties benefit from professional 
                      online RSVP pages with custom branding.
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-medium mb-3 text-white">Weddings</h3>
                    <p className="text-white/80">
                      Elegant RSVP pages that match your wedding theme, with easy plus-one management and guest list 
                      export for seating charts.
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-medium mb-3 text-white">Community Events</h3>
                    <p className="text-white/80">
                      Fundraisers, town halls, workshops, and social gatherings can all use simple online RSVPs 
                      to track attendance.
                    </p>
                  </div>
                </div>
              </section>

              {/* FAQ Section */}
              <section className="mb-12">
                <h2 className="text-3xl font-light mb-6 text-white">Frequently Asked Questions About Online RSVP</h2>
                <FAQAccordion faqs={pageFAQs} />
              </section>

              {/* CTA Section */}
              <section className="text-center bg-white/5 rounded-2xl p-12 border border-white/10">
                <h2 className="text-3xl font-light mb-4 text-white">Ready to Create Your Online RSVP Page?</h2>
                <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                  Join thousands of event organizers using OwlRSVP to streamline their RSVP process. 
                  Create your first event in under 60 seconds—no credit card required.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/create"
                    className="inline-block px-8 py-4 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-all text-lg"
                  >
                    Create Your RSVP Page
                  </Link>
                  <Link
                    href="/#pricing"
                    className="inline-block px-8 py-4 bg-white/10 border border-white/30 text-white font-medium rounded-lg hover:bg-white/20 transition-all text-lg"
                  >
                    View Pricing
                  </Link>
                </div>
              </section>
            </div>
          </article>
        </main>

        <Footer />
      </div>
    </>
  );
}
