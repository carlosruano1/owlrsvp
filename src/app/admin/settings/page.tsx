'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'
import AdminNavigation from '@/components/AdminNavigation'
import { getPlanLimits } from '@/lib/plans'

interface AdminUser {
  id: string
  username: string
  email: string
  email_verified: boolean
  subscription_tier: 'free' | 'pro' | 'enterprise'
  subscription_status: 'active' | 'cancelled' | 'past_due'
  max_events: number
  max_attendees_per_event: number
  events_created_count: number
  created_at: string
  last_login?: string
}

interface EventCount {
  actualCount: number
}

export default function AdminSettings() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [actualEventCount, setActualEventCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (!response.ok) {
          router.push('/admin/login')
          return
        }
        const data = await response.json()
        setUser(data.user)
        
        // Fetch actual event count
        const eventsResponse = await fetch('/api/admin/events')
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json()
          setActualEventCount(eventsData.events?.length || 0)
        }
      } catch (err) {
        router.push('/admin/login')
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/admin/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="animated-bg" />
        <div className="spotlight" />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="text-white/80 text-xl">Loading...</div>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="animated-bg" />
        <div className="spotlight" />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-4">Access Denied</div>
            <div className="text-white/70 mb-4">Please log in to access the admin dashboard.</div>
            <Link 
              href="/admin/login"
              className="px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all"
            >
              Sign In
            </Link>
          </div>
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
            <div className="text-white text-glow">
              <h1 className="text-4xl font-bold mb-2">Admin Settings</h1>
              <p className="text-white/80 text-lg">Welcome back, {user.username}!</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right text-white/80">
                <div className="text-sm">Subscription</div>
                <div className="font-semibold capitalize">{user.subscription_tier}</div>
                <div className="text-xs text-white/60 mt-1">
                  Events created: {actualEventCount}
                </div>
                <div className="text-xs text-white/60">
                  Events remaining: {(() => {
                    const planLimits = getPlanLimits(user.subscription_tier)
                    return Math.max(0, planLimits.maxEvents - actualEventCount)
                  })()}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 transition-all text-white"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-400 mb-1">
                    {actualEventCount}
                  </div>
                  <div className="text-white/80">Events Created</div>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-purple-400 mb-1">
                    {user.max_attendees_per_event || (user.subscription_tier === 'free' ? '50' : '150')}
                  </div>
                  <div className="text-white/80">Max Attendees/Event</div>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/create"
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold">Create New Event</div>
                  <div className="text-white/60 text-sm">Start a new RSVP page</div>
                </div>
              </Link>

              <Link
                href="/admin/events"
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold">Manage Events</div>
                  <div className="text-white/60 text-sm">View and edit your events</div>
                </div>
              </Link>
              
              <div 
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                onClick={() => router.push('/admin/events')}
              >
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold">Event Analytics</div>
                  <div className="text-white/60 text-sm">Track RSVPs and insights</div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="glass-card rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-white/60 mb-1">Username</div>
                <div className="font-semibold">{user.username}</div>
              </div>
              <div>
                <div className="text-sm text-white/60 mb-1">Email</div>
                <div className="font-semibold">{user.email}</div>
              </div>
              <div>
                <div className="text-sm text-white/60 mb-1">Subscription Tier</div>
                <div className="font-semibold capitalize">{user.subscription_tier}</div>
              </div>
              <div>
                <div className="text-sm text-white/60 mb-1">Member Since</div>
                <div className="font-semibold">
                  {user.created_at 
                    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade Notice for Free Users */}
          {user.subscription_tier === 'free' && (
            <div className="glass-card rounded-2xl p-8 text-white bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Upgrade Your Account</h3>
                  <p className="text-white/80 mb-4">
                    You're currently on the free plan with {getPlanLimits(user.subscription_tier).maxEvents} events allowed and a limit of {getPlanLimits(user.subscription_tier).maxAttendeesPerEvent} attendees per event. 
                    Upgrade to Pro for more events, up to 150 attendees per event, and advanced features.
                  </p>
                  <button className="px-6 py-3 bg-yellow-500 text-black font-semibold rounded-xl hover:bg-yellow-400 transition-all">
                    Upgrade to Pro (Coming Soon)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
