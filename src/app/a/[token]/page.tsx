'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { Event, Attendee } from '@/lib/types'
import Footer from '@/components/Footer'
import AdminLoadingScreen from '@/components/AdminLoadingScreen'
import { TokenAdminNav } from '@/components/TokenAdminNav'
import { copyImageUsingSelection, supportsClipboardImageCopy } from '@/lib/clipboard'

interface DashboardData {
  event: Event
  attendees: Attendee[]
  stats: { totalAttending: number; totalNotAttending: number; totalResponses: number }
}

function useEventUrl(eventId: string) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    setUrl(
      typeof window !== 'undefined'
        ? `${window.location.origin}/e/${eventId}`
        : ''
    )
  }, [eventId])
  return url
}

function useQRCodeDataUrl(url: string, size = 256) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!url) return
    import('qrcode').then((QRCode) => {
      QRCode.toDataURL(url, { width: size, margin: 2 }).then(setDataUrl).catch(() => setDataUrl(null))
    })
  }, [url, size])
  return dataUrl
}

export default function AdminDashboard() {
  const params = useParams()
  const adminToken = params.token as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<DashboardData | null>(null)
  const [copyLabel, setCopyLabel] = useState<'Copy link' | 'Copied!'>('Copy link')
  const [copyQRLabel, setCopyQRLabel] = useState<'Copy QR' | 'Copied!'>('Copy QR')
  const [addGuestOpen, setAddGuestOpen] = useState(false)
  const [addGuestForm, setAddGuestForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    attending: true,
    guest_count: 0
  })
  const [addGuestLoading, setAddGuestLoading] = useState(false)
  const [addGuestError, setAddGuestError] = useState('')
  const [addGuestSuccess, setAddGuestSuccess] = useState('')

  const eventUrl = useEventUrl(data?.event?.id ?? '')
  const qrDataUrl = useQRCodeDataUrl(eventUrl)

  const fetchData = useCallback(async () => {
    if (!adminToken) return
    try {
      const res = await fetch(`/api/admin/${adminToken}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load')
      setData(json)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [adminToken])

  useEffect(() => {
    if (!adminToken) {
      setLoading(false)
      setError('Invalid link')
      return
    }
    setLoading(true)
    fetchData()
  }, [adminToken, fetchData])

  const handleAddGuest = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const { first_name, last_name, email, attending, guest_count } = addGuestForm
    if (!first_name.trim() && !last_name.trim()) {
      setAddGuestError('Enter at least first or last name')
      return
    }
    setAddGuestLoading(true)
    setAddGuestError('')
    setAddGuestSuccess('')
    try {
      const res = await fetch(`/api/admin/${adminToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          email: email.trim() || undefined,
          attending,
          guest_count: Number(guest_count) || 0
        })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to add guest')
      setAddGuestSuccess('Guest added.')
      setAddGuestForm({ first_name: '', last_name: '', email: '', attending: true, guest_count: 0 })
      setAddGuestOpen(false)
      await fetchData()
      setTimeout(() => setAddGuestSuccess(''), 3000)
    } catch (e) {
      setAddGuestError(e instanceof Error ? e.message : 'Failed to add guest')
    } finally {
      setAddGuestLoading(false)
    }
  }, [adminToken, addGuestForm, fetchData])

  const copyLink = useCallback(async () => {
    if (!eventUrl) return
    try {
      await navigator.clipboard.writeText(eventUrl)
      setCopyLabel('Copied!')
      setTimeout(() => setCopyLabel('Copy link'), 2000)
    } catch {
      setCopyLabel('Copy link')
    }
  }, [eventUrl])

  const copyQR = useCallback(async () => {
    if (!qrDataUrl) return
    try {
      if (supportsClipboardImageCopy()) {
        try {
          const blob = await (await fetch(qrDataUrl)).blob()
          const CI = (window as unknown as { ClipboardItem?: new (o: Record<string, Blob>) => ClipboardItem }).ClipboardItem
          if (CI) await navigator.clipboard.write([new CI({ 'image/png': blob })])
          else await copyImageUsingSelection(qrDataUrl)
        } catch {
          await copyImageUsingSelection(qrDataUrl)
        }
      } else {
        await copyImageUsingSelection(qrDataUrl)
      }
      setCopyQRLabel('Copied!')
      setTimeout(() => setCopyQRLabel('Copy QR'), 2000)
    } catch {
      setCopyQRLabel('Copy QR')
    }
  }, [qrDataUrl])

  const downloadQR = useCallback(() => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `owlrsvp-qr-${data?.event?.title?.replace(/\s+/g, '-') || 'event'}.png`
    a.click()
  }, [qrDataUrl, data?.event?.title])

  if (loading) return <AdminLoadingScreen />

  if (error || !data) {
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

  const { event, attendees, stats } = data
  const csvUrl = `/api/admin/${adminToken}/csv`
  const totalPeopleExpected = stats.totalAttending
  const encodedUrl = encodeURIComponent(eventUrl)
  const shareText = encodeURIComponent(`${event.title} – RSVP here`)
  const rf = event.required_rsvp_fields
  const showEmail = rf?.email ?? true
  const showPhone = rf?.phone ?? false
  const showAddress = rf?.address ?? false
  const showGuests = rf?.guests ?? true

  const socialLinks = [
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, icon: 'in', color: 'bg-[#0A66C2] hover:bg-[#004182]' },
    { name: 'X', href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${shareText}`, icon: '𝕏', color: 'bg-black hover:bg-gray-800 border border-white/20' },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, icon: 'f', color: 'bg-[#1877F2] hover:bg-[#0d65d9]' },
    { name: 'WhatsApp', href: `https://wa.me/?text=${shareText}%20${encodedUrl}`, icon: 'wa', color: 'bg-[#25D366] hover:bg-[#1da851]' }
  ]

  const formatDate = (d: string | null | undefined) => {
    if (!d) return 'Not set'
    const date = new Date(d)
    return isNaN(date.getTime()) ? 'Not set' : date.toLocaleDateString(undefined, { dateStyle: 'long' })
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 min-h-screen p-4 sm:p-8 pb-24">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header: title + nav */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div className="text-white">
              <h1 className="text-3xl md:text-4xl font-light mb-1">{event.title}</h1>
              <p className="text-white/70 text-base">Admin Dashboard</p>
            </div>
            <TokenAdminNav token={adminToken} current="dashboard" />
          </div>

          {/* Company / brand bar */}
          {(event.company_name || event.company_logo_url) && (
            <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
              {event.company_logo_url && (
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                  <img src={event.company_logo_url} alt="" className="w-full h-full object-contain" />
                </div>
              )}
              <div>
                <div className="text-white font-medium">{event.company_name || 'Company'}</div>
                <div className="text-white/60 text-sm">Admin Dashboard</div>
              </div>
            </div>
          )}

          {/* Attendance overview */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-medium text-white">Attendance Overview</h2>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/events/${event.id}/analytics`}
                  className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Analytics
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5">
              <div className="rounded-xl bg-white/5 border border-white/10 p-5 text-center">
                <div className="text-2xl md:text-3xl font-light text-emerald-400">{stats.totalAttending}</div>
                <div className="text-white/80 text-sm mt-1">Confirmed RSVPs</div>
                <div className="text-white/50 text-xs mt-0.5">{stats.totalResponses === 0 ? 'No responses yet' : ''}</div>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-5 text-center">
                <div className="text-2xl md:text-3xl font-light text-red-400">{stats.totalNotAttending}</div>
                <div className="text-white/80 text-sm mt-1">Not Attending</div>
                <div className="text-white/50 text-xs mt-0.5">{stats.totalResponses === 0 ? 'No responses yet' : ''}</div>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-5 text-center">
                <div className="text-2xl md:text-3xl font-light text-white">{stats.totalResponses}</div>
                <div className="text-white/80 text-sm mt-1">Total Responses</div>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-5 text-center">
                <div className="text-2xl md:text-3xl font-light text-cyan-400">{totalPeopleExpected}</div>
                <div className="text-white/80 text-sm mt-1">Total People Expected</div>
                <div className="text-white/50 text-xs mt-0.5">{stats.totalResponses === 0 ? '0 RSVPs, no additional guests' : ''}</div>
              </div>
            </div>
          </div>

          {/* QR code + event link + social */}
          <div className="glass-card rounded-2xl p-5 md:p-6">
            <h2 className="text-lg font-medium text-white mb-4">Share this QR code for instant RSVP access</h2>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                {qrDataUrl ? (
                  <div className="w-40 h-40 rounded-xl overflow-hidden bg-white p-2">
                    <img src={qrDataUrl} alt="QR code" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-40 h-40 rounded-xl bg-white/10 flex items-center justify-center text-white/50 text-sm">Generating…</div>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={copyQR}
                    disabled={!qrDataUrl}
                    className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {copyQRLabel}
                  </button>
                  <button
                    type="button"
                    onClick={downloadQR}
                    disabled={!qrDataUrl}
                    className="px-3 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-white/70 text-sm mb-1">Event Link</label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      readOnly
                      value={eventUrl}
                      className="flex-1 min-w-0 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                    />
                    <Link
                      href={`/e/${event.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open
                    </Link>
                    <button
                      type="button"
                      onClick={copyLink}
                      className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {copyLabel}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Share on social media</label>
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.map((s) => (
                      <a
                        key={s.name}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-4 py-2 rounded-xl text-white text-sm font-medium flex items-center gap-2 transition-colors ${s.color}`}
                        title={`Share on ${s.name}`}
                      >
                        {s.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Event details card */}
          <div className="glass-card rounded-2xl p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-lg font-medium text-white">Event Details</h2>
              <Link
                href={`/a/${adminToken}/settings`}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors w-fit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Details
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Event Title</div>
                <div className="text-white">{event.title}</div>
              </div>
              <div>
                <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Event Date</div>
                <div className="text-white">{formatDate(event.event_date)}</div>
              </div>
              <div>
                <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Location</div>
                <div className="text-white">{event.event_location || 'Not set'}</div>
              </div>
              <div>
                <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Company</div>
                <div className="text-white">{event.company_name || '—'}</div>
              </div>
              {event.company_logo_url && (
                <div className="sm:col-span-2">
                  <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Company Logo</div>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                      <img src={event.company_logo_url} alt="" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-emerald-400 text-sm">Logo is set</span>
                  </div>
                  <p className="text-white/50 text-xs mt-1">Click &quot;Edit Details&quot; to change</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/a/${adminToken}/access`}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-colors text-sm font-medium"
            >
              Access Management
            </Link>
            <Link
              href={`/e/${event.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-colors text-sm font-medium"
            >
              View Event Page
            </Link>
          </div>

          {/* RSVPs: list + add manually + download */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-medium text-white">RSVPs</h2>
                <p className="text-white/60 text-sm">People who have responded. Add guests manually or download the list.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={csvUrl}
                  download
                  className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download CSV
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setAddGuestOpen((o) => !o)
                    setAddGuestError('')
                    setAddGuestSuccess('')
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add guest
                </button>
              </div>
            </div>

            {/* Add guest form */}
            {addGuestOpen && (
              <form onSubmit={handleAddGuest} className="p-5 border-b border-white/10 bg-white/5 space-y-4">
                <h3 className="text-white font-medium text-sm">Add guest manually</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="First name"
                    value={addGuestForm.first_name}
                    onChange={(e) => setAddGuestForm((f) => ({ ...f, first_name: e.target.value }))}
                    className="modern-input px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={addGuestForm.last_name}
                    onChange={(e) => setAddGuestForm((f) => ({ ...f, last_name: e.target.value }))}
                    className="modern-input px-3 py-2 text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={addGuestForm.email}
                    onChange={(e) => setAddGuestForm((f) => ({ ...f, email: e.target.value }))}
                    className="modern-input px-3 py-2 text-sm"
                  />
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-white/80 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addGuestForm.attending}
                        onChange={(e) => setAddGuestForm((f) => ({ ...f, attending: e.target.checked }))}
                        className="rounded border-white/20"
                      />
                      Attending
                    </label>
                    <label className="flex items-center gap-2 text-white/80 text-sm">
                      <span>+</span>
                      <input
                        type="number"
                        min={0}
                        max={99}
                        value={addGuestForm.guest_count}
                        onChange={(e) => setAddGuestForm((f) => ({ ...f, guest_count: parseInt(e.target.value, 10) || 0 }))}
                        className="modern-input w-16 px-2 py-1.5 text-sm text-center"
                      />
                      guests
                    </label>
                  </div>
                </div>
                {addGuestError && (
                  <div className="text-red-400 text-sm">{addGuestError}</div>
                )}
                {addGuestSuccess && (
                  <div className="text-emerald-400 text-sm">{addGuestSuccess}</div>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={addGuestLoading}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                  >
                    {addGuestLoading ? 'Adding…' : 'Add guest'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddGuestOpen(false)
                      setAddGuestForm({ first_name: '', last_name: '', email: '', attending: true, guest_count: 0 })
                      setAddGuestError('')
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Guest list */}
            {attendees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-white">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-sm text-white/70">
                      <th className="px-5 py-3">Name</th>
                      {showEmail && <th className="px-5 py-3">Email</th>}
                      {showPhone && <th className="px-5 py-3">Phone</th>}
                      {showAddress && <th className="px-5 py-3">Address</th>}
                      <th className="px-5 py-3">Attending</th>
                      {showGuests && <th className="px-5 py-3">Number of Guests</th>}
                      <th className="px-5 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.map((a) => (
                      <tr key={a.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-5 py-3">{[a.first_name, a.last_name].filter(Boolean).join(' ') || '—'}</td>
                        {showEmail && <td className="px-5 py-3 text-white/80">{a.email || '—'}</td>}
                        {showPhone && <td className="px-5 py-3 text-white/80">{a.phone || '—'}</td>}
                        {showAddress && <td className="px-5 py-3 text-white/80 max-w-[200px] truncate" title={a.address || ''}>{a.address || '—'}</td>}
                        <td className="px-5 py-3">
                          <span className={a.attending ? 'text-emerald-400' : 'text-red-400'}>
                            {a.attending ? 'Yes' : 'No'}
                          </span>
                        </td>
                        {showGuests && <td className="px-5 py-3">{a.guest_count ?? 0}</td>}
                        <td className="px-5 py-3 text-white/70">
                          {new Date(a.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 py-12 text-center text-white/50">
                No RSVPs yet. Share the guest link to start receiving responses, or add guests manually above.
              </div>
            )}
          </div>
        </div>
        <Footer showDonate={true} />
      </div>
    </div>
  )
}
