'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { Event, Attendee } from '@/lib/types'
import AdminLoadingScreen from '@/components/AdminLoadingScreen'
import { TokenAdminNav } from '@/components/TokenAdminNav'
import { Html5QrcodeScanner } from 'html5-qrcode'

interface CheckInData {
  event: Event
  attendees: Attendee[]
}

export default function CheckInPage() {
  const params = useParams()
  const adminToken = params.token as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<CheckInData | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null)
  const [lastScanned, setLastScanned] = useState<string>('')
  const [scanError, setScanError] = useState('')
  const [scanSuccess, setScanSuccess] = useState('')

  const fetchData = useCallback(async () => {
    if (!adminToken) return
    try {
      const res = await fetch(`/api/admin/${adminToken}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load')

      // Check if event has ticketing enabled (Pro only)
      if (!json.event.payment_required || !json.event.ticket_price) {
        setError('Ticketing is not enabled for this event. Enable paid tickets in event settings first.')
        return
      }

      setData(json)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load check-in data')
    } finally {
      setLoading(false)
    }
  }, [adminToken])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleScanSuccess = useCallback(async (decodedText: string) => {
    setScanError('')
    setScanSuccess('')
    setLastScanned(decodedText)

    try {
      // Extract ticket code from URL if it's a full URL
      let ticketCode = decodedText
      if (decodedText.includes('/v/')) {
        ticketCode = decodedText.split('/v/')[1]?.split('/')[0] || decodedText
      }

      const response = await fetch(`/api/admin/${adminToken}/tickets/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: ticketCode })
      })

      const result = await response.json()

      if (response.ok) {
        setScanSuccess(`✓ Checked in: ${result.attendee.first_name} ${result.attendee.last_name}`)
        // Refresh the attendee list
        await fetchData()
      } else {
        setScanError(result.error || 'Failed to check in attendee')
      }
    } catch (error) {
      setScanError('Failed to verify ticket')
      console.error('Scan verification error:', error)
    }
  }, [adminToken, fetchData])

  const handleScanError = useCallback((error: any) => {
    // Ignore common scan errors, only show real errors
    if (!error?.includes('NotFoundException')) {
      console.warn('QR scan error:', error)
    }
  }, [])

  const startScanning = () => {
    if (scanning) return

    setScanning(true)
    setScanError('')
    setScanSuccess('')
    setLastScanned('')

    const qrScanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    )

    qrScanner.render(handleScanSuccess, handleScanError)
    setScanner(qrScanner)
  }

  const stopScanning = () => {
    if (scanner) {
      scanner.clear()
      setScanner(null)
    }
    setScanning(false)
    setScanError('')
    setScanSuccess('')
    setLastScanned('')
  }

  const handleManualCheckIn = async (attendeeId: string) => {
    try {
      const response = await fetch(`/api/admin/${adminToken}/tickets/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeId })
      })

      const result = await response.json()

      if (response.ok) {
        setScanSuccess(`✓ Manually checked in: ${result.attendee.first_name} ${result.attendee.last_name}`)
        await fetchData()
      } else {
        setScanError(result.error || 'Failed to check in attendee')
      }
    } catch (error) {
      setScanError('Failed to check in attendee')
      console.error('Manual check-in error:', error)
    }
  }

  if (loading) return <AdminLoadingScreen />
  if (error && !data) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="text-red-400 text-xl mb-4">Access Denied</div>
            <div className="text-white/70 mb-4">{error}</div>
            <Link
              href={`/a/${adminToken}/settings`}
              className="inline-block bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg"
            >
              Go to Event Settings
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const checkedInCount = data?.attendees.filter(a => a.checked_in_at).length || 0
  const totalAttendees = data?.attendees.length || 0

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 min-h-screen p-4 sm:p-8 pb-24">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="text-white">
              <h1 className="text-3xl font-light mb-1">Check-in</h1>
              <p className="text-white/70 text-sm">
                {data?.event.title || 'Event'} • {checkedInCount}/{totalAttendees} checked in
              </p>
            </div>
            <TokenAdminNav token={adminToken} current="check-in" />
          </div>

          {/* Scan Section */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-medium text-white/90 mb-4">Scan Tickets</h2>

            {!scanning ? (
              <button
                onClick={startScanning}
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg font-medium"
              >
                Start Scanning
              </button>
            ) : (
              <div className="space-y-4">
                <div id="qr-reader" className="w-full max-w-md mx-auto"></div>
                <button
                  onClick={stopScanning}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Stop Scanning
                </button>
              </div>
            )}

            {scanSuccess && (
              <div className="mt-4 bg-green-500/20 border border-green-500/30 text-green-100 px-4 py-3 rounded-lg">
                {scanSuccess}
              </div>
            )}

            {scanError && (
              <div className="mt-4 bg-red-500/20 border border-red-500/30 text-red-100 px-4 py-3 rounded-lg">
                {scanError}
              </div>
            )}

            {lastScanned && (
              <div className="mt-4 text-white/60 text-sm">
                Last scanned: {lastScanned}
              </div>
            )}
          </div>

          {/* Attendee List */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-medium text-white/90 mb-4">Attendees</h2>

            {!data?.attendees || data.attendees.length === 0 ? (
              <p className="text-white/60">No attendees yet.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {data.attendees
                  .sort((a, b) => {
                    // Sort by check-in status (checked in first), then by name
                    if (a.checked_in_at && !b.checked_in_at) return -1
                    if (!a.checked_in_at && b.checked_in_at) return 1
                    return a.first_name.localeCompare(b.first_name)
                  })
                  .map((attendee) => (
                  <div
                    key={attendee.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      attendee.checked_in_at
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        {attendee.first_name} {attendee.last_name}
                      </div>
                      {attendee.email && (
                        <div className="text-white/60 text-sm">{attendee.email}</div>
                      )}
                      {attendee.guest_count > 0 && (
                        <div className="text-white/60 text-sm">+{attendee.guest_count} guest{attendee.guest_count > 1 ? 's' : ''}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {attendee.checked_in_at ? (
                        <div className="text-green-400 text-sm">
                          ✓ Checked in
                          <br />
                          <span className="text-white/60">
                            {new Date(attendee.checked_in_at).toLocaleTimeString()}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleManualCheckIn(attendee.id)}
                          className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1 rounded text-sm font-medium"
                        >
                          Check In
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}