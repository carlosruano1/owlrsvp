'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'
import Image from 'next/image'

export default function CreateEvent() {
  const [title, setTitle] = useState('')
  const [allowPlusGuests, setAllowPlusGuests] = useState(false)
  const [backgroundColor, setBackgroundColor] = useState('#007AFF')
  const [backgroundPageColor, setBackgroundPageColor] = useState('#000000')
  const [spotlightColor, setSpotlightColor] = useState('#007AFF')
  const [fontColor, setFontColor] = useState('#FFFFFF')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showBgColorPicker, setShowBgColorPicker] = useState(false)
  const [showSpotlightColorPicker, setShowSpotlightColorPicker] = useState(false)
  const [showFontColorPicker, setShowFontColorPicker] = useState(false)
  const [presetColors] = useState([
    '#007AFF', // Default blue
    '#FF2D55', // Red
    '#5856D6', // Purple
    '#FF9500', // Orange
    '#34C759', // Green
    '#AF52DE', // Magenta
    '#000000', // Black
    '#8E8E93'  // Gray
  ])
  const [presetBgColors] = useState([
    '#000000', // Black
    '#111111', // Dark gray
    '#1A1A1A', // Charcoal
    '#0A0A0A', // Near black
    '#1E1E1E', // Dark mode
    '#121212', // Spotify dark
    '#191919', // Almost black
    '#2D2D2D'  // Medium gray
  ])
  const [companyName, setCompanyName] = useState('')
  const [companyLogoUrl, setCompanyLogoUrl] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  // Access mode is now only available in admin page
  const authMode = 'open'
  const [eventDate, setEventDate] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [userPlan, setUserPlan] = useState<{tier: string, eventsCreated: number | null} | null>(null)
  const router = useRouter()

  // Check if user is logged in as admin and get their plan info
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setIsAdmin(true)
          setUserPlan({
            tier: data.user.subscription_tier || 'free',
            eventsCreated: data.user.events_created_count || 0
          })
        }
      } catch (err) {
        // Not logged in
      }
    }
    checkAdmin()
  }, [])

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

  // Update CSS variables when colors change
  useEffect(() => {
    document.documentElement.style.setProperty('--company-color', backgroundColor)
    document.documentElement.style.setProperty('--company-color-alpha', `${backgroundColor}33`)
    document.documentElement.style.setProperty('--background', backgroundPageColor)
    document.documentElement.style.setProperty('--spotlight-color', spotlightColor)
    document.documentElement.style.setProperty('--spotlight-color-alpha', `${spotlightColor}33`)
    document.documentElement.style.setProperty('--foreground', fontColor)
  }, [backgroundColor, backgroundPageColor, spotlightColor, fontColor])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    // Check if user has reached their event limit
    if (userPlan && userPlan.tier === 'free' && (userPlan.eventsCreated || 0) >= 1) {
      setError('You have reached the maximum number of events allowed in your free plan. Please upgrade to create more events.')
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
            background_color: backgroundColor,
            created_at: new Date().toISOString()
          } 
        }
      }

      try {
        // Prepare the request body
        const requestBody = {
          title: title.trim(),
          allow_plus_guests: allowPlusGuests,
          background_color: backgroundColor,
          page_background_color: backgroundPageColor,
          spotlight_color: spotlightColor,
          font_color: fontColor,
          company_name: companyName.trim() || undefined,
          company_logo_url: finalLogoUrl || undefined,
          auth_mode: 'open', // Default to open access mode
          event_date: eventDate || undefined,
          event_location: eventLocation || undefined
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
      
      {/* Home link in header */}
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
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6 pt-20">
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
            {userPlan && userPlan.tier === 'free' && (userPlan.eventsCreated || 0) >= 1 && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl max-w-md mx-auto">
                <p className="text-red-200 text-sm">
                  ⚠️ <strong>Event Limit Reached:</strong> You have reached the maximum number of events allowed in your free plan.
                </p>
                <Link 
                  href="/pricing" 
                  className="text-red-300 hover:text-red-200 text-sm underline mt-1 inline-block"
                >
                  Upgrade to create more events →
                </Link>
              </div>
            )}
          </div>

          {/* Form Card */}
          <div className="glass-card rounded-3xl p-8 shadow-2xl">
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
                  <input
                    type="text"
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={companyExamples[companyExampleIdx]}
                    className="modern-input w-full px-4 py-4 text-lg"
                  />
                </div>
                
                {/* Event Date & Location */}
                <div className="space-y-3">
                  <label htmlFor="eventDate" className="block text-sm font-medium text-white/90">
                    Event Date <span className="text-white/40">(optional)</span>
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
                  <label htmlFor="eventLocation" className="block text-sm font-medium text-white/90">
                    Event Location <span className="text-white/40">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="eventLocation"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Location or address"
                    className="modern-input w-full px-4 py-4 text-lg"
                  />
                </div>

                {/* Logo Upload Section */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-white/90">
                    Company Logo <span className="text-white/40">(optional)</span>
                  </label>
                  
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
                        className="modern-input w-full px-4 py-3 text-base"
                        pattern="https?://.*\.(png|jpg|jpeg|webp|svg)"
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
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={(e) => {
                          e.preventDefault()
                          setDragActive(false)
                          const f = e.dataTransfer.files?.[0]
                          if (!f) return
                          if (!['image/png','image/jpeg','image/webp','image/svg+xml'].includes(f.type)) return
                          if (f.size > 2 * 1024 * 1024) { setError('Logo too large. Max 2MB.'); return }
                          setLogoFile(f)
                          setLogoPreview(URL.createObjectURL(f))
                        }}
                        onClick={() => document.getElementById('companyLogoFileInput')?.click()}
                        className={`flex items-center justify-center gap-3 rounded-xl border border-dashed p-4 transition-all cursor-pointer ${
                          dragActive 
                            ? 'border-white/60 bg-white/10' 
                            : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
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

                  {/* Color Customization Section */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-white/90 mb-2">Appearance Customization</h3>
                    
                    {/* Theme Color */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-white/90">Primary Theme Color</label>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="color"
                            id="backgroundColor"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="sr-only"
                          />
                          <button
                            type="button"
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className="w-11 h-11 rounded-xl border-2 border-white/10 shadow-lg shadow-black/20 transition-all hover:scale-105"
                            style={{ backgroundColor }}
                            aria-label="Select theme color"
                          />
                        </div>
                        <input
                          type="text"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="modern-input flex-1 px-4 py-3 font-mono text-sm uppercase"
                          maxLength={7}
                        />
                        
                        {/* Color preview */}
                        <div 
                          className="w-11 h-11 rounded-xl border-2 border-white/10 flex items-center justify-center overflow-hidden"
                          style={{ backgroundColor }}
                        >
                          <span className="text-xs font-bold" style={{ color: backgroundColor === '#000000' ? '#FFFFFF' : '#000000' }}>
                            Aa
                          </span>
                        </div>
                      </div>
                      
                      {/* Color picker panel */}
                      {showColorPicker && (
                        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl animate-fadeIn">
                          <div className="grid grid-cols-4 gap-3 mb-4">
                            {presetColors.map((color) => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => {
                                  setBackgroundColor(color)
                                  setShowColorPicker(false)
                                }}
                                className={`w-full aspect-square rounded-lg transition-transform hover:scale-110 ${backgroundColor === color ? 'ring-2 ring-white' : ''}`}
                                style={{ backgroundColor: color }}
                                aria-label={`Select color ${color}`}
                              />
                            ))}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <label className="text-xs text-white/60">Custom:</label>
                            <div className="relative flex-1">
                              <input
                                type="color"
                                value={backgroundColor}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                className="w-full h-10 rounded-lg cursor-pointer"
                              />
                            </div>
                          </div>
                          
                          <p className="text-xs text-white/40 mt-3">
                            Choose a color that represents your brand or event theme.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Background Color */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-white/90">Page Background Color</label>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="color"
                            id="backgroundPageColor"
                            value={backgroundPageColor}
                            onChange={(e) => setBackgroundPageColor(e.target.value)}
                            className="sr-only"
                          />
                          <button
                            type="button"
                            onClick={() => setShowBgColorPicker(!showBgColorPicker)}
                            className="w-11 h-11 rounded-xl border-2 border-white/10 shadow-lg shadow-black/20 transition-all hover:scale-105"
                            style={{ backgroundColor: backgroundPageColor }}
                            aria-label="Select background color"
                          />
                        </div>
                        <input
                          type="text"
                          value={backgroundPageColor}
                          onChange={(e) => setBackgroundPageColor(e.target.value)}
                          className="modern-input flex-1 px-4 py-3 font-mono text-sm uppercase"
                          maxLength={7}
                        />
                      </div>
                      
                      {/* Background Color picker panel */}
                      {showBgColorPicker && (
                        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl animate-fadeIn">
                          <div className="grid grid-cols-4 gap-3 mb-4">
                            {presetBgColors.map((color) => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => {
                                  setBackgroundPageColor(color)
                                  setShowBgColorPicker(false)
                                }}
                                className={`w-full aspect-square rounded-lg transition-transform hover:scale-110 ${backgroundPageColor === color ? 'ring-2 ring-white' : ''}`}
                                style={{ backgroundColor: color }}
                                aria-label={`Select background color ${color}`}
                              />
                            ))}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <label className="text-xs text-white/60">Custom:</label>
                            <div className="relative flex-1">
                              <input
                                type="color"
                                value={backgroundPageColor}
                                onChange={(e) => setBackgroundPageColor(e.target.value)}
                                className="w-full h-10 rounded-lg cursor-pointer"
                              />
                            </div>
                          </div>
                          
                          <p className="text-xs text-white/40 mt-3">
                            Choose a dark color for the page background.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Spotlight Color */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-white/90">Spotlight Color</label>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="color"
                            id="spotlightColor"
                            value={spotlightColor}
                            onChange={(e) => setSpotlightColor(e.target.value)}
                            className="sr-only"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSpotlightColorPicker(!showSpotlightColorPicker)}
                            className="w-11 h-11 rounded-xl border-2 border-white/10 shadow-lg shadow-black/20 transition-all hover:scale-105"
                            style={{ backgroundColor: spotlightColor }}
                            aria-label="Select spotlight color"
                          />
                        </div>
                        <input
                          type="text"
                          value={spotlightColor}
                          onChange={(e) => setSpotlightColor(e.target.value)}
                          className="modern-input flex-1 px-4 py-3 font-mono text-sm uppercase"
                          maxLength={7}
                        />
                      </div>
                      
                      {/* Spotlight Color picker panel */}
                      {showSpotlightColorPicker && (
                        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl animate-fadeIn">
                          <div className="grid grid-cols-4 gap-3 mb-4">
                            {presetColors.map((color) => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => {
                                  setSpotlightColor(color)
                                  setShowSpotlightColorPicker(false)
                                }}
                                className={`w-full aspect-square rounded-lg transition-transform hover:scale-110 ${spotlightColor === color ? 'ring-2 ring-white' : ''}`}
                                style={{ backgroundColor: color }}
                                aria-label={`Select spotlight color ${color}`}
                              />
                            ))}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <label className="text-xs text-white/60">Custom:</label>
                            <div className="relative flex-1">
                              <input
                                type="color"
                                value={spotlightColor}
                                onChange={(e) => setSpotlightColor(e.target.value)}
                                className="w-full h-10 rounded-lg cursor-pointer"
                              />
                            </div>
                          </div>
                          
                          <p className="text-xs text-white/40 mt-3">
                            Choose a color for the animated spotlight effect.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Font Color */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-white/90">Font Color</label>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="color"
                            id="fontColor"
                            value={fontColor}
                            onChange={(e) => setFontColor(e.target.value)}
                            className="sr-only"
                          />
                          <button
                            type="button"
                            onClick={() => setShowFontColorPicker(!showFontColorPicker)}
                            className="w-11 h-11 rounded-xl border-2 border-white/10 shadow-lg shadow-black/20 transition-all hover:scale-105"
                            style={{ backgroundColor: fontColor }}
                            aria-label="Select font color"
                          />
                        </div>
                        <input
                          type="text"
                          value={fontColor}
                          onChange={(e) => setFontColor(e.target.value)}
                          className="modern-input flex-1 px-4 py-3 font-mono text-sm uppercase"
                          maxLength={7}
                        />
                      </div>
                      
                      {/* Font Color picker panel */}
                      {showFontColorPicker && (
                        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl animate-fadeIn">
                          <div className="grid grid-cols-4 gap-3 mb-4">
                            {['#FFFFFF', '#F2F2F7', '#E5E5EA', '#D1D1D6', '#C7C7CC', '#AEAEB2', '#8E8E93', '#F0F0F0'].map((color) => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => {
                                  setFontColor(color)
                                  setShowFontColorPicker(false)
                                }}
                                className={`w-full aspect-square rounded-lg transition-transform hover:scale-110 ${fontColor === color ? 'ring-2 ring-white' : ''}`}
                                style={{ backgroundColor: color }}
                                aria-label={`Select font color ${color}`}
                              />
                            ))}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <label className="text-xs text-white/60">Custom:</label>
                            <div className="relative flex-1">
                              <input
                                type="color"
                                value={fontColor}
                                onChange={(e) => setFontColor(e.target.value)}
                                className="w-full h-10 rounded-lg cursor-pointer"
                              />
                            </div>
                          </div>
                          
                          <p className="text-xs text-white/40 mt-3">
                            Choose a color for the text. Light colors work best on dark backgrounds.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Live preview */}
                    <div className="mt-6 rounded-xl overflow-hidden border border-white/10">
                      <div className="text-xs text-white/60 px-3 py-2 bg-black/30">Preview:</div>
                      <div className="relative overflow-hidden" style={{ backgroundColor: backgroundPageColor }}>
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent opacity-70"></div>
                        <div className="h-24 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${backgroundColor} 0%, ${backgroundColor}88 100%)` }}>
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent opacity-70"></div>
                          <div className="relative z-10 h-full flex items-center justify-center">
                            <div className="text-center">
                              <h3 className="font-semibold text-shadow-sm" style={{ color: fontColor }}>{title || 'Your Event Title'}</h3>
                              {companyName && (
                                <div className="text-xs text-shadow-sm" style={{ color: `${fontColor}CC` }}>{companyName}</div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="h-16 relative">
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))]" style={{ 
                            background: `radial-gradient(circle at center, ${spotlightColor}33 0%, transparent 70%)`
                          }}></div>
                          <div className="relative z-10 h-full flex items-center justify-center">
                            <div className="text-center text-xs" style={{ color: fontColor }}>
                              Spotlight effect preview
                            </div>
                          </div>
                        </div>
                      </div>
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
                disabled={loading || !title.trim() || !!(userPlan && userPlan.tier === 'free' && (userPlan.eventsCreated || 0) >= 1)}
                className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-white text-black font-medium transition-all hover:bg-white/90 disabled:opacity-50 disabled:hover:bg-white"
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
                  'Create Event'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <Footer showDonate={false} />
    </div>
  )
}
