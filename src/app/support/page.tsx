'use client'

import { useState } from 'react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'

const faqs = [
  {
    question: 'How do I share an RSVP link?',
    answer:
      'Create an event, copy the event link, and text or email it to guests. They can RSVP instantly without logging in.'
  },
  {
    question: 'Can guests bring plus-ones?',
    answer:
      'Yep! Turn on “Allow plus guests” when editing your event. Guests will see an extra field to note how many people they are bringing.'
  },
  {
    question: 'Do I need a Stripe account to charge?',
    answer:
      'No. OwlRSVP handles payments using our Stripe setup. Just pick a plan, and we’ll bill the card on file each month.'
  },
  {
    question: 'What if I need custom branding?',
    answer:
      'Email carlos@owlrsvp.com with your logo, brand colors, and fonts. We’ll apply them to your upcoming event pages in 24 hours.'
  }
]

export default function SupportPage() {
  const [openIndex, setOpenIndex] = useState(0)

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? -1 : index))
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Navigation />

      <main className="flex-1 px-6 py-24">
        <section className="max-w-4xl mx-auto space-y-10">
          <header className="text-center space-y-4">
            <p className="text-blue-300 uppercase tracking-[0.3em] text-xs">Support</p>
            <h1 className="text-4xl md:text-5xl font-bold">We’re here when you need us</h1>
            <p className="text-white/70">
              Email, FAQ, or quick tips—pick what helps you ship your event fastest.
            </p>
          </header>

          <div className="grid md:grid-cols-3 gap-6 justify-items-center">
            <div className="w-full md:col-span-2 rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
              <p className="text-sm text-white/70">Need a human?</p>
              <a
                href="mailto:carlos@owlrsvp.com"
                className="text-2xl font-semibold text-blue-300 hover:text-blue-200 transition-colors break-words"
              >
                carlos@owlrsvp.com
              </a>
              <p className="text-sm text-white/60">Typical response time: under 24 hours.</p>
              <Link
                href="https://cal.com/carlosruano/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
              >
                Book a 30-min call
              </Link>
            </div>

            <div className="w-full rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
              <p className="text-sm uppercase tracking-wide text-white/60">Quick links</p>
              <ul className="space-y-3 text-sm text-white/80">
                <li>
                  <Link href="/contact" className="text-blue-300 hover:text-blue-200">
                    Contact page
                  </Link>
                </li>
                <li>
                  <Link href="/#pricing" className="text-blue-300 hover:text-blue-200">
                    Pricing plans
                  </Link>
                </li>
                <li>
                  <Link href="/create" className="text-blue-300 hover:text-blue-200">
                    Create an event
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <h2 className="text-2xl font-semibold mb-4">FAQ</h2>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <article key={faq.question} className="rounded-xl bg-black/20">
                  <button
                    type="button"
                    onClick={() => toggle(index)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="font-medium">{faq.question}</span>
                    <span className="text-blue-300">{openIndex === index ? '–' : '+'}</span>
                  </button>
                  {openIndex === index && (
                    <p className="px-5 pb-4 text-white/70 text-sm leading-relaxed">{faq.answer}</p>
                  )}
                </article>
              ))}
            </div>
          </section>
        </section>
      </main>

      <Footer />
    </div>
  )
}

