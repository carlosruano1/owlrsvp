'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Footer from '@/components/Footer'
import Navigation from '@/components/Navigation'

const EMAIL = 'carlos@owlrsvp.com'

function ContactContent() {
  const searchParams = useSearchParams()
  const subject = searchParams?.get('subject') || ''
  const mailto = subject
    ? `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}`
    : `mailto:${EMAIL}`

  return (
    <main className="flex-1 px-6 py-24">
      <section className="max-w-4xl mx-auto space-y-10">
        <header className="text-center space-y-4">
          <p className="text-blue-300 uppercase tracking-[0.3em] text-xs">
            Contact
          </p>
          <h1 className="text-4xl md:text-5xl font-bold">
            Let&apos;s talk about your next event
          </h1>
          <p className="text-white/70">
            Reach out for help, feature ideas, or enterprise pricing. Carlos reads every email personally.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
          <div className="w-full md:col-span-2 rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
            <p className="text-sm text-white/70">Email Carlos</p>
            <a
              href={mailto}
              className="text-2xl font-semibold text-blue-300 hover:text-blue-200 transition-colors break-words"
            >
              {EMAIL}
            </a>
            {subject && (
              <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-4 text-sm text-blue-100">
                <p className="font-semibold text-white">Subject preview</p>
                <p className="mt-1 break-words">{subject}</p>
              </div>
            )}
            <p className="text-sm text-white/60">
              Typical response time: under 24 hours on weekdays.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={mailto}
                className="flex-1 inline-flex items-center justify-center px-5 py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors text-center"
              >
                Write an email
              </a>
              <a
                href="https://cal.com/carlosruano/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center px-5 py-3 rounded-lg border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors text-center"
              >
                Book a 30‑min call
              </a>
            </div>
          </div>

          <div className="w-full rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
            <p className="text-sm uppercase tracking-wide text-white/60">
              Need ideas?
            </p>
            <ul className="space-y-3 text-sm text-white/80">
              <li>• Event setup questions</li>
              <li>• Feature or integration requests</li>
              <li>• Enterprise or agency plans</li>
              <li>• Support for a live event</li>
            </ul>
          </div>
        </div>

        <div className="text-center text-sm text-white/60">
          Prefer to talk? Include your phone number in the email and Carlos will call you back.
        </div>
      </section>
    </main>
  )
}

export default function Contact() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Navigation />
      <Suspense fallback={
        <main className="flex-1 px-6 py-24">
          <div className="max-w-4xl mx-auto text-center text-white/60">Loading...</div>
        </main>
      }>
        <ContactContent />
      </Suspense>
      <Footer />
    </div>
  )
}
