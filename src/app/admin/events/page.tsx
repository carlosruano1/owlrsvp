'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'

interface AdminEvent {
  id: string
  title: string
  created_at: string
  attendee_count: number
  admin_token?: string
  created_by_admin_id?: string
  access_type?: 'owner' | 'collaborator'
  auto_associated?: boolean
}

export default function AdminEvents() {
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/events')
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/admin/login')
            return
          }
          throw new Error(`Error ${response.status}: ${await response.text()}`)
        }
        const data = await response.json()
        
        // Check if we have a notification message from the API
        if (data.note) {
          console.log('API Note:', data.note);
          setError(`Note: ${data.note}`);
        }
        
        setEvents(data.events || [])
      } catch (err) {
        console.error('Failed to fetch events:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [router])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date set'
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="animated-bg" />
        <div className="spotlight" />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="text-white/80 text-xl">Loading events...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="animated-bg" />
      <div className="spotlight" />
      <div className="relative z-10 min-h-screen p-4 sm:p-8 pb-24">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="text-white">
              <Link href="/admin/settings" className="text-white/60 hover:text-white flex items-center gap-2 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Settings
              </Link>
              <h1 className="text-4xl font-bold mb-2">My Events</h1>
              <p className="text-white/70">Manage and analyze your events</p>
            </div>
            <Link
              href="/create"
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
            >
              Create New Event
            </Link>
          </div>

          {error && (
            <div className={`p-4 ${error.startsWith('Note:') ? 'bg-blue-500/20 border-blue-500/40' : 'bg-red-500/20 border-red-500/40'} border rounded-xl text-white mb-6`}>
              {error}
            </div>
          )}

          {/* Events Table */}
          <div className="glass-card rounded-xl overflow-hidden">
            {events.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Event Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Attendees</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white/70">Created</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-white/70">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map(event => (
                      <tr key={event.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-6 py-4 text-white">
                          {event.title}
                          {event.auto_associated && (
                            <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded-full">
                              Auto-linked
                            </span>
                          )}
                          {event.access_type === 'collaborator' && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                              Collaborator
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-white/70">{event.attendee_count || 0}</td>
                        <td className="px-6 py-4 text-white/70">{formatDate(event.created_at)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <Link
                              href={`/a/${event.admin_token}`}
                              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded transition-colors"
                            >
                              Edit
                            </Link>
                            <Link
                              href={`/admin/events/${event.id}/analytics`}
                              className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm rounded transition-colors"
                            >
                              Analytics
                            </Link>
                            <Link
                              href={`/e/${event.id}`}
                              target="_blank"
                              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded transition-colors"
                            >
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">No events yet</h3>
                <p className="text-white/70 mb-6">Create your first event to get started</p>
                <Link
                  href="/create"
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl inline-block transition-colors"
                >
                  Create New Event
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer showDonate={false} />
    </div>
  )
}

