import type { Metadata } from "next";
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'
import FAQAccordion from '@/components/FAQAccordion'

export const metadata: Metadata = {
  title: "QR Code RSVP | OwlRSVP",
  description: "Generate QR codes for instant RSVP collection. Print on invitations, display at venues, or share digitally. No app required—guests scan and respond instantly.",
  keywords: "QR code RSVP, QR code event registration, scan to RSVP, QR code invitations, event QR code",
  openGraph: {
    title: "QR Code RSVP | OwlRSVP",
    description: "Generate QR codes for instant RSVP collection. Print on invitations, display at venues, or share digitally.",
    url: "https://owlrsvp.com/qr-code-rsvp",
    siteName: "OwlRSVP",
    images: [{ url: "/images/owlrsvp-og.png", width: 1200, height: 630, alt: "QR Code RSVP with OwlRSVP" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "QR Code RSVP | OwlRSVP",
    description: "Generate QR codes for instant RSVP collection. Print on invitations, display at venues, or share digitally.",
  },
  alternates: {
    canonical: "https://owlrsvp.com/qr-code-rsvp",
  },
};

const pageFAQs = [
  {
    question: "What is a QR code RSVP?",
    answer: "A QR code RSVP is a scannable code that links directly to your event's RSVP page. When guests scan the QR code with their smartphone camera, they're instantly taken to your RSVP form where they can respond. QR codes eliminate the need to type URLs and make responding to invitations faster and more convenient.",
    category: "getting-started" as const,
  },
  {
    question: "How do QR code RSVPs work?",
    answer: "When you create an event with OwlRSVP, we automatically generate a unique QR code for your RSVP page. You can download this QR code and print it on invitations, display it at your venue, or share it digitally. Guests scan the code with their phone's camera (no special app needed), and they're taken directly to your RSVP page to respond.",
    category: "getting-started" as const,
  },
  {
    question: "Do guests need a special app to scan QR codes?",
    answer: "No! Modern smartphones have built-in QR code scanning in their camera apps. iPhone users can scan directly from the Camera app, and Android users can use Google Lens or their camera app. No additional downloads or apps required.",
    category: "technical" as const,
  },
  {
    question: "Can I customize my QR code design?",
    answer: "While the QR code itself follows standard patterns for maximum scannability, you can customize the RSVP page that the QR code links to. Upload your logo, match your brand colors, and create a fully branded experience that guests see after scanning.",
    category: "features" as const,
  },
];

export default function QRCodeRSVPPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'QR Code RSVP',
            description: 'Generate QR codes for instant RSVP collection with OwlRSVP',
            url: 'https://owlrsvp.com/qr-code-rsvp',
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
            <header className="text-center mb-16">
              <h1 className="text-5xl md:text-6xl font-light mb-6 text-white">
                QR Code RSVP Made Simple
              </h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
                Generate QR codes for instant RSVP collection. Print on invitations, display at venues, 
                or share digitally. No app required—guests scan and respond instantly.
              </p>
              <Link
                href="/create"
                className="inline-block px-8 py-4 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-all shadow-xl text-lg"
              >
                Create QR Code RSVP
              </Link>
            </header>

            <div className="prose prose-invert max-w-none">
              <section className="mb-12">
                <h2 className="text-3xl font-light mb-6 text-white">What is a QR Code RSVP?</h2>
                <p className="text-lg text-white/80 leading-relaxed mb-4">
                  A QR (Quick Response) code RSVP combines the convenience of digital responses with the 
                  tangibility of physical invitations. When you create an event with OwlRSVP, we automatically 
                  generate a unique QR code that links directly to your RSVP page. Guests simply scan the code 
                  with their smartphone camera, and they're instantly taken to your RSVP form.
                </p>
                <p className="text-lg text-white/80 leading-relaxed mb-4">
                  QR code RSVPs eliminate the friction of typing long URLs or searching for event pages. They 
                  bridge the gap between physical and digital, making it easy for guests to respond whether 
                  they receive a printed invitation or see the code displayed at your venue.
                </p>
                <p className="text-lg text-white/80 leading-relaxed">
                  The technology has become ubiquitous—most modern smartphones can scan QR codes directly from 
                  their camera apps without any additional software. This makes QR code RSVPs accessible to 
                  virtually all guests, regardless of their technical comfort level.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-light mb-6 text-white">Benefits of QR Code RSVPs</h2>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-medium mb-3 text-white">Instant Access</h3>
                    <p className="text-white/80">
                      Guests scan and respond in seconds. No typing URLs, no searching for event pages, 
                      no navigating through multiple links. The QR code is a direct gateway to your RSVP form.
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-medium mb-3 text-white">Bridging Physical and Digital</h3>
                    <p className="text-white/80">
                      Perfect for events that combine printed invitations with digital responses. Print the 
                      QR code on your invitations, and guests can respond immediately without leaving the 
                      physical invitation.
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-medium mb-3 text-white">Venue Display</h3>
                    <p className="text-white/80">
                      Display QR codes at event venues, on signage, or at registration tables. Last-minute 
                      guests or walk-ins can scan and respond on the spot.
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-medium mb-3 text-white">No App Downloads</h3>
                    <p className="text-white/80">
                      Modern smartphones scan QR codes natively through their camera apps. No special 
                      QR code reader apps required, making it accessible to all guests.
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-medium mb-3 text-white">Professional Appearance</h3>
                    <p className="text-white/80">
                      QR codes on invitations and materials look modern and professional. They signal that 
                      you're using contemporary event management tools.
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-medium mb-3 text-white">Trackable Analytics</h3>
                    <p className="text-white/80">
                      See exactly when and how guests respond. QR code scans provide valuable data about 
                      response patterns and guest engagement.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-light mb-6 text-white">How QR Code RSVPs Work</h2>
                <p className="text-lg text-white/80 leading-relaxed mb-4">
                  The process is remarkably simple for both event organizers and guests:
                </p>
                <ol className="list-decimal list-inside space-y-4 mb-6 text-lg text-white/80">
                  <li className="mb-2">
                    <strong className="text-white">Create Your Event</strong> - When you create an event with 
                    OwlRSVP, we automatically generate a unique QR code linked to your RSVP page. This happens 
                    instantly—no additional setup required.
                  </li>
                  <li className="mb-2">
                    <strong className="text-white">Download Your QR Code</strong> - Access your QR code from 
                    your admin dashboard. Download it as a high-resolution image suitable for printing or 
                    digital sharing.
                  </li>
                  <li className="mb-2">
                    <strong className="text-white">Print or Display</strong> - Add the QR code to your 
                    invitations, event materials, signage, or display it at your venue. Ensure it's large 
                    enough to scan easily (minimum 1 inch square recommended).
                  </li>
                  <li className="mb-2">
                    <strong className="text-white">Guests Scan</strong> - Guests open their smartphone camera 
                    app, point it at the QR code, and tap the notification that appears. They're instantly 
                    taken to your RSVP page.
                  </li>
                  <li className="mb-2">
                    <strong className="text-white">Instant Response</strong> - Guests complete the RSVP form 
                    and submit. You receive the response immediately in your admin dashboard, and your guest 
                    count updates in real-time.
                  </li>
                </ol>
                <p className="text-lg text-white/80 leading-relaxed">
                  The entire flow takes less than 30 seconds for guests, and you have complete visibility 
                  into all responses from your dashboard.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-light mb-6 text-white">Best Practices for QR Code RSVPs</h2>
                <div className="bg-white/5 rounded-xl p-8 border border-white/10 mb-6">
                  <h3 className="text-2xl font-light mb-4 text-white">Printing Guidelines</h3>
                  <ul className="list-disc list-inside space-y-2 text-white/80">
                    <li>Ensure QR codes are at least 1 inch (2.5 cm) square for reliable scanning</li>
                    <li>Use high contrast—dark QR code on light background or vice versa</li>
                    <li>Leave white space around the QR code (quiet zone) equal to the width of one module</li>
                    <li>Test print quality before mass printing invitations</li>
                    <li>Consider printing size: larger codes are easier to scan from a distance</li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-xl p-8 border border-white/10 mb-6">
                  <h3 className="text-2xl font-light mb-4 text-white">Placement Tips</h3>
                  <ul className="list-disc list-inside space-y-2 text-white/80">
                    <li>Place QR codes prominently on invitations—not hidden in corners</li>
                    <li>Include brief instructions: "Scan to RSVP" or "Scan with your phone camera"</li>
                    <li>For venue display, position at eye level and ensure good lighting</li>
                    <li>Consider accessibility—place codes where guests can easily reach and scan</li>
                    <li>Provide the URL as backup for guests who can't scan</li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-xl p-8 border border-white/10">
                  <h3 className="text-2xl font-light mb-4 text-white">Design Considerations</h3>
                  <ul className="list-disc list-inside space-y-2 text-white/80">
                    <li>While QR codes are functional, ensure they don't clash with your invitation design</li>
                    <li>Consider adding a decorative border or frame around the QR code</li>
                    <li>Test scanning from different angles and distances</li>
                    <li>Ensure the QR code remains scannable even if printed in color</li>
                    <li>For formal events, consider subtle integration rather than prominent placement</li>
                  </ul>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-light mb-6 text-white">Use Cases for QR Code RSVPs</h2>
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-medium mb-3 text-white">Weddings</h3>
                    <p className="text-white/80">
                      Elegant printed invitations with QR codes allow guests to respond digitally. Perfect 
                      for couples who want traditional invitations with modern convenience.
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-medium mb-3 text-white">Corporate Events</h3>
                    <p className="text-white/80">
                      Professional event materials with QR codes streamline registration. Display at 
                      conference entrances, on name badges, or in event programs.
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-medium mb-3 text-white">Community Events</h3>
                    <p className="text-white/80">
                      Flyers, posters, and social media posts can include QR codes for instant RSVP. 
                      Makes it easy for community members to respond on the go.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-light mb-6 text-white">Frequently Asked Questions</h2>
                <FAQAccordion faqs={pageFAQs} />
              </section>

              <section className="text-center bg-white/5 rounded-2xl p-12 border border-white/10">
                <h2 className="text-3xl font-light mb-4 text-white">Start Using QR Code RSVPs Today</h2>
                <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                  Create your event and get an instant QR code. Print it on invitations, display it at your 
                  venue, or share it digitally. No technical knowledge required.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/create"
                    className="inline-block px-8 py-4 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-all text-lg"
                  >
                    Create QR Code RSVP
                  </Link>
                  <Link
                    href="/faq"
                    className="inline-block px-8 py-4 bg-white/10 border border-white/30 text-white font-medium rounded-lg hover:bg-white/20 transition-all text-lg"
                  >
                    Learn More
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
