'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { Event } from '@/lib/types'
import AdminLoadingScreen from '@/components/AdminLoadingScreen'
import Footer from '@/components/Footer'
import { TokenAdminNav } from '@/components/TokenAdminNav'
import EventColorPicker from '@/components/EventColorPicker'
import { ThemeProvider, useTheme } from '@/components/ThemeProvider'

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}`
}

// Inner component that uses theme context
function TokenAdminSettingsContent() {
  const params = useParams()
  const adminToken = params.token as string
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [creatorTier, setCreatorTier] = useState<string>('free')

  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [authMode, setAuthMode] = useState<'open' | 'code' | 'guest_list'>('open')
  const [promoCode, setPromoCode] = useState('')
  const [backgroundColor, setBackgroundColor] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyLogoUrl, setCompanyLogoUrl] = useState('')
  const [requiredRsvpFields, setRequiredRsvpFields] = useState({
    email: false,
    phone: false,
    address: false,
    guests: false
  })
  const [themeStyle, setThemeStyle] = useState<'default' | 'glass' | 'electric' | 'drawing' | 'elegant'>('default')

  // Ticketing fields (Pro only)
  const [paymentRequired, setPaymentRequired] = useState(false)
  const [ticketPrice, setTicketPrice] = useState('')
  const [currency, setCurrency] = useState('usd')

  const { colors, setColors } = useTheme()

  // Sync theme from event when event loads (so color picker shows saved Supabase colors)
  useEffect(() => {
    if (!event) return
    setColors({
      bg: event.page_background_color || event.background_color || '#0f172a',
      text: event.font_color || '#ffffff',
      primary: event.background_color || '#007AFF',
      secondary: event.spotlight_color || event.background_color || '#007AFF'
    })
  }, [event?.id])

  // Enforce email requirement when ticketing is enabled
  useEffect(() => {
    if (paymentRequired) {
      setRequiredRsvpFields(prev => ({ ...prev, email: true }))
    }
  }, [paymentRequired])

  useEffect(() => {
    if (!adminToken) {
      setLoading(false)
      setError('Invalid link')
      return
    }
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/admin/${adminToken}/event`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load')
        const e = json.event as Event
        setEvent(e)
        setTitle(e.title || '')
        setEventDate(toDatetimeLocal(e.event_date))
        setEventEndTime(toDatetimeLocal(e.event_end_time))
        setEventLocation(e.event_location || '')
        setContactName(e.contact_name || '')
        setContactEmail(e.contact_email || '')
        setContactPhone(e.contact_phone || '')
        setAuthMode((e.auth_mode as 'open' | 'code' | 'guest_list') || 'open')
        setPromoCode(e.promo_code || '')
        setBackgroundColor(e.background_color || '#0f172a')
        setCompanyName(e.company_name || '')
        setCompanyLogoUrl(e.company_logo_url || '')
        setRequiredRsvpFields({
          email: !!e.required_rsvp_fields?.email,
          phone: !!e.required_rsvp_fields?.phone,
          address: !!e.required_rsvp_fields?.address,
          guests: !!e.required_rsvp_fields?.guests
        })
        setThemeStyle(
          e.theme_style && ['default', 'glass', 'electric', 'drawing', 'elegant'].includes(e.theme_style)
            ? (e.theme_style as 'default' | 'glass' | 'electric' | 'drawing' | 'elegant')
            : 'default'
        )

        // Load ticketing settings
        setPaymentRequired(!!e.payment_required)
        setTicketPrice(e.ticket_price ? e.ticket_price.toString() : '')
        setCurrency(e.currency || 'usd')

        // Fetch creator's tier for color picker permissions
        try {
          const tierRes = await fetch('/api/auth/me')
          if (tierRes.ok) {
            const tierData = await tierRes.json()
            setCreatorTier(tierData.user?.subscription_tier || 'free')
          }
        } catch (tierErr) {
          console.log('Could not fetch creator tier, using free as default')
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load event')
      } finally {
        setLoading(false)
      }
    }
    fetchEvent()
  }, [adminToken])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminToken) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        event_date: eventDate || null,
        event_end_time: eventEndTime || null,
        event_location: eventLocation.trim() || null,
        contact_name: contactName.trim() || null,
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
        auth_mode: authMode,
        promo_code: promoCode.trim() || null,
        background_color: colors.primary || backgroundColor || undefined,
        page_background_color: colors.bg || undefined,
        spotlight_color: colors.secondary || undefined,
        font_color: colors.text || undefined,
        theme_style: themeStyle,
        company_name: companyName.trim() || null,
        company_logo_url: companyLogoUrl.trim() || null,
        required_rsvp_fields: requiredRsvpFields.email || requiredRsvpFields.phone || requiredRsvpFields.address || requiredRsvpFields.guests
          ? {
              email: requiredRsvpFields.email,
              phone: requiredRsvpFields.phone,
              address: requiredRsvpFields.address,
              guests: requiredRsvpFields.guests
            }
          : null,
        payment_required: paymentRequired,
        ticket_price: paymentRequired && ticketPrice ? parseFloat(ticketPrice) : null,
        currency: paymentRequired ? currency : 'usd'
      }
      const res = await fetch(`/api/admin/${adminToken}/event`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Failed to save')
      }
      setEvent(json.event)
      setSuccess('Settings saved.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminLoadingScreen />
  if (error && !event) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="text-red-400 text-xl mb-4">Access Denied</div>
            <div className="text-white/70 mb-4">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 min-h-screen p-4 sm:p-8 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="text-white">
              <h1 className="text-3xl font-light mb-1">{event?.title || 'Event'}</h1>
              <p className="text-white/70 text-sm">Event settings</p>
            </div>
            <TokenAdminNav token={adminToken} current="settings" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-100 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/20 border border-green-500/30 text-green-100 px-4 py-3 rounded-xl text-sm">
                {success}
              </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6 text-white">
              <h2 className="text-lg font-medium text-white/90 border-b border-white/10 pb-2">Details</h2>
              <div>
                <label className="block text-sm text-white/70 mb-1">Event title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1">Start date & time</label>
                  <input
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">End date & time</label>
                  <input
                    type="datetime-local"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    min={eventDate || undefined}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Location (display name)</label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="e.g. Downtown Venue"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6 text-white">
              <h2 className="text-lg font-medium text-white/90 border-b border-white/10 pb-2">Contact</h2>
              <div>
                <label className="block text-sm text-white/70 mb-1">Contact name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Contact email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Contact phone</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6 text-white">
              <h2 className="text-lg font-medium text-white/90 border-b border-white/10 pb-2">Access</h2>
              <div>
                <label className="block text-sm text-white/70 mb-1">Who can RSVP</label>
                <select
                  value={authMode}
                  onChange={(e) => setAuthMode(e.target.value as 'open' | 'code' | 'guest_list')}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white"
                >
                  <option value="open">Anyone (open)</option>
                  <option value="code">Anyone with code</option>
                  <option value="guest_list">Invite-only (guest list)</option>
                </select>
              </div>
              {authMode === 'code' && (
                <div>
                  <label className="block text-sm text-white/70 mb-1">Promo / access code</label>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="e.g. PARTY2025"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                  />
                </div>
              )}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6 text-white">
              <h2 className="text-lg font-medium text-white/90 border-b border-white/10 pb-2">Required RSVP Fields</h2>
              <p className="text-white/60 text-sm">
                Choose which information attendees must provide when RSVPing. Name and last name are always required.
                {paymentRequired && (
                  <span className="text-cyan-400 block mt-1">
                    Email is automatically required when ticketing is enabled.
                  </span>
                )}
              </p>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiredRsvpFields.email}
                    disabled={paymentRequired}
                    onChange={(e) => !paymentRequired && setRequiredRsvpFields((f) => ({ ...f, email: e.target.checked }))}
                    className="rounded border-white/20 text-cyan-500 focus:ring-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-white/90">
                    Email Address
                    {paymentRequired && (
                      <span className="text-cyan-400 text-xs ml-2">(Required for ticketing)</span>
                    )}
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiredRsvpFields.phone}
                    onChange={(e) => setRequiredRsvpFields((f) => ({ ...f, phone: e.target.checked }))}
                    className="rounded border-white/20 text-cyan-500 focus:ring-cyan-500/50"
                  />
                  <span className="text-white/90">Phone Number</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiredRsvpFields.address}
                    onChange={(e) => setRequiredRsvpFields((f) => ({ ...f, address: e.target.checked }))}
                    className="rounded border-white/20 text-cyan-500 focus:ring-cyan-500/50"
                  />
                  <span className="text-white/90">Address</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiredRsvpFields.guests}
                    onChange={(e) => setRequiredRsvpFields((f) => ({ ...f, guests: e.target.checked }))}
                    className="rounded border-white/20 text-cyan-500 focus:ring-cyan-500/50"
                  />
                  <span className="text-white/90">Number of Guests</span>
                </label>
              </div>
            </div>

            {/* Ticketing Section - Pro only */}
            {(creatorTier === 'pro' || creatorTier === 'enterprise' || creatorTier === 'team') && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6 text-white">
                <h2 className="text-lg font-medium text-white/90 border-b border-white/10 pb-2">Ticketing</h2>
                <p className="text-white/60 text-sm">
                  Charge attendees for tickets and provide QR code check-in. Requires Stripe Connect setup.
                </p>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentRequired}
                      onChange={(e) => setPaymentRequired(e.target.checked)}
                      className="rounded border-white/20 text-cyan-500 focus:ring-cyan-500/50"
                    />
                    <span className="text-white/90">Require payment for tickets</span>
                  </label>

                  {paymentRequired && (
                    <div className="ml-6 space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-white/70 mb-1">Ticket Price</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={ticketPrice}
                              onChange={(e) => setTicketPrice(e.target.value)}
                              placeholder="25.00"
                              className="w-full pl-8 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                              required={paymentRequired}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-white/70 mb-1">Currency</label>
                          <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white"
                            required={paymentRequired}
                          >
                            <option value="usd">USD ($)</option>
                            <option value="eur">EUR (€)</option>
                            <option value="gbp">GBP (£)</option>
                            <option value="cad">CAD (C$)</option>
                            <option value="aud">AUD (A$)</option>
                          </select>
                        </div>
                      </div>

                      <div className="text-sm text-white/60">
                        <p>• Attendees will be redirected to Stripe checkout when they RSVP</p>
                        <p>• QR codes will be emailed after successful payment</p>
                        <p>• Use the Check-in page to scan QR codes at your event</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6 text-white">
              <h2 className="text-lg font-medium text-white/90 border-b border-white/10 pb-2">Appearance</h2>
              <div>
                <label className="block text-sm text-white/70 mb-2">Invite style</label>
                <div className="flex flex-wrap gap-2">
                  {(['default', 'glass', 'electric', 'drawing', 'elegant'] as const).map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setThemeStyle(style)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                        themeStyle === style
                          ? 'bg-cyan-500 text-white ring-2 ring-cyan-400 ring-offset-2 ring-offset-black/30'
                          : 'bg-white/10 text-white/90 hover:bg-white/15 border border-white/10'
                      }`}
                    >
                      {style === 'default' ? 'Default' : style}
                    </button>
                  ))}
                </div>
                <p className="text-white/50 text-xs mt-1.5">
                  Glass: frosted panels · Electric: neon glow · Drawing: hand-drawn look · Elegant: serif, classic
                </p>
              </div>
              <EventColorPicker
                tier={creatorTier}
                onSave={() => {
                  setSuccess('Theme colors saved successfully.')
                  setTimeout(() => setSuccess(''), 3000)
                }}
              />
              <div>
                <label className="block text-sm text-white/70 mb-1">Company / host name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Logo URL</label>
                <input
                  type="url"
                  value={companyLogoUrl}
                  onChange={(e) => setCompanyLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white rounded-xl font-medium"
              >
                {saving ? 'Saving...' : 'Save settings'}
              </button>
              <Link
                href={`/a/${adminToken}`}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
        <Footer showDonate={true} />
      </div>
    </div>
  )
}

export default function TokenAdminSettings() {
  return (
    <ThemeProvider>
      <TokenAdminSettingsContent />
    </ThemeProvider>
  )
}
