'use client'

import { useState, useEffect, useCallback } from 'react'
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
  const [userTier, setUserTier] = useState<string>('free')
  const [archivingEventId, setArchivingEventId] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchUserTier = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUserTier(data.user?.subscription_tier || 'free')
        }
      } catch (err) {
        console.error('Failed to fetch user tier:', err)
      }
    }

    fetchUserTier()
  }, [])

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const statusParam = showArchived ? 'archived' : 'active'
      const response = await fetch(`/api/admin/events?status=${statusParam}`)
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin/login')
          return
        }
        throw new Error(`Error ${response.status}: ${await response.text()}`)
      }
      const data = await response.json()
      
      if (data.note) {
        console.log('API Note:', data.note);
        setError(`Note: ${data.note}`);
      } else {
        setError('')
      }
      
      setEvents(data.events || [])
    } catch (err) {
      console.error('Failed to fetch events:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [router, showArchived])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Check if user has access to advanced analytics (Pro and Enterprise only)
  const hasAdvancedAnalytics = userTier === 'pro' || userTier === 'enterprise'

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date set'
    return new Date(dateString).toLocaleDateString()
  }

  const updateArchiveStatus = async (eventId: string, archived: boolean) => {
    const confirmMessage = archived
      ? 'Archive this event? Archived events are hidden from your active list but still count toward your event limit.'
      : 'Unarchive this event? It will reappear in your active events list.'
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      setArchivingEventId(eventId)
      const response = await fetch(`/api/admin/events/${eventId}/archive`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ archived }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update event status')
      }

      await fetchEvents()
    } catch (err) {
      console.error('Error updating event archive status:', err)
      alert(err instanceof Error ? err.message : 'Failed to update event status')
    } finally {
      setArchivingEventId(null)
    }
  }

  const handleArchiveEvent = (eventId: string) => updateArchiveStatus(eventId, true)
  const handleUnarchiveEvent = (eventId: string) => updateArchiveStatus(eventId, false)

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
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
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
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <button
                onClick={() => setShowArchived(prev => !prev)}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/20"
              >
                {showArchived ? 'View Active Events' : 'View Archived Events'}
              </button>
              <Link
                href="/create"
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-center"
              >
                Create New Event
              </Link>
            </div>
          </div>

          {error && (
            <div className={`p-4 ${error.startsWith('Note:') ? 'bg-blue-500/20 border-blue-500/40' : 'bg-red-500/20 border-red-500/40'} border rounded-xl text-white mb-6`}>
              {error}
            </div>
          )}

          {/* Events List */}
          <div className="glass-card rounded-xl overflow-hidden">
            {showArchived && (
              <div className="px-6 py-4 bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-200 text-sm">
                Archived events are hidden from your active list but still count toward your plan limit. Unarchive an event to make it active again.
              </div>
            )}
            {events.length > 0 ? (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
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
                              {event.admin_token ? (
                                <Link
                                  href={`/a/${event.admin_token}`}
                                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded transition-colors"
                                >
                                  Edit
                                </Link>
                              ) : (
                                <span className="px-3 py-1.5 bg-gray-500/20 text-gray-400 text-sm rounded cursor-not-allowed">
                                  No Admin Token
                                </span>
                              )}
                              {hasAdvancedAnalytics ? (
                                <Link
                                  href={`/admin/events/${event.id}/analytics`}
                                  className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm rounded transition-colors"
                                >
                                  Analytics
                                </Link>
                              ) : (
                                <div className="relative group">
                                  <button
                                    disabled
                                    className="px-3 py-1.5 bg-gray-500/20 text-gray-400 text-sm rounded cursor-not-allowed"
                                    title="Upgrade to Pro or Enterprise to access advanced analytics"
                                  >
                                    Analytics
                                  </button>
                                  <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-gray-700">
                                    Upgrade to Pro or Enterprise to access advanced analytics
                                    <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                </div>
                              )}
                              <Link
                                href={`/e/${event.id}`}
                                target="_blank"
                                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded transition-colors"
                              >
                                View
                              </Link>
                              {showArchived ? (
                                <button
                                  onClick={() => handleUnarchiveEvent(event.id)}
                                  disabled={archivingEventId === event.id}
                                  className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Unarchive this event"
                                >
                                  {archivingEventId === event.id ? 'Restoring...' : 'Unarchive'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleArchiveEvent(event.id)}
                                  disabled={archivingEventId === event.id}
                                  className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Archive this event (still counts toward your limit)"
                                >
                                  {archivingEventId === event.id ? 'Archiving...' : 'Archive'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden">
                  {events.map(event => (
                    <div key={event.id} className="border-b border-white/5 p-4 hover:bg-white/5">
                      <div className="space-y-3">
                        {/* Event Title */}
                        <div className="flex items-start justify-between">
                          <h3 className="text-white font-medium text-lg pr-2">{event.title}</h3>
                          <div className="flex gap-1 flex-wrap">
                            {event.auto_associated && (
                              <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded-full">
                                Auto-linked
                              </span>
                            )}
                            {event.access_type === 'collaborator' && (
                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                                Collaborator
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Event Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-white/50">Attendees:</span>
                            <span className="text-white/70 ml-1">{event.attendee_count || 0}</span>
                          </div>
                          <div>
                            <span className="text-white/50">Created:</span>
                            <span className="text-white/70 ml-1">{formatDate(event.created_at)}</span>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          {event.admin_token ? (
                            <Link
                              href={`/a/${event.admin_token}`}
                              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors flex-1 text-center"
                            >
                              Edit
                            </Link>
                          ) : (
                            <span className="px-3 py-2 bg-gray-500/20 text-gray-400 text-sm rounded-lg cursor-not-allowed flex-1 text-center">
                              No Admin Token
                            </span>
                          )}
                          {hasAdvancedAnalytics ? (
                            <Link
                              href={`/admin/events/${event.id}/analytics`}
                              className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm rounded-lg transition-colors flex-1 text-center"
                            >
                              Analytics
                            </Link>
                          ) : (
                            <div className="relative group flex-1">
                              <button
                                disabled
                                className="w-full px-3 py-2 bg-gray-500/20 text-gray-400 text-sm rounded-lg cursor-not-allowed"
                                title="Upgrade to Pro or Enterprise to access advanced analytics"
                              >
                                Analytics
                              </button>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-gray-700">
                                Upgrade to Pro or Enterprise to access advanced analytics
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          )}
                          <Link
                            href={`/e/${event.id}`}
                            target="_blank"
                            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors flex-1 text-center"
                          >
                            View
                          </Link>
                          {showArchived ? (
                            <button
                              onClick={() => handleUnarchiveEvent(event.id)}
                              disabled={archivingEventId === event.id}
                              className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                              title="Unarchive this event"
                            >
                              {archivingEventId === event.id ? 'Restoring...' : 'Unarchive'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleArchiveEvent(event.id)}
                              disabled={archivingEventId === event.id}
                              className="px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                              title="Archive this event (still counts toward your limit)"
                            >
                              {archivingEventId === event.id ? 'Archiving...' : 'Archive'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${showArchived ? 'bg-yellow-500/20' : 'bg-blue-500/20'}`}>
                  <svg className="w-8 h-8 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">
                  {showArchived ? 'No archived events yet' : 'No events yet'}
                </h3>
                <p className="text-white/70 mb-6">
                  {showArchived ? 'Archived events will appear here. Switch back to view your active events.' : 'Create your first event to start collecting RSVPs.'}
                </p>
                {showArchived ? (
                  <button
                    onClick={() => setShowArchived(false)}
                    className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
                  >
                    View Active Events
                  </button>
                ) : (
                  <Link
                    href="/create"
                    className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl inline-block transition-colors"
                  >
                    Create New Event
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer showDonate={false} />
    </div>
  )
}

