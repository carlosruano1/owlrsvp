'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'
import AdminLoadingScreen from '@/components/AdminLoadingScreen'
import { getPlanLimits } from '@/lib/plans'

interface AdminUser {
  id: string
  username: string
  email: string
  subscription_tier: string
  max_attendees_per_event: number
}

interface AdminEvent {
  id: string
  title: string
  created_at: string
  attendee_count: number
  admin_token?: string
}

export default function AdminDashboard() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await fetch('/api/auth/me')
        if (!meRes.ok) {
          router.push('/admin/login')
          return
        }
        const meData = await meRes.json()
        setUser(meData.user)

        const eventsRes = await fetch('/api/admin/events?status=active')
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json()
          setEvents(eventsData.events || [])
        }
      } catch {
        router.push('/admin/login')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  if (loading) return <AdminLoadingScreen />
  if (!user) return null

  const planLimits = getPlanLimits(user.subscription_tier)
  const eventsRemaining = planLimits.maxEvents === 999999 ? 'Unlimited' : Math.max(0, planLimits.maxEvents - events.length)
  const totalAttendees = events.reduce((sum, e) => sum + (e.attendee_count || 0), 0)
  const recentEvents = events.slice(0, 5)

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 min-h-screen p-4 sm:p-8 pb-24">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-light text-white mb-1">
                Welcome back, {user.username}
              </h1>
              <p className="text-white/60 text-sm md:text-base">
                Here’s what’s going on with your events
              </p>
            </div>
            <Link
              href="/create"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-xl transition-colors shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create event
            </Link>
          </header>

          {/* Stats */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-5 md:p-6 text-white transition-all hover:border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm font-medium uppercase tracking-wider">Events</p>
                  <p className="text-2xl md:text-3xl font-light mt-1 text-cyan-400">{events.length}</p>
                  <p className="text-white/50 text-xs mt-1">
                    {eventsRemaining === 'Unlimited' ? 'Unlimited' : `${eventsRemaining} remaining`} on plan
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-5 md:p-6 text-white transition-all hover:border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm font-medium uppercase tracking-wider">Total guests</p>
                  <p className="text-2xl md:text-3xl font-light mt-1 text-emerald-400">{totalAttendees}</p>
                  <p className="text-white/50 text-xs mt-1">Across all events</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-5 md:p-6 text-white transition-all hover:border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm font-medium uppercase tracking-wider">Plan</p>
                  <p className="text-2xl md:text-3xl font-light mt-1 capitalize text-white">{user.subscription_tier}</p>
                  <p className="text-white/50 text-xs mt-1">
                    {user.subscription_tier === 'free' ? 'Upgrade for more' : 'Active'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-2xl p-5 md:p-6 text-white transition-all hover:border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm font-medium uppercase tracking-wider">Guests / event</p>
                  <p className="text-2xl md:text-3xl font-light mt-1 text-amber-400">
                    {user.max_attendees_per_event === Infinity ? '∞' : user.max_attendees_per_event}
                  </p>
                  <p className="text-white/50 text-xs mt-1">Max per event</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
          </section>

          {/* Quick actions */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/admin/events"
              className="glass-card rounded-2xl p-5 flex items-center gap-4 text-white hover:border-white/25 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 group-hover:bg-white/15 flex items-center justify-center transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <div>
                <h2 className="font-medium text-lg">My events</h2>
                <p className="text-white/60 text-sm">View, edit, archive, analytics</p>
              </div>
              <svg className="w-5 h-5 text-white/40 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/create"
              className="glass-card rounded-2xl p-5 flex items-center gap-4 text-white hover:border-cyan-500/40 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 group-hover:bg-cyan-500/30 flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h2 className="font-medium text-lg">Create event</h2>
                <p className="text-white/60 text-sm">New RSVP page in seconds</p>
              </div>
              <svg className="w-5 h-5 text-white/40 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/admin/settings"
              className="glass-card rounded-2xl p-5 flex items-center gap-4 text-white hover:border-white/25 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 group-hover:bg-white/15 flex items-center justify-center transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="font-medium text-lg">Settings</h2>
                <p className="text-white/60 text-sm">Account, billing, team</p>
              </div>
              <svg className="w-5 h-5 text-white/40 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </section>

          {/* Recent events */}
          <section className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-4 md:px-6 md:py-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-medium text-white">Recent events</h2>
              <Link
                href="/admin/events"
                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium flex items-center gap-1"
              >
                View all
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            {recentEvents.length > 0 ? (
              <ul className="divide-y divide-white/5">
                {recentEvents.map((event) => (
                  <li key={event.id}>
                    <Link
                      href={event.admin_token ? `/a/${event.admin_token}` : '/admin/events'}
                      className="flex items-center justify-between gap-4 px-5 py-4 md:px-6 md:py-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium truncate">{event.title}</p>
                        <p className="text-white/50 text-sm mt-0.5">
                          {event.attendee_count ?? 0} guests · {new Date(event.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-white/40 text-sm">Edit</span>
                        <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 py-12 md:px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-white/70 mb-1">No events yet</p>
                <p className="text-white/50 text-sm mb-4">Create your first event to start collecting RSVPs</p>
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-xl text-sm font-medium transition-colors"
                >
                  Create event
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
      <Footer showDonate={false} />
    </div>
  )
}
