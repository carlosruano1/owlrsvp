'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'
import Image from 'next/image'
import { canCreateEvent, hasFeature } from '@/lib/plans'

// Mark page as dynamic since it uses searchParams
export const dynamic = 'force-dynamic'

function CreateEventContent() {
  const [title, setTitle] = useState('')
  const [allowPlusGuests, setAllowPlusGuests] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [companyLogoUrl, setCompanyLogoUrl] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  // Access mode is now only available in admin page
  const authMode = 'open'
  const [eventDate, setEventDate] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [userPlan, setUserPlan] = useState<{tier: string, eventsCreated: number | null} | null>(null)
  const [canBrand, setCanBrand] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check if user is logged in as admin and get their plan info
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setIsAdmin(true)
          const planData = {
            tier: data.user.subscription_tier || 'free',
            eventsCreated: data.user.events_created_count || 0
          }
          setUserPlan(planData)
          setCanBrand(hasFeature('allowsCustomBranding', planData.tier))
          
          // Don't redirect - just let them see the form with locked button
        }
      } catch (err) {
        // Not logged in
      }
    }
    checkAdmin()
    
    // Check for account creation success message
    if (searchParams.get('accountCreated') === 'true') {
      setShowSuccessMessage(true)
      // Clear the URL parameter
      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.delete('accountCreated')
      router.replace(`/create${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`, { scroll: false })
      // Hide message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000)
    }
  }, [router, searchParams])

  const titleExamples = useMemo(() => [
    'Name of the Event',
    "Apple Employee Holiday Party",
    "Microsoft Support Team Summit",
    "NVIDIA Developer Appreciation Night",
    "OpenAI Research Offsite"
  ], [])
  const companyExamples = useMemo(() => [
    'Company Name',
    'Acme Corp',
    'Globex',
    'Initech',
    'Wayne Enterprises'
  ], [])
  const [titleExampleIdx, setTitleExampleIdx] = useState(0)
  const [companyExampleIdx, setCompanyExampleIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setTitleExampleIdx((i) => (i + 1) % titleExamples.length)
      setCompanyExampleIdx((i) => (i + 1) % companyExamples.length)
    }, 4000)
    return () => clearInterval(id)
  }, [titleExamples.length, companyExamples.length])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    // Check if user can create another event
    if (userPlan && !canCreateEvent(userPlan.eventsCreated || 0, userPlan.tier)) {
      setError('You have reached your event limit. Please upgrade to create more events.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // If a file is provided, upload it first to get a public URL
      let finalLogoUrl = companyLogoUrl.trim()
      if (logoFile) {
        try {
          const form = new FormData()
          form.append('file', logoFile)
          const uploadRes = await fetch('/api/uploads/logo', { 
            method: 'POST', 
            body: form,
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout(15000) 
          })
          const uploadJson = await uploadRes.json()
          if (!uploadRes.ok) {
            throw new Error(uploadJson.error || 'Logo upload failed')
          }
          finalLogoUrl = uploadJson.url
        } catch (uploadErr) {
          console.error('Logo upload error:', uploadErr)
          // Continue without logo if upload fails
          setError('Logo upload failed, but continuing with event creation')
          finalLogoUrl = ''
        }
      }

      // Create a mock event if fetch fails in development mode
      const createMockEvent = () => {
        console.log('Creating mock event due to API failure')
        const mockAdminToken = 'mock-' + Math.random().toString(36).substring(2, 15)
        return {
          event: {
            id: 'mock-' + Date.now(),
            admin_token: mockAdminToken,
            title: title.trim(),
            allow_plus_guests: allowPlusGuests,
            created_at: new Date().toISOString()
          }
        }
      }

      try {
        // Prepare the request body
        const requestBody: any = {
          title: title.trim(),
          allow_plus_guests: allowPlusGuests,
          auth_mode: 'open', // Default to open access mode
          event_date: eventDate || undefined,
          event_end_time: eventEndTime || undefined,
          event_location: eventLocation || undefined
        }

        // Only add company branding for paid accounts
        if (canBrand && isAdmin) {
          requestBody.company_name = companyName.trim() || undefined
          requestBody.company_logo_url = finalLogoUrl || undefined
        }
        
        // Log the request for debugging
        console.log('Sending event creation request:', {
          url: '/api/events',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })

        let response
        try {
          response = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout(15000),
            body: JSON.stringify(requestBody)
          })
        } catch (networkErr) {
          console.error('Network error during fetch:', networkErr)
          
          // Try the fallback API endpoint
          console.log('Main API failed, trying fallback API...')
          try {
            const fallbackResponse = await fetch('/api/events/fallback', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody)
            })
            
            const fallbackData = await fallbackResponse.json()
            
            if (fallbackResponse.ok) {
              console.log('Fallback API succeeded:', fallbackData)
              setError('Warning: Using fallback mode. Your event was created but may not be fully functional.')
              router.push(`/a/${fallbackData.event.admin_token}`)
              return
            } else {
              console.error('Fallback API also failed:', fallbackData)
            }
          } catch (fallbackErr) {
            console.error('Error using fallback API:', fallbackErr)
          }
          
          // If all else fails and we're in development, create a mock event
          if (process.env.NODE_ENV === 'development') {
            const mockData = createMockEvent()
            console.log('Created mock event:', mockData)
            setError('Warning: Using mock data. Your event is not saved to the database.')
            router.push(`/a/${mockData.event.admin_token}`)
            return
          }
          
          throw networkErr
        }

        let data
        try {
          data = await response.json()
        } catch (parseErr) {
          console.error('Error parsing response:', parseErr)
          throw new Error('Failed to parse server response')
        }

        if (!response.ok) {
          console.error('Server returned error:', data)
          throw new Error(data.error || 'Failed to create event')
        }

        console.log('Event created successfully:', data)
        // Redirect to admin dashboard
        router.push(`/a/${data.event.admin_token}`)
      } catch (fetchErr) {
        console.error('Event creation error:', fetchErr)
        
        if (fetchErr instanceof TypeError && fetchErr.message.includes('fetch failed')) {
          setError('Connection to server failed. This may be due to network issues or the server being unavailable. Please check your internet connection and try again.')
        } else if (fetchErr instanceof DOMException && fetchErr.name === 'AbortError') {
          setError('Request timed out. The server took too long to respond. Please try again later.')
        } else if (fetchErr instanceof SyntaxError) {
          setError('Received an invalid response from the server. Please try again or contact support if the issue persists.')
        } else {
          setError(fetchErr instanceof Error ? fetchErr.message : 'Failed to create event. Please try again.')
        }
      }
    } catch (err) {
      console.error('Overall submission error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="animated-bg" />
      <div className="spotlight" />
      
      {/* Home link in header - only show when not logged in (AdminNavigation handles logged in state) */}
      {!isAdmin && (
        <div className="fixed top-0 left-0 right-0 z-50 py-4 px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-all">
            <div className="relative h-8 w-8 overflow-hidden">
              <Image 
                src="/images/owlrsvp_logo_png.png" 
                alt="OwlRSVP Logo" 
                width={32} 
                height={32} 
                className="object-contain"
              />
            </div>
            <span className="text-lg font-bold">
              owl<span className="text-blue-400">rsvp</span>
            </span>
          </Link>
        </div>
      )}
      
      <div className={`relative z-10 min-h-screen flex items-center justify-center p-6 ${isAdmin ? 'pt-6' : 'pt-20'}`}>
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-semibold text-white mb-3 tracking-tight text-glow">Create Event</h1>
            <p className="text-white/80 text-lg font-light text-glow">Simple and beautiful RSVPs</p>
            {!isAdmin && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl max-w-md mx-auto">
                <p className="text-yellow-200 text-sm">
                  💡 <strong>Tip:</strong> Create a free admin account to manage all your events in one place!
                </p>
                <Link 
                  href="/admin/register" 
                  className="text-yellow-300 hover:text-yellow-200 text-sm underline mt-1 inline-block"
                >
                  Sign up for free →
                </Link>
              </div>
            )}
          </div>

          {/* Form Card */}
          <div className="glass-card rounded-3xl p-8 shadow-2xl">
            {showSuccessMessage && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 text-green-100 px-4 py-3 rounded-xl backdrop-blur-sm text-sm">
                ✅ Account created successfully! You can now create your first event.
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-12">
              {/* Essential Details */}
              <div className="space-y-6">
                {/* Event Title */}
                <div className="space-y-3">
                  <label htmlFor="title" className="block text-sm font-medium text-white/90">
                    Event Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={titleExamples[titleExampleIdx]}
                    className="modern-input w-full px-4 py-4 text-lg"
                    required
                  />
                </div>

                {/* Company Name */}
                <div className="space-y-3">
                  <label htmlFor="companyName" className="block text-sm font-medium text-white/90">
                    Company Name <span className="text-white/40">(optional)</span>
                  </label>
                    {!canBrand && isAdmin && (
                      <div className="mb-2 text-xs text-white/50">
                        <span>Custom branding available on </span>
                        <Link href="/checkout?plan=basic" className="text-blue-400 hover:text-blue-300 underline">
                          paid plans
                        </Link>
                      </div>
                    )}
                    <input
                      type="text"
                      id="companyName"
                      value={companyName}
                      onChange={(e) => {
                        if (canBrand || !isAdmin) {
                          setCompanyName(e.target.value)
                        } else {
                          router.push('/?upgrade=true&reason=branding#pricing')
                        }
                      }}
                      placeholder={companyExamples[companyExampleIdx]}
                      className={`modern-input w-full px-4 py-4 text-lg ${!canBrand && isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!canBrand && isAdmin}
                    />
                </div>
                
                {/* Event Date & Location */}
                <div className="space-y-3">
                  <label htmlFor="eventDate" className="block text-sm font-medium text-white/90">
                    Event Start Date & Time <span className="text-white/40">(optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    id="eventDate"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="modern-input w-full px-4 py-4 text-lg"
                  />
                </div>
                
                <div className="space-y-3">
                  <label htmlFor="eventEndTime" className="block text-sm font-medium text-white/90">
                    Event End Date & Time <span className="text-white/40">(optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    id="eventEndTime"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="modern-input w-full px-4 py-4 text-lg"
                    min={eventDate || undefined}
                  />
                </div>
                
                <div className="space-y-3">
                  <label htmlFor="eventLocation" className="block text-sm font-medium text-white/90">
                    Event Location Display Name <span className="text-white/40">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="eventLocation"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="What guests will see (e.g., 'My House', 'Downtown Venue')"
                    className="modern-input w-full px-4 py-4 text-lg"
                  />
                </div>


                {/* Logo Upload Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-white/90">
                      Company Logo <span className="text-white/40">(optional)</span>
                    </label>
                    {!canBrand && isAdmin && (
                      <span className="text-xs text-yellow-400">Upgrade required</span>
                    )}
                  </div>
                  
                    {!canBrand && isAdmin && (
                      <div className="mb-2 text-xs text-white/50">
                        <span>Logo upload available on </span>
                        <Link href="/checkout?plan=basic" className="text-blue-400 hover:text-blue-300 underline">
                          paid plans
                        </Link>
                      </div>
                    )}
                  
                  {/* Logo Preview */}
                  {logoPreview && (
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
                      <Image 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="h-12 w-12 object-contain rounded-lg bg-white/10 p-2" 
                        width={48} 
                        height={48} 
                        unoptimized 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white/90 truncate">{logoFile?.name}</div>
                        <button 
                          type="button" 
                          onClick={() => { setLogoFile(null); setLogoPreview(''); }}
                          className="text-xs text-white/60 hover:text-white/80"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upload Options */}
                  {!logoPreview && (
                    <div className="flex flex-col gap-3">
                      {/* URL Input */}
                      <input
                        type="url"
                        id="companyLogoUrl"
                        inputMode="url"
                        value={companyLogoUrl}
                        onChange={(e) => setCompanyLogoUrl(e.target.value)}
                        placeholder="Paste logo URL"
                        className={`modern-input w-full px-4 py-3 text-base ${!canBrand && isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                        pattern="https?://.*\.(png|jpg|jpeg|webp|svg)"
                        disabled={!canBrand && isAdmin}
                        onClick={(e) => {
                          if (!canBrand && isAdmin) {
                            e.preventDefault()
                            router.push('/?upgrade=true&reason=branding#pricing')
                          }
                        }}
                      />
                      
                      {/* Divider */}
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-white/10"></div>
                        <span className="text-xs text-white/40">or</span>
                        <div className="h-px flex-1 bg-white/10"></div>
                      </div>

                      {/* Upload Area */}
                      <div
                        role="button"
                        aria-label="Logo dropzone"
                        onDragOver={(e) => { 
                          if (!canBrand && isAdmin) return
                          e.preventDefault(); 
                          setDragActive(true) 
                        }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={(e) => {
                          if (!canBrand && isAdmin) {
                            e.preventDefault()
                            router.push('/?upgrade=true&reason=branding#pricing')
                            return
                          }
                          e.preventDefault()
                          setDragActive(false)
                          const f = e.dataTransfer.files?.[0]
                          if (!f) return
                          if (!['image/png','image/jpeg','image/webp','image/svg+xml'].includes(f.type)) return
                          if (f.size > 2 * 1024 * 1024) { setError('Logo too large. Max 2MB.'); return }
                          setLogoFile(f)
                          setLogoPreview(URL.createObjectURL(f))
                        }}
                        onClick={() => {
                          if (!canBrand && isAdmin) {
                            router.push('/?upgrade=true&reason=branding#pricing')
                            return
                          }
                          document.getElementById('companyLogoFileInput')?.click()
                        }}
                        className={`flex items-center justify-center gap-3 rounded-xl border border-dashed p-4 transition-all ${
                          !canBrand && isAdmin 
                            ? 'opacity-50 cursor-not-allowed border-white/10 bg-white/5' 
                            : `cursor-pointer ${
                                dragActive 
                                  ? 'border-white/60 bg-white/10' 
                                  : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
                              }`
                        }`}
                      >
                        <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-white/60">Choose or drop image</span>
                      </div>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null
                          if (!f) { setLogoFile(null); setLogoPreview(''); return }
                          if (!['image/png','image/jpeg','image/webp','image/svg+xml'].includes(f.type)) { setError('Unsupported file type'); return }
                          if (f.size > 2 * 1024 * 1024) { setError('Logo too large. Max 2MB.'); return }
                          setError('')
                          setLogoFile(f)
                          setLogoPreview(URL.createObjectURL(f))
                        }}
                        className="hidden"
                        id="companyLogoFileInput"
                      />
                      <p className="text-white/40 text-xs">Supported: PNG, JPG, JPEG, WebP, SVG • Max size: 2MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Event Settings */}
              <div className="space-y-8">
                {/* Access Control removed - only available in admin page */}

                {/* Additional Settings */}
                <div className="space-y-6">
                  {/* Plus Guests Toggle */}
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setAllowPlusGuests(!allowPlusGuests)}
                      className={`relative flex h-6 w-11 items-center rounded-full transition-all ${
                        allowPlusGuests ? 'bg-white' : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`absolute h-4 w-4 transform rounded-full transition-all duration-300 ${
                          allowPlusGuests 
                            ? 'left-6 bg-black' 
                            : 'left-1 bg-white/60'
                        }`}
                      />
                    </button>
                    <div>
                      <div className="text-sm font-medium text-white/90">Allow Additional Guests</div>
                      <div className="text-xs text-white/40">Let attendees bring plus-ones</div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-100 px-4 py-3 rounded-xl backdrop-blur-sm text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !title.trim() || !!(userPlan && !canCreateEvent(userPlan.eventsCreated || 0, userPlan.tier))}
                className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-white text-black font-medium transition-all hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white relative"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Creating Event...</span>
                  </>
                ) : (
                  <>
                    {userPlan && !canCreateEvent(userPlan.eventsCreated || 0, userPlan.tier) && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                    Create Event
                  </>
                )}
              </button>

              {/* Subtle Upgrade Prompt */}
              {userPlan && !canCreateEvent(userPlan.eventsCreated || 0, userPlan.tier) && (
                <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-white/90 text-sm mb-1">
                        {userPlan.tier === 'free' 
                          ? `You've reached your limit of 1 event on the Free plan.`
                          : `You've reached your event limit for the ${userPlan.tier.charAt(0).toUpperCase() + userPlan.tier.slice(1)} plan.`
                        }
                      </p>
                      <p className="text-white/60 text-xs mb-3">
                        Upgrade to create more events and unlock additional features.
                      </p>
                      <Link 
                        href="/?upgrade=true&reason=event_limit#pricing"
                        className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
                      >
                        <span>View upgrade options</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      <Footer showDonate={false} />
    </div>
  )
}

export default function CreateEvent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    }>
      <CreateEventContent />
    </Suspense>
  )
}
