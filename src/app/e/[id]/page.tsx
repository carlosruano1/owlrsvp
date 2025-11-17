'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Event } from '@/lib/types'
import CalendarIntegration from '@/components/CalendarIntegration'
import Footer from '@/components/Footer'
import PdfViewer from '@/components/PdfViewer'
import Watermark from '@/components/Watermark'
import DiscreteAd from '@/components/DiscreteAd'
import Image from 'next/image'
import { ThemeProvider, ThemeColors, useTheme } from '@/components/ThemeProvider'
import { formatDateLong, formatTime12h } from '@/lib/dateUtils'
 

// Use shared utils
const formatDateWithOriginalTimezone = (dateString: string | null | undefined): string => {
  return formatDateLong(dateString);
}

const formatTimeWithOriginalTimezone = (dateString: string | null | undefined): string => {
  return formatTime12h(dateString);
}

export default function EventRSVP() {
  return (
    <ThemeProvider>
      <EventRSVPContent />
    </ThemeProvider>
  );
}

function EventRSVPContent() {
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creatorTier, setCreatorTier] = useState<string>('free')
  const { colors, setColors } = useTheme()
  
  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [promoCodeError, setPromoCodeError] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [guestCount, setGuestCount] = useState(0)
  const [attending, setAttending] = useState<boolean | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Centralized title management to keep hooks order stable
  useEffect(() => {
    if (loading) {
      document.title = 'Loading Event | OwlRSVP';
      return;
    }
    if (error && !event) {
      document.title = 'Event Not Found | OwlRSVP';
      return;
    }
    if (submitted && event?.title) {
      document.title = `RSVP Confirmed - ${event.title} | OwlRSVP`;
      return;
    }
    if (event?.title) {
      document.title = `${event.title} | OwlRSVP`;
      return;
    }
    document.title = 'OwlRSVP Event';
  }, [loading, error, submitted, event?.title]);
  
  // We don't need this effect anymore as ThemeProvider handles colors

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        console.log('Fetching event with ID from URL:', eventId);
        const response = await fetch(`/api/events/${eventId}`)
        const data = await response.json()

        if (!response.ok) {
          console.error('Error fetching event:', data);
          throw new Error(data.error || 'Event not found')
        }

        console.log('Event data received:', data.event);
        console.log('Creator tier:', data.creatorTier || 'free');
        setEvent(data.event)
        // Track creator tier for watermark display - default to 'free' if not provided
        const tier = data.creatorTier || 'free'
        setCreatorTier(tier)
        console.log('Watermark will show:', tier === 'free')
        // Get colors from event data
        const themeColors: Partial<ThemeColors> = {
          primary: data.event.background_color || '#007AFF',
        };
        
        // Try to get additional colors if they exist
        try {
          if (data.event.page_background_color) {
            themeColors.bg = data.event.page_background_color;
          }
          
          if (data.event.spotlight_color) {
            themeColors.secondary = data.event.spotlight_color;
          }
          
          if (data.event.font_color) {
            themeColors.text = data.event.font_color;
          }
        } catch (e) {
          console.log('Could not load advanced color properties');
        }
        
        // Apply fetched colors to theme
        setColors({
          ...colors,
          ...themeColors,
        } as ThemeColors)
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

    // Validate required fields based on event settings
    if (event?.required_rsvp_fields?.email && !email.trim()) {
      setError('Email is required')
      return
    }
    if (event?.required_rsvp_fields?.phone && !phone.trim()) {
      setError('Phone number is required')
      return
    }
    if (event?.required_rsvp_fields?.address && !address.trim()) {
      setError('Address is required')
      return
    }
    if (event?.required_rsvp_fields?.guests && attending && guestCount === 0) {
      setError('Number of guests is required')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // Make sure we have the event object before submitting
      if (!event || !event.id) {
        throw new Error('Event information not available. Please refresh the page.')
      }
      
      // Debug event ID
      console.log('Submitting RSVP with event ID:', event.id);
      console.log('Event object:', event);
      
      // Create the request payload
      const payload = {
        event_id: event.id, // Use event.id instead of eventId from URL params
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        guest_count: attending ? guestCount : 0,
        attending,
        promo_code: promoCode.trim() || undefined
      };
      
      console.log('RSVP payload:', payload);
      
      // Try the new direct RSVP endpoint first
      const response = await fetch('/api/direct-rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle promo code validation errors specifically
        if (response.status === 403 && data.error && data.error.includes('promo code')) {
          setPromoCodeError(data.error);
          throw new Error('Invalid promo code. Please check and try again.');
        } else if (response.status === 403 && data.error && data.error.includes('guest list')) {
          throw new Error('You are not on the guest list for this event. Please contact the event organizer.');
        } else {
          throw new Error(data.error || 'Failed to submit RSVP')
        }
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      
      // Log the error for debugging
      console.error('RSVP submission error:', err);
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
            
            {attending && event && (
              <div className="mt-6">
                <CalendarIntegration
                  eventTitle={event.title || ''}
                  eventDate={event.event_date || undefined}
                  eventLocation={event.event_location || undefined}
                  eventDescription={`RSVP for ${event.title}${event.event_location ? ` at ${event.event_location}` : ''}`}
                  eventLink={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/e/${event.id}`}
                />
              </div>
            )}
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
      <div className={`relative z-10 min-h-screen flex items-center justify-center p-4 ${creatorTier === 'free' ? 'pb-24' : ''}`}>
        <div className="w-full max-w-xl">
          <div className="text-center mb-8">
            {/* Company block - Enhanced with larger logo and better styling */}
            <div className="flex flex-col items-center gap-6 mb-8">
              {event?.company_logo_url && (
                <div className="relative">
                  <div className="absolute inset-0 blur-xl opacity-30" style={{ 
                    backgroundImage: `url(${event.company_logo_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}></div>
                  <Image
                    src={event.company_logo_url}
                    alt={event.company_name ? `${event.company_name} logo` : 'Company logo'}
                    className="relative z-10 h-28 w-28 sm:h-32 sm:w-32 rounded-2xl object-contain bg-white/10 p-3 border border-white/20 backdrop-blur-sm shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                    width={128}
                    height={128}
                    unoptimized
                    priority
                  />
                </div>
              )}
              {event?.company_name && (
                <div className="text-3xl apple-title">{event.company_name}</div>
              )}
            </div>
            <div className="text-lg apple-subtitle mt-2">is inviting you to:</div>
            <h1 className="text-4xl md:text-5xl apple-title mt-3 mb-1">{event?.title}</h1>
            
            {/* Event date and time display */}
            {event?.event_date && (
              <div className="text-xl apple-subtitle mt-2">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDateWithOriginalTimezone(event.event_date)}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatTimeWithOriginalTimezone(event.event_date)}
                  </div>
                </div>
              </div>
            )}
            
            {/* Event location */}
            {event?.event_location && (
              <div className="text-lg apple-subtitle mt-3">
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{event.event_location}</span>
                </div>
              </div>
            )}
            
            {/* Information PDF for guests */}
            {event?.info_pdf_url && (
              <div className="mt-4 flex justify-center">
                <PdfViewer pdfUrl={event.info_pdf_url} />
              </div>
            )}

            {/* Contact Info (moved to bottom as a card) */}
          </div>

          <div className="glass-card rounded-3xl p-8 shadow-2xl text-white">
            {/* Promo Code Section - Only show when auth_mode is 'code' */}
            {event?.auth_mode === 'code' && (
              <div className={`mb-6 p-4 rounded-xl ${promoCodeError ? 'bg-red-900/20 border border-red-500/30' : 'bg-white/10 border border-white/20'}`}>
                <label htmlFor="promoCode" className="block text-sm font-medium text-white/80 mb-2">
                  Enter Promo Code
                </label>
                <input
                  type="text"
                  id="promoCode"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value);
                    setPromoCodeError(''); // Clear error when user types
                  }}
                  placeholder="Enter the event promo code"
                  className={`modern-input w-full px-4 py-3 ${promoCodeError ? 'border-red-500/50' : ''}`}
                  required={event?.auth_mode === 'code'}
                />
                {promoCodeError ? (
                  <p className="text-red-300 text-sm mt-2">
                    {promoCodeError}
                  </p>
                ) : (
                  <p className="text-white/60 text-xs mt-2">
                    This event requires a promo code to RSVP.
                  </p>
                )}
              </div>
            )}
            
            {/* Guest List Notice - Only show when auth_mode is 'guest_list' */}
            {event?.auth_mode === 'guest_list' && (
              <div className="mb-6 p-4 rounded-xl bg-blue-900/20 border border-blue-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <span className="text-sm font-medium text-blue-300">Guest List Event</span>
                </div>
                <p className="text-blue-200 text-sm">
                  This event is by invitation only. Only guests on the list can RSVP.
                </p>
              </div>
            )}
            
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

              {/* Email field - show if required or if event has required_rsvp_fields config */}
              {(event?.required_rsvp_fields?.email || !event?.required_rsvp_fields) && (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                    Email {event?.required_rsvp_fields?.email && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="modern-input w-full px-4 py-3"
                    placeholder="you@example.com"
                    required={event?.required_rsvp_fields?.email || false}
                  />
                </div>
              )}

              {/* Phone field - show only if required */}
              {event?.required_rsvp_fields?.phone && (
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-white/80 mb-2">
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="modern-input w-full px-4 py-3"
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
              )}

              {/* Address field - show only if required */}
              {event?.required_rsvp_fields?.address && (
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-white/80 mb-2">
                    Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="modern-input w-full px-4 py-3"
                    placeholder="123 Main St, City, State ZIP"
                    required
                  />
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-white/80 mb-4">Will you attend?</div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setAttending(true)}
                    className={`btn-choice btn-yes ${attending === true ? 'selected' : ''}`}
                    aria-pressed={attending === true}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttending(false)}
                    className={`btn-choice btn-no ${attending === false ? 'selected' : ''}`}
                    aria-pressed={attending === false}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Guests field - show if allow_plus_guests is true OR if required_rsvp_fields.guests is true */}
              {((event?.allow_plus_guests && attending) || (event?.required_rsvp_fields?.guests && attending)) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-white/80">
                      Guests {event?.required_rsvp_fields?.guests && <span className="text-red-400">*</span>}
                    </label>
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
                      onClick={() => setGuestCount(Math.min(149, guestCount + 1))} 
                      className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-white/60 text-xs mt-2">
                    Your total party is <strong className="text-white">{attending ? 1 + guestCount : 0}</strong> (includes you).
                    <br />
                    <span className="text-yellow-400">Maximum 150 attendees per event.</span>
                  </p>
                </div>
              )}

              {error && (
                <div className="text-red-200 text-sm bg-red-500/20 border border-red-400/30 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  submitting || 
                  !firstName.trim() || 
                  !lastName.trim() || 
                  attending === null ||
                  (event?.required_rsvp_fields?.email && !email.trim()) ||
                  (event?.required_rsvp_fields?.phone && !phone.trim()) ||
                  (event?.required_rsvp_fields?.address && !address.trim()) ||
                  (event?.required_rsvp_fields?.guests && attending && guestCount === 0)
                }
                className="modern-button w-full py-3 px-4 text-lg"
              >
                {submitting ? 'Submitting...' : 'Submit RSVP'}
              </button>
            </form>
            
            {/* Discrete ad for free tier events - placed after form */}
            <DiscreteAd show={creatorTier === 'free'} />
          </div>
        </div>
      </div>

      {/* Contact card pinned near the bottom */}
      {(event?.contact_name || event?.contact_email || event?.contact_phone) && (
        <div className="relative z-10 px-4 pb-6 mt-6">
          <div className="max-w-xl mx-auto">
            <div className="glass-card rounded-2xl p-5 text-white animate-slideUp">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white/80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 8l-9 6-9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white/60 mb-1">Questions? Contact</div>
                  <div className="space-y-2 text-sm">
                    {event?.contact_name && (
                      <div className="font-medium text-white">{event.contact_name}</div>
                    )}
                    {(event?.contact_email || event?.contact_phone) && (
                      <div className="flex flex-wrap items-center gap-2">
                        {event?.contact_email && (
                          <a href={`mailto:${event.contact_email}`} className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-white/80 hover:text-white hover:bg-white/15">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {event.contact_email}
                          </a>
                        )}
                        {event?.contact_phone && (
                          <a href={`tel:${event.contact_phone}`} className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-white/80 hover:text-white hover:bg-white/15">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M2.5 5A2.5 2.5 0 015 2.5h2A1.5 1.5 0 018.5 4v2a1.5 1.5 0 01-.879 1.364l-1.1.5a13 13 0 007.615 7.615l.5-1.1A1.5 1.5 0 0115 13.5h2A1.5 1.5 0 0118.5 15v2A2.5 2.5 0 0116 19.5C9.096 19.5 4.5 14.904 4.5 8A2.5 2.5 0 012.5 5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {event.contact_phone}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show watermark for free tier events */}
      {creatorTier === 'free' && <Watermark />}

      <Footer showDonate={false} />
    </div>
  )
}