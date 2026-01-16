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
  totp_enabled?: boolean
}

interface EventCount {
  actualCount: number
}

export default function AdminSettings() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [actualEventCount, setActualEventCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [passwordChangeOpen, setPasswordChangeOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [totpEnabled, setTotpEnabled] = useState(false)
  const [disablingTOTP, setDisablingTOTP] = useState(false)
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
        setTotpEnabled(data.user?.totp_enabled || false)
        
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    setPasswordLoading(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Password change failed')
      }

      setPasswordSuccess('Password changed successfully!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => {
        setPasswordChangeOpen(false)
        setPasswordSuccess('')
      }, 2000)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Password change failed')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDisableTOTP = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return
    }

    setDisablingTOTP(true)
    setError('')

    try {
      const response = await fetch('/api/auth/disable-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disable TOTP')
      }

      setTotpEnabled(false)
      if (user) {
        setUser({ ...user, totp_enabled: false })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable TOTP')
    } finally {
      setDisablingTOTP(false)
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
              className="px-6 py-3 bg-white text-black font-normal rounded-xl hover:bg-white/90 transition-all"
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
      <div className="absolute inset-0 bind8-bg" />
      <div className="absolute inset-0 bind8-glow" />
      <div className="relative z-10 min-h-screen p-4 sm:p-8 pb-24">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="text-white text-glow">
              <h1 className="text-4xl font-light mb-2">Admin Settings</h1>
              <p className="text-white/80 text-lg">Welcome back, {user.username}!</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right text-white/80">
                <div className="text-sm">Subscription</div>
                <div className="font-normal capitalize">{user.subscription_tier}</div>
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
                  <div className="text-3xl font-light text-cyan-400 mb-1">
                    {actualEventCount}
                  </div>
                  <div className="text-white/80">Events Created</div>
                </div>
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-light text-teal-400 mb-1">
                    {user.max_attendees_per_event || (user.subscription_tier === 'free' ? '50' : '150')}
                  </div>
                  <div className="text-white/80">Max Attendees/Event</div>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-light mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/create"
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <div className="font-normal">Create New Event</div>
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
                  <div className="font-normal">Manage Events</div>
                  <div className="text-white/60 text-sm">View and edit your events</div>
                </div>
              </Link>
              
              <div 
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                onClick={() => router.push('/admin/events')}
              >
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-normal">Event Analytics</div>
                  <div className="text-white/60 text-sm">Track RSVPs and insights</div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="glass-card rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-light mb-6">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-white/60 mb-1">Username</div>
                <div className="font-normal">{user.username}</div>
              </div>
              <div>
                <div className="text-sm text-white/60 mb-1">Email</div>
                <div className="font-normal">{user.email}</div>
              </div>
              <div>
                <div className="text-sm text-white/60 mb-1">Subscription Tier</div>
                <div className="font-normal capitalize">{user.subscription_tier}</div>
              </div>
              <div>
                <div className="text-sm text-white/60 mb-1">Member Since</div>
                <div className="font-normal">
                  {user.created_at 
                    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Account Security */}
          <div className="glass-card rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-light mb-6">Account Security</h2>
            
            {/* Password Change */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-normal mb-1">Password</h3>
                  <p className="text-white/60 text-sm">Change your account password</p>
                </div>
                <button
                  onClick={() => {
                    setPasswordChangeOpen(!passwordChangeOpen)
                    setPasswordError('')
                    setPasswordSuccess('')
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                  }}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 transition-all text-white text-sm"
                >
                  {passwordChangeOpen ? 'Cancel' : 'Change Password'}
                </button>
              </div>

              {passwordChangeOpen && (
                <form onSubmit={handlePasswordChange} className="space-y-4 mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-white/90 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="modern-input w-full px-4 py-2"
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-white/90 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="modern-input w-full px-4 py-2"
                      placeholder="Enter new password (min 8 characters)"
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="modern-input w-full px-4 py-2"
                      placeholder="Confirm new password"
                      required
                      minLength={8}
                    />
                  </div>
                  {passwordError && (
                    <div className="bg-red-500/20 border border-red-500/30 text-red-100 px-4 py-2 rounded-xl text-sm">
                      {passwordError}
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="bg-green-500/20 border border-green-500/30 text-green-100 px-4 py-2 rounded-xl text-sm">
                      {passwordSuccess}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full py-2 px-4 rounded-xl bg-white text-black font-medium transition-all hover:bg-white/90 disabled:opacity-50"
                  >
                    {passwordLoading ? 'Changing Password...' : 'Update Password'}
                  </button>
                </form>
              )}
            </div>

            {/* TOTP / Two-Factor Authentication */}
            <div className="border-t border-white/10 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-normal mb-1">Two-Factor Authentication</h3>
                  <p className="text-white/60 text-sm">
                    {totpEnabled 
                      ? 'Authenticator app is enabled for your account'
                      : 'Add an extra layer of security with an authenticator app'
                    }
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {totpEnabled ? (
                    <>
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium">
                        Enabled
                      </span>
                      <button
                        onClick={handleDisableTOTP}
                        disabled={disablingTOTP}
                        className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-all text-red-300 text-sm disabled:opacity-50"
                      >
                        {disablingTOTP ? 'Disabling...' : 'Disable'}
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/admin/setup-totp"
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 transition-all text-white text-sm"
                    >
                      Setup Authenticator
                    </Link>
                  )}
                </div>
              </div>
              {totpEnabled && (
                <div className="mt-4 p-4 bg-cyan-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-white/80 text-sm">
                    <strong>Note:</strong> With TOTP enabled, password resets will require your authenticator code instead of email.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Upgrade Notice for Free Users */}
          {user.subscription_tier === 'free' && (
            <div className="glass-card rounded-2xl p-8 text-white bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-normal mb-2">Upgrade Your Account</h3>
                  <p className="text-white/80 mb-4">
                    You're currently on the free plan with {getPlanLimits(user.subscription_tier).maxEvents} events allowed and a limit of {getPlanLimits(user.subscription_tier).maxAttendeesPerEvent} attendees per event. 
                    Upgrade to unlock more events, custom branding, advanced analytics, and higher attendee limits.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => router.push('/checkout?plan=basic')}
                      className="px-6 py-3 bg-cyan-500 text-white font-normal rounded-xl hover:bg-blue-600 transition-all"
                    >
                      Upgrade to Basic ($9/mo)
                    </button>
                    <button 
                      onClick={() => router.push('/checkout?plan=pro')}
                      className="px-6 py-3 bg-cyan-500 text-black font-normal rounded-xl hover:bg-yellow-400 transition-all"
                    >
                      Upgrade to Pro ($29/mo)
                    </button>
                  </div>
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
