'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Event, Attendee } from '@/lib/types'
import QRCode from 'qrcode'

interface AdminData {
  event: Event
  attendees: Attendee[]
  stats: {
    totalAttending: number
    totalNotAttending: number
    totalResponses: number
  }
}

export default function AdminDashboard() {
  const params = useParams()
  const adminToken = params.token as string

  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)

  const guestLink = data ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/e/${data.event.id}` : ''

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/admin/${adminToken}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Invalid admin token')
        }

        setData(result)

        // Generate QR code
        if (result.event) {
          const guestUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/e/${result.event.id}`
          const qrUrl = await QRCode.toDataURL(guestUrl)
          setQrCodeUrl(qrUrl)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load admin data')
      } finally {
        setLoading(false)
      }
    }

    if (adminToken) {
      fetchData()
    }
  }, [adminToken])

  const copyGuestLink = async () => {
    try {
      await navigator.clipboard.writeText(guestLink)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const downloadCSV = () => {
    window.open(`/api/admin/${adminToken}/csv`, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900">
        <div className="text-white text-xl">Loading admin dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">Access Denied</div>
          <div className="text-gray-300">Invalid admin token.</div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen p-4 sm:p-8" 
      style={{ backgroundColor: data?.event.background_color || '#1f2937' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🦉 {data?.event.title}</h1>
          <p className="text-gray-300 text-lg">Admin Dashboard</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {data?.stats.totalAttending || 0}
            </div>
            <div className="text-gray-600">Attending</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {data?.stats.totalNotAttending || 0}
            </div>
            <div className="text-gray-600">Not Attending</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {data?.stats.totalResponses || 0}
            </div>
            <div className="text-gray-600">Total Responses</div>
          </div>
        </div>

        {/* Share Section */}
        <div className="bg-white rounded-2xl p-8 shadow-xl mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Share Event</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Guest Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guest RSVP Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={guestLink}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={copyGuestLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {copySuccess ? '✅' : '📋'}
                </button>
              </div>
            </div>

            {/* QR Code */}
            <div className="text-center">
              <div className="text-sm font-medium text-gray-700 mb-2">QR Code</div>
              {qrCodeUrl && (
                <img 
                  src={qrCodeUrl} 
                  alt="Event QR Code" 
                  className="mx-auto border border-gray-200 rounded-lg"
                  width={150}
                  height={150}
                />
              )}
            </div>
          </div>
        </div>

        {/* Attendees List */}
        <div className="bg-white rounded-2xl p-8 shadow-xl mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">RSVPs</h2>
            <button
              onClick={downloadCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              📊 Download CSV
            </button>
          </div>

          {data?.attendees && data.attendees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Party Size</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">RSVP Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.attendees.map((attendee) => (
                    <tr key={attendee.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {attendee.first_name} {attendee.last_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          attendee.attending 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {attendee.attending ? '✅ Yes' : '❌ No'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {attendee.attending ? 1 + attendee.guest_count : 0}
                        {attendee.guest_count > 0 && attendee.attending && (
                          <span className="text-gray-500 text-sm ml-1">
                            (1 + {attendee.guest_count})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {new Date(attendee.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No RSVPs yet. Share the guest link to start receiving responses!
            </div>
          )}
        </div>

        {/* Donate Button */}
        <div className="text-center">
          <a
            href="https://buymeacoffee.com/owlrsvp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
          >
            ☕ Donate a Coffee
          </a>
        </div>
      </div>
    </div>
  )
}
