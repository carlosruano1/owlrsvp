import type { Metadata } from "next";
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'
import FAQAccordion from '@/components/FAQAccordion'

export const metadata: Metadata = {
  title: "Build Your Event RSVP Website in Minutes | No Coding Required",
  description: "Create professional RSVP websites with custom branding and QR codes. Track responses in real-time. Perfect for conferences, weddings, and corporate events.",
  keywords: "event RSVP website, event registration website, online event RSVP, event management website",
  openGraph: {
    title: "Build Your Event RSVP Website in Minutes | No Coding Required",
    description: "Create professional RSVP websites with custom branding and QR codes. Track responses in real-time.",
    url: "https://owlrsvp.com/event-rsvp-website",
    siteName: "OwlRSVP",
    images: [{ url: "/images/owlrsvp-og.png", width: 1200, height: 630, alt: "Build Your Event RSVP Website" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Build Your Event RSVP Website in Minutes | No Coding Required",
    description: "Create professional RSVP websites with custom branding and QR codes. Track responses in real-time.",
  },
  alternates: {
    canonical: "https://owlrsvp.com/event-rsvp-website",
  },
};

const pageFAQs = [
  {
    question: "What is an event RSVP website?",
    answer: "An event RSVP website is a dedicated web page where guests can respond to event invitations online. It typically includes event details, a response form, and real-time tracking capabilities. Modern RSVP websites like OwlRSVP allow event organizers to create professional, branded pages in minutes without coding knowledge.",
    category: "getting-started" as const,
  },
  {
    question: "How do I create an event RSVP website?",
    answer: "Creating an event RSVP website with OwlRSVP is simple: visit our create page, enter your event information (title, date, description), customize colors and branding, and you'll instantly receive a shareable URL. The entire process takes under 60 seconds, and no technical skills are required.",
    category: "getting-started" as const,
  },
  {
    question: "Can I customize my event RSVP website?",
    answer: "Yes! OwlRSVP offers extensive customization options. On paid plans, you can upload your company logo, customize colors to match your brand identity, and create a fully branded experience. The free plan includes basic color customization, perfect for testing the platform.",
    category: "features" as const,
  },
  {
    question: "Do I need coding skills to create an event RSVP website?",
    answer: "No coding skills required! OwlRSVP is designed for non-technical users. If you can use email, you can create a professional event RSVP website. Our intuitive interface guides you through the process step-by-step, and you'll have a live RSVP page in under a minute.",
    category: "technical" as const,
  },
];

export default function EventRSVPWebsitePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Event RSVP Website',
            description: 'Build a professional event RSVP website in seconds with OwlRSVP',
            url: 'https://owlrsvp.com/event-rsvp-website',
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
                Create Your Event RSVP Website
              </h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
                Build a professional event RSVP website in seconds. Custom branding, QR codes, 
                real-time tracking, and seamless guest experience—all in one platform.
              </p>
              <Link
                href="/create"
                className="inline-block px-8 py-4 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-all shadow-xl text-lg"
              >
                Build Your RSVP Website
              </Link>
            </header>

            <div className="prose prose-invert max-w-none">
              <section className="mb-12">
                <h2 className="text-3xl font-light mb-6 text-white">What is an Event RSVP Website?</h2>
                <p className="text-lg text-white/80 leading-relaxed mb-4">
                  An event RSVP website is a dedicated web page designed specifically for collecting event 
                  responses from guests. Unlike generic forms or social media events, a professional RSVP 
                  website provides a branded, streamlined experience that reflects your event's identity and 
                  makes it easy for guests to respond.
                </p>
                <p className="text-lg text-white/80 leading-relaxed mb-4">
                  Modern event RSVP websites combine beautiful design with powerful functionality. They display 
                  your event details prominently, provide an intuitive response form, and automatically collect 
                  all responses in a centralized dashboard. The best platforms, like OwlRSVP, require no 
                  technical knowledge to create and maintain.
                </p>
                <p className="text-lg text-white/80 leading-relaxed">
                  Whether you're organizing a corporate conference, wedding, birthday party, or community gathering, 
                  an event RSVP website provides the professional touch and efficiency that paper invitations 
                  simply can't match. Guests can respond from any device, at any time, and you'll have instant 
                  visibility into your event's attendance.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-light mb-6 text-white">Essential Features for Event RSVP Websites</h2>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-medium mb-3 text-white">Custom Branding</h3>
                    <p className="text-white/80">
                      Upload your logo, match your brand colors, and create a cohesive experience that represents 
                      your organization or event theme. Professional branding builds trust and reinforces your 
                      event's identity.
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-medium mb-3 text-white">Mobile-Responsive Design</h3>
                    <p className="text-white/80">
                      Your RSVP website automatically adapts to any screen size. Whether guests respond from 
                      desktop, tablet, or smartphone, they'll have an optimal experience.
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-medium mb-3 text-white">Real-Time Tracking</h3>
                    <p className="text-white/80">
                      See responses as they come in with live updates to your guest count. No manual tracking, 
                      no spreadsheets—everything is automated and accessible from your admin dashboard.
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-medium mb-3 text-white">QR Code Integration</h3>
                    <p className="text-white/80">
                      Every event automatically generates a unique QR code. Print it on invitations, display it 
                      at your venue, or share it digitally. Guests scan and respond instantly.
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-medium mb-3 text-white">Data Export</h3>
                    <p className="text-white/80">
                      Download complete guest lists as CSV files for easy import into other tools, printing, 
                      or sharing with vendors. All data is exportable with one click.
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-medium mb-3 text-white">No Guest Signup Required</h3>
                    <p className="text-white/80">
                      Guests simply click your link and respond—no account creation, no app downloads, no 
                      friction. This maximizes response rates and improves guest satisfaction.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-light mb-6 text-white">Professional RSVP Websites vs Social Media Event Pages</h2>
                <p className="text-lg text-white/80 leading-relaxed mb-4">
                  While social media platforms offer event creation features, a dedicated event RSVP website 
                  provides significant advantages:
                </p>
                <ul className="list-disc list-inside space-y-3 mb-6 text-lg text-white/80">
                  <li><strong className="text-white">Professional Branding</strong> - Your event RSVP website reflects your brand, not a social media platform's design. This is especially important for corporate events, weddings, and formal gatherings.</li>
                  <li><strong className="text-white">Better Data Control</strong> - You own and control all guest data. Export it, analyze it, and use it however you need without platform limitations.</li>
                  <li><strong className="text-white">Universal Access</strong> - Not all guests use the same social media platforms. An RSVP website works for everyone, regardless of their preferred platforms.</li>
                  <li><strong className="text-white">Privacy</strong> - Keep your guest list private. Social media events are often visible to friends of friends, which may not be appropriate for all event types.</li>
                  <li><strong className="text-white">Advanced Features</strong> - Professional RSVP websites offer analytics, custom fields, plus-one management, and integration capabilities that social platforms don't provide.</li>
                  <li><strong className="text-white">No Algorithm Interference</strong> - Your RSVP website doesn't depend on social media algorithms. Every guest who receives the link can access it immediately.</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-light mb-6 text-white">Creating Your Event RSVP Website: Step-by-Step Guide</h2>
                <ol className="list-decimal list-inside space-y-6 mb-6 text-lg text-white/80">
                  <li>
                    <strong className="text-white">Choose Your Platform</strong> - Select a platform like OwlRSVP that offers 
                    ease of use, customization options, and the features you need. Look for no-code solutions that don't require 
                    technical expertise.
                  </li>
                  <li>
                    <strong className="text-white">Enter Event Details</strong> - Add your event title, date, time, location, 
                    and any important information guests need to know. Include dress code, parking instructions, or special 
                    requirements.
                  </li>
                  <li>
                    <strong className="text-white">Customize Your Design</strong> - Upload your logo, select brand colors, 
                    and personalize the page to match your event's aesthetic. Professional customization builds credibility and 
                    enhances the guest experience.
                  </li>
                  <li>
                    <strong className="text-white">Configure Settings</strong> - Enable plus-one options if needed, set response 
                    deadlines, and configure any special requirements. Most platforms offer flexible options to match your 
                    event's needs.
                  </li>
                  <li>
                    <strong className="text-white">Share and Track</strong> - Distribute your RSVP website link via email, 
                    text, social media, or print the QR code on invitations. Monitor responses in real-time through your admin 
                    dashboard.
                  </li>
                </ol>
                <p className="text-lg text-white/80 leading-relaxed">
                  The entire process typically takes under 5 minutes, and you can start collecting responses immediately. 
                  Unlike building a custom website, event RSVP platforms handle all the technical complexity for you.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-light mb-6 text-white">Best Practices for Event RSVP Websites</h2>
                <div className="bg-white/5 rounded-xl p-8 border border-white/10 mb-6">
                  <h3 className="text-2xl font-light mb-4 text-white">Design Tips</h3>
                  <ul className="list-disc list-inside space-y-2 text-white/80">
                    <li>Keep the design clean and uncluttered—focus on the RSVP form</li>
                    <li>Use high-contrast colors for readability on all devices</li>
                    <li>Ensure your logo is visible but doesn't overwhelm the page</li>
                    <li>Test on mobile devices—most guests will respond from phones</li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-xl p-8 border border-white/10 mb-6">
                  <h3 className="text-2xl font-light mb-4 text-white">Content Guidelines</h3>
                  <ul className="list-disc list-inside space-y-2 text-white/80">
                    <li>Include all essential event information upfront</li>
                    <li>Be clear about RSVP deadlines and requirements</li>
                    <li>Provide contact information for questions</li>
                    <li>Keep instructions simple and concise</li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-xl p-8 border border-white/10">
                  <h3 className="text-2xl font-light mb-4 text-white">Promotion Strategy</h3>
                  <ul className="list-disc list-inside space-y-2 text-white/80">
                    <li>Send the RSVP link via multiple channels (email, text, social)</li>
                    <li>Include the QR code on printed invitations</li>
                    <li>Send reminder messages as the deadline approaches</li>
                    <li>Make the link easy to share—guests often forward to others</li>
                  </ul>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-light mb-6 text-white">Frequently Asked Questions</h2>
                <FAQAccordion faqs={pageFAQs} />
              </section>

              <section className="text-center bg-white/5 rounded-2xl p-12 border border-white/10">
                <h2 className="text-3xl font-light mb-4 text-white">Start Building Your Event RSVP Website Today</h2>
                <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                  Create a professional event RSVP website in under 60 seconds. No coding required, 
                  no credit card needed to start. Join thousands of event organizers using OwlRSVP.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/create"
                    className="inline-block px-8 py-4 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-all text-lg"
                  >
                    Create Your RSVP Website
                  </Link>
                  <Link
                    href="/#pricing"
                    className="inline-block px-8 py-4 bg-white/10 border border-white/30 text-white font-medium rounded-lg hover:bg-white/20 transition-all text-lg"
                  >
                    View Pricing Plans
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
