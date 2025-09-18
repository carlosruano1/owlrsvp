'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Event } from '@/lib/types'
import Footer from '@/components/Footer'
import Image from 'next/image'

export default function EventRSVP() {
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [guestCount, setGuestCount] = useState(0)
  const [attending, setAttending] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Event not found')
        }

        setEvent(data.event)
        // Set company color for spotlight
        document.documentElement.style.setProperty('--company-color', data.event.background_color)
        document.documentElement.style.setProperty('--company-color-alpha', `${data.event.background_color}33`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event')
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchEvent()
    }
  }, [eventId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || attending === null) return

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim() || undefined,
          guest_count: attending ? guestCount : 0,
          attending
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit RSVP')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="animated-bg" />
        <div className="spotlight" />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="text-white/80 text-xl">Loading…</div>
        </div>
        <Footer showDonate={false} />
      </div>
    )
  }

  if (error && !event) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="animated-bg" />
        <div className="spotlight" />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-4">Event Not Found</div>
            <div className="text-white/70">This event link may be invalid or expired.</div>
          </div>
        </div>
        <Footer showDonate={false} />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="animated-bg" />
        <div className="spotlight" />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-md glass-card rounded-3xl p-8 shadow-2xl text-center text-white">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-semibold mb-2">RSVP Confirmed</h1>
            <p className="text-white/80 mb-4">Thank you for responding to <span className="font-medium">{event?.title}</span></p>
            <p className="text-white/70 text-sm">
              {attending ? 
                `You're attending${guestCount > 0 ? ` with ${guestCount} guest${guestCount > 1 ? 's' : ''}` : ''}!` :
                "Sorry you can't make it."
              }
            </p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="animated-bg" />
      <div className="spotlight" />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-xl">
          <div className="text-center mb-8 text-white text-glow">
            {/* Company block */}
            <div className="flex flex-col items-center gap-4 mb-6">
              {event?.company_logo_url && (
                <Image
                  src={event.company_logo_url}
                  alt={event.company_name ? `${event.company_name} logo` : 'Company logo'}
                  className="h-16 w-16 rounded-2xl object-contain bg-white/5 p-2 border border-white/10 backdrop-blur"
                  width={64}
                  height={64}
                  unoptimized
                />
              )}
              {event?.company_name && (
                <div className="text-2xl font-semibold tracking-tight">{event.company_name}</div>
              )}
            </div>
            <div className="text-white/70 text-lg">is inviting you to:</div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mt-2">{event?.title}</h1>
          </div>

          <div className="glass-card rounded-3xl p-8 shadow-2xl text-white">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-white/80 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="modern-input w-full px-4 py-3"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-white/80 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="modern-input w-full px-4 py-3"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="modern-input w-full px-4 py-3"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="text-sm font-medium text-white/80 mb-4">Will you attend?</div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setAttending(true)}
                    className={`py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-300 border ${
                      attending === true
                        ? 'bg-white text-black border-white/0'
                        : 'bg-white/10 text-white border-white/20 hover:bg-white/15'
                    }`}
                  >
                    ✅ Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttending(false)}
                    className={`py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-300 border ${
                      attending === false
                        ? 'bg-white text-black border-white/0'
                        : 'bg-white/10 text-white border-white/20 hover:bg-white/15'
                    }`}
                  >
                    ❌ No
                  </button>
                </div>
              </div>

              {event?.allow_plus_guests && attending && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-white/80">Guests</label>
                    <span className="text-white/70 text-sm">Me + {guestCount} {guestCount === 1 ? 'guest' : 'guests'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      type="button" 
                      onClick={() => setGuestCount(Math.max(0, guestCount - 1))} 
                      className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300"
                    >
                      -
                    </button>
                    <div className="px-5 py-2 rounded-xl bg-white text-black font-semibold">{guestCount}</div>
                    <button 
                      type="button" 
                      onClick={() => setGuestCount(Math.min(5, guestCount + 1))} 
                      className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-white/60 text-xs mt-2">Your total party is <strong className="text-white">{attending ? 1 + guestCount : 0}</strong> (includes you).</p>
                </div>
              )}

              {error && (
                <div className="text-red-200 text-sm bg-red-500/20 border border-red-400/30 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !firstName.trim() || !lastName.trim() || attending === null}
                className="modern-button w-full py-3 px-4 text-lg"
              >
                {submitting ? 'Submitting...' : 'Submit RSVP'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <Footer showDonate={false} />
    </div>
  )
}