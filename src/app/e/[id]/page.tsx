'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Event } from '@/lib/types'
import CalendarIntegration from '@/components/CalendarIntegration'
import Footer from '@/components/Footer'
import PdfViewer from '@/components/PdfViewer'
import Watermark from '@/components/Watermark'
import DiscreteAd from '@/components/DiscreteAd'
import LocationMapLink from '@/components/LocationMapLink'
import Image from 'next/image'
import { ThemeProvider, ThemeColors, useTheme } from '@/components/ThemeProvider'
import { formatDateLong, formatTime12h, parseDateTimeLocal } from '@/lib/dateUtils'
 

// Use shared utils
const formatDateWithOriginalTimezone = (dateString: string | null | undefined): string => {
  return formatDateLong(dateString);
}

const formatTimeWithOriginalTimezone = (dateString: string | null | undefined): string => {
  return formatTime12h(dateString);
}

// Check if two dates are on the same day
const isSameDay = (date1: string | null | undefined, date2: string | null | undefined): boolean => {
  if (!date1 || !date2) return false;
  const parsed1 = parseDateTimeLocal(date1);
  const parsed2 = parseDateTimeLocal(date2);
  if (!parsed1 || !parsed2) return false;
  return parsed1.year === parsed2.year && 
         parsed1.month === parsed2.month && 
         parsed1.day === parsed2.day;
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
  const [creatorTier, setCreatorTier] = useState<string | null>(null)
  const { colors, setColors } = useTheme()
  
  // Tier detection - only show ads/watermark for FREE tier
  // Hide ads/watermark for BASIC, PRO, ENTERPRISE, and any unknown/null tiers
  const normalizedTier = creatorTier ? creatorTier.toLowerCase().trim() : null
  const isFreeTier = normalizedTier === 'free'
  
  // Debug: Log tier changes
  useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('[Event Page] TIER STATE UPDATE:')
    console.log('  creatorTier:', creatorTier)
    console.log('  normalizedTier:', normalizedTier)
    console.log('  isFreeTier:', isFreeTier)
    console.log('  Will show ads/watermark:', isFreeTier)
    if (isFreeTier) {
      console.log('  ℹ️ FREE TIER - Ads and watermark SHOWN')
    } else {
      console.log('  ✅ PAID OR UNKNOWN TIER - Ads and watermark HIDDEN')
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  }, [creatorTier, normalizedTier, isFreeTier])
  
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
    if (!eventId) return
    
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

        // Check for payment success/cancellation in URL params
        const urlParams = new URLSearchParams(window.location.search)
        const fetchedEventId = data.event?.id
        if (urlParams.get('payment_success') === 'true' && fetchedEventId) {
          // Payment successful - restore form data and auto-submit RSVP
          const savedData = sessionStorage.getItem(`rsvp_${fetchedEventId}`)
          if (savedData) {
            try {
              const formData = JSON.parse(savedData)
              // Restore form fields
              setFirstName(formData.firstName || '')
              setLastName(formData.lastName || '')
              setEmail(formData.email || '')
              setPhone(formData.phone || '')
              setAddress(formData.address || '')
              setGuestCount(formData.guestCount || 0)
              setAttending(true)
              
              // Auto-submit RSVP
              const payload = {
                event_id: fetchedEventId,
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email || undefined,
                phone: formData.phone || undefined,
                address: formData.address || undefined,
                guest_count: formData.guestCount || 0,
                attending: true,
              }
              
              fetch('/api/direct-rsvp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              }).then(() => {
                sessionStorage.removeItem(`rsvp_${fetchedEventId}`)
                setSubmitted(true)
              }).catch((err) => {
                console.error('RSVP submission failed:', err)
                // Still show success since payment worked, but log error
                sessionStorage.removeItem(`rsvp_${fetchedEventId}`)
                setSubmitted(true)
              })
            } catch (err) {
              console.error('Error restoring form data:', err)
              setSubmitted(true)
            }
          } else {
            setSubmitted(true)
          }
          // Clean up URL
          window.history.replaceState({}, '', window.location.pathname)
        } else if (urlParams.get('payment_cancelled') === 'true' && fetchedEventId) {
          // Restore form data on cancellation
          const savedData = sessionStorage.getItem(`rsvp_${fetchedEventId}`)
          if (savedData) {
            try {
              const formData = JSON.parse(savedData)
              setFirstName(formData.firstName || '')
              setLastName(formData.lastName || '')
              setEmail(formData.email || '')
              setPhone(formData.phone || '')
              setAddress(formData.address || '')
              setGuestCount(formData.guestCount || 0)
              setAttending(true)
              sessionStorage.removeItem(`rsvp_${fetchedEventId}`)
            } catch (err) {
              console.error('Error restoring form data:', err)
            }
          }
          setError('Payment was cancelled. You can try again below.')
          // Clean up URL
          window.history.replaceState({}, '', window.location.pathname)
        }
        // Track creator tier for watermark display
        const tier = data.creatorTier ? String(data.creatorTier).toLowerCase().trim() : null
        setCreatorTier(tier)

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('[Event Page] TIER DETECTION:')
        console.log('  Raw tier from API:', data.creatorTier)
        console.log('  Normalized tier:', tier)
        console.log('  Will show ads/watermark?', tier === 'free')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        if (tier === 'free') {
          console.log('ℹ️ [Event Page] FREE TIER - Ads and watermark will be shown')
        } else {
          console.log('✅ [Event Page] PAID/UNKNOWN TIER:', tier || 'null', '- Ads and watermark WILL BE HIDDEN')
        }
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

    fetchEvent()
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
      
      // Check if payment is required and user is attending
      if (event.payment_required && event.ticket_price && attending) {
        // Email is required for payment
        if (!email.trim()) {
          setError('Email is required for ticket purchase')
          setSubmitting(false)
          return
        }

        // Save form data to sessionStorage before redirecting
        sessionStorage.setItem(`rsvp_${event.id}`, JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          guestCount: attending ? guestCount : 0,
          attending: true,
        }))

        const totalTickets = 1 + guestCount
        try {
          const checkoutResponse = await fetch(`/api/events/${event.id}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              attendeeName: `${firstName.trim()} ${lastName.trim()}`,
              attendeeEmail: email.trim(),
              quantity: totalTickets,
            }),
          })

          const checkoutData = await checkoutResponse.json()
          
          if (checkoutResponse.ok && checkoutData.url) {
            // Redirect to Stripe Checkout
            window.location.href = checkoutData.url
            return // Don't submit RSVP yet, wait for payment success
          } else {
            throw new Error(checkoutData.error || 'Payment setup failed')
          }
        } catch (paymentErr) {
          setError(paymentErr instanceof Error ? paymentErr.message : 'Payment error occurred')
          setSubmitting(false)
          return
        }
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
            <h1 className="text-2xl font-light mb-2">RSVP Confirmed</h1>
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
                  eventEndTime={event.event_end_time || undefined}
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

  // Helper function to convert hex/rgb to rgba
  const colorToRgba = (color: string, alpha: number): string => {
    if (!color) return `rgba(0, 200, 216, ${alpha})` // Default cyan fallback
    
    // If already rgba/rgb, extract and replace alpha
    if (color.startsWith('rgba')) {
      // Match the alpha value (number with optional decimal) before the closing paren
      return color.replace(/,\s*[\d.]+\)$/g, `, ${alpha})`)
    }
    if (color.startsWith('rgb')) {
      return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`)
    }
    
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1)
      // Handle 3-digit hex
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16)
        const g = parseInt(hex[1] + hex[1], 16)
        const b = parseInt(hex[2] + hex[2], 16)
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
      }
      // Handle 6-digit hex
      if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16)
        const g = parseInt(hex.slice(2, 4), 16)
        const b = parseInt(hex.slice(4, 6), 16)
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
      }
    }
    
    // Fallback
    return `rgba(0, 200, 216, ${alpha})`
  }

  // Get background style using event's custom colors
  const getBackgroundStyle = () => {
    const bgColor = colors.bg || '#0a1929'
    const primaryColor = colors.primary || '#00c8d8'
    const secondaryColor = colors.secondary || colors.primary || primaryColor
    
    return {
      background: bgColor,
      backgroundImage: `
        radial-gradient(ellipse 80% 50% at 20% 20%, ${colorToRgba(primaryColor, 0.4)} 0%, transparent 50%),
        radial-gradient(ellipse 80% 50% at 80% 30%, ${colorToRgba(secondaryColor, 0.35)} 0%, transparent 50%),
        radial-gradient(ellipse 60% 40% at 50% 80%, ${colorToRgba(primaryColor, 0.3)} 0%, transparent 60%)
      `,
      backgroundSize: '100% 100%',
      filter: 'blur(60px)',
      opacity: 0.9,
    }
  }

  const getGlowStyle = () => {
    const primaryColor = colors.primary || '#00c8d8'
    const secondaryColor = colors.secondary || colors.primary || primaryColor
    
    return {
      backgroundImage: `
        radial-gradient(circle 40vmax at 15% 25%, ${colorToRgba(primaryColor, 0.15)} 0%, transparent 50%),
        radial-gradient(circle 35vmax at 85% 30%, ${colorToRgba(secondaryColor, 0.12)} 0%, transparent 50%),
        radial-gradient(circle 30vmax at 50% 75%, ${colorToRgba(primaryColor, 0.1)} 0%, transparent 60%)
      `,
      filter: 'blur(80px)',
      opacity: 0.6,
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic blurry background using event's custom colors */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          ...getBackgroundStyle(),
          animation: 'bind8-breathe 20s ease-in-out infinite',
        }}
      />
      <div 
        className="absolute inset-0 z-1"
        style={{
          ...getGlowStyle(),
          animation: 'bind8-glow-move 25s ease-in-out infinite',
          mixBlendMode: 'screen',
        }}
      />
      <div className={`relative z-10 min-h-screen flex items-center justify-center p-4 ${isFreeTier ? 'pb-24' : ''}`}>
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
                {event?.event_end_time && isSameDay(event.event_date, event.event_end_time) ? (
                  // Same day: show date once, then start and end times
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDateWithOriginalTimezone(event.event_date)}
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-white/90">Start:</span>
                        <span className="ml-1">{formatTimeWithOriginalTimezone(event.event_date)}</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-white/90">End:</span>
                        <span className="ml-1">{formatTimeWithOriginalTimezone(event.event_end_time)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Different days or no end time: show full date/time for each
                  <div className="flex flex-col items-center justify-center gap-2">
                    {/* Start Date & Time */}
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
                        <span className="text-white/90">Start:</span>
                        <span className="ml-1">{formatTimeWithOriginalTimezone(event.event_date)}</span>
                      </div>
                    </div>
                    {/* End Date & Time */}
                    {event?.event_end_time && (
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDateWithOriginalTimezone(event.event_end_time)}
                        </div>
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-white/90">End:</span>
                          <span className="ml-1">{formatTimeWithOriginalTimezone(event.event_end_time)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Event location */}
            {event?.event_location && (
              <div className="text-lg apple-subtitle mt-3">
                <LocationMapLink
                  location={event.event_location}
                  locationLink={event.event_location_link || undefined}
                />
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

              {/* Email field - only show if organizer has enabled it in settings */}
              {event?.required_rsvp_fields?.email && (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="modern-input w-full px-4 py-3"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              )}

              {/* Phone field - only show for basic+ tier accounts */}
              {!isFreeTier && event?.required_rsvp_fields?.phone && (
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

              {/* Address field - only show for basic+ tier accounts */}
              {!isFreeTier && event?.required_rsvp_fields?.address && (
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

              {/* Guests field - only show for basic+ tier accounts, and if allow_plus_guests is true OR if required_rsvp_fields.guests is true */}
              {!isFreeTier && ((event?.allow_plus_guests && attending) || (event?.required_rsvp_fields?.guests && attending)) && (
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
                    <div className="px-5 py-2 rounded-xl bg-white text-black font-medium">{guestCount}</div>
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
            
            {/* Discrete ad ONLY for free tier events - completely hidden for paid accounts */}
            {isFreeTier && <DiscreteAd show={true} />}
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

      {/* Show watermark ONLY for free tier events - completely hidden for paid accounts */}
      {isFreeTier && <Watermark />}

      <Footer showDonate={false} />
    </div>
  )
}