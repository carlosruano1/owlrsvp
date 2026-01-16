import type { Metadata } from "next";
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: "Blog - Event Management & RSVP Tips | OwlRSVP",
  description: "Expert guides on event management, RSVP best practices, digital invitations, and event planning. Learn how to create better events.",
  alternates: {
    canonical: "https://owlrsvp.com/blog",
  },
};

const blogPosts = [
  {
    slug: 'how-to-create-rsvp-website',
    title: 'How to Create an RSVP Website for Any Event',
    excerpt: 'A comprehensive guide to building professional RSVP websites. Learn step-by-step how to create, customize, and optimize your event RSVP pages for maximum response rates.',
    date: '2024-01-15',
    readTime: '12 min read',
    category: 'Guides',
  },
  {
    slug: 'rsvp-etiquette-digital-vs-paper',
    title: 'RSVP Etiquette: Digital vs Paper Invitations',
    excerpt: 'Explore the pros and cons of digital and paper invitations. Learn modern RSVP etiquette, when to use each method, and how to combine them for the best results.',
    date: '2024-01-10',
    readTime: '10 min read',
    category: 'Best Practices',
  },
  {
    slug: 'qr-code-rsvps-benefits-setup-examples',
    title: 'QR Code RSVPs: Benefits, Setup, and Examples',
    excerpt: 'Discover how QR code RSVPs work, why they\'re becoming essential for modern events, and step-by-step instructions for implementing them in your event planning.',
    date: '2024-01-05',
    readTime: '8 min read',
    category: 'Features',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navigation />
      
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-light mb-6 text-white">
              Event Management Blog
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Expert guides, tips, and best practices for creating better events, managing RSVPs, 
              and planning successful gatherings of any size.
            </p>
          </header>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {blogPosts.map((post) => (
              <article key={post.slug} className="bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all">
                <Link href={`/blog/${post.slug}`}>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs uppercase tracking-wide text-cyan-400">{post.category}</span>
                      <span className="text-white/40">•</span>
                      <span className="text-sm text-white/60">{post.readTime}</span>
                    </div>
                    <h2 className="text-2xl font-light mb-3 text-white hover:text-cyan-300 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-white/70 mb-4 leading-relaxed">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <time className="text-sm text-white/60" dateTime={post.date}>
                        {new Date(post.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </time>
                      <span className="text-cyan-400 text-sm font-medium">
                        Read more →
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          <section className="text-center bg-white/5 rounded-2xl p-12 border border-white/10">
            <h2 className="text-3xl font-light mb-4 text-white">Ready to Create Your RSVP Website?</h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Put these tips into practice. Create your first event RSVP page in under 60 seconds.
            </p>
            <Link
              href="/create"
              className="inline-block px-8 py-4 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-all text-lg"
            >
              Create Your Event
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
