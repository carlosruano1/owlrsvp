'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer'
import Image from 'next/image'

export default function Home() {
  const [title, setTitle] = useState('')
  const [allowPlusGuests, setAllowPlusGuests] = useState(false)
  const [backgroundColor, setBackgroundColor] = useState('#007AFF')
  const [companyName, setCompanyName] = useState('')
  const [companyLogoUrl, setCompanyLogoUrl] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [openInvite, setOpenInvite] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  // Update CSS variable when color changes
  useEffect(() => {
    document.documentElement.style.setProperty('--company-color', backgroundColor)
    document.documentElement.style.setProperty('--company-color-alpha', `${backgroundColor}33`)
  }, [backgroundColor])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    setError('')

    try {
      // If a file is provided, upload it first to get a public URL
      let finalLogoUrl = companyLogoUrl.trim()
      if (logoFile) {
        const form = new FormData()
        form.append('file', logoFile)
        const uploadRes = await fetch('/api/uploads/logo', { method: 'POST', body: form })
        const uploadJson = await uploadRes.json()
        if (!uploadRes.ok) {
          throw new Error(uploadJson.error || 'Logo upload failed')
        }
        finalLogoUrl = uploadJson.url
      }

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          allow_plus_guests: allowPlusGuests,
          background_color: backgroundColor,
          company_name: companyName.trim() || undefined,
          company_logo_url: finalLogoUrl || undefined,
          open_invite: openInvite
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create event')
      }

      // Redirect to admin dashboard
      router.push(`/a/${data.event.admin_token}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="animated-bg" />
      <div className="spotlight" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-semibold text-white mb-3 tracking-tight text-glow">Create Event</h1>
            <p className="text-white/80 text-lg font-light text-glow">Simple and beautiful RSVPs</p>
          </div>

          {/* Form Card */}
          <div className="glass-card rounded-3xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-8">
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
                  placeholder="IWM Annual Event"
                  className="modern-input w-full px-4 py-4 text-lg"
                  required
                />
              </div>

              {/* Company Name */}
              <div className="space-y-3">
                <label htmlFor="companyName" className="block text-sm font-medium text-white/90">
                  Company Name (optional)
                </label>
                <input
                  type="text"
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Tesla, Inc."
                  className="modern-input w-full px-4 py-4 text-lg"
                />
              </div>

              {/* Company Logo URL */}
              <div className="space-y-3">
                <label htmlFor="companyLogoUrl" className="block text-sm font-medium text-white/90">
                  Company Logo URL (png, jpg, jpeg, webp, svg)
                </label>
                <input
                  type="url"
                  id="companyLogoUrl"
                  inputMode="url"
                  value={companyLogoUrl}
                  onChange={(e) => setCompanyLogoUrl(e.target.value)}
                  placeholder="https://cdn.example.com/logo.png"
                  className="modern-input w-full px-4 py-4 text-lg"
                  pattern="https?://.*\.(png|jpg|jpeg|webp|svg)"
                />
                <p className="text-white/60 text-xs">Direct file URLs only. SVGs should be safe/clean.</p>
              </div>

              {/* Or Upload / Drag & Drop Logo (max 2MB) */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-white/90">
                  Or upload/drag & drop logo (png, jpg, jpeg, webp, svg)
                </label>
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
                  className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 transition-colors ${dragActive ? 'border-white/60 bg-white/10' : 'border-white/20 bg-white/5'}`}
                >
                  {logoPreview ? (
                    <Image src={logoPreview} alt="Logo preview" className="h-16 w-16 object-contain rounded-xl bg-white/10 p-2 border border-white/10" width={64} height={64} unoptimized />
                  ) : (
                    <div className="text-center text-white/70">
                      <div className="text-sm">Drag & drop your logo here</div>
                      <div className="text-xs">or click to choose a file</div>
                    </div>
                  )}
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
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => document.getElementById('companyLogoFileInput')?.click()}
                    className="modern-button px-4 py-2 text-sm"
                  >
                    Choose file
                  </button>
                  {logoFile && (
                    <span className="text-white/70 text-sm truncate">{logoFile.name}</span>
                  )}
                </div>
                <p id="logo-help" className="text-white/60 text-xs">Maximum size 2MB. You can paste a URL or upload a file.</p>
              </div>

              {/* Plus Guests Toggle */}
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setAllowPlusGuests(!allowPlusGuests)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                    allowPlusGuests ? 'bg-white' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-black transition-all duration-300 ${
                      allowPlusGuests ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <label className="text-white/90 font-medium cursor-pointer" onClick={() => setAllowPlusGuests(!allowPlusGuests)}>
                  Allow guests to bring additional people
                </label>
              </div>

              {/* Open Invite Toggle */}
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setOpenInvite(!openInvite)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                    openInvite ? 'bg-white' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-black transition-all duration-300 ${
                      openInvite ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <label className="text-white/90 font-medium cursor-pointer" onClick={() => setOpenInvite(!openInvite)}>
                  Open invite (anyone can RSVP)
                </label>
              </div>

              {/* Background Color */}
              <div className="space-y-3">
                <label htmlFor="backgroundColor" className="block text-sm font-medium text-white/90">
                  Theme Color
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="color"
                    id="backgroundColor"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="h-12 w-16 border-0 rounded-xl cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="modern-input flex-1 px-4 py-4 font-mono text-sm"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-100 px-4 py-3 rounded-2xl backdrop-blur-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="modern-button w-full py-4 px-6 text-lg shadow-lg"
              >
                {loading ? 'Creating Event...' : 'Create Event'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <Footer showDonate={false} />
    </div>
  )
}