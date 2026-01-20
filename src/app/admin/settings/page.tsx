'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'
import AdminNavigation from '@/components/AdminNavigation'
import { getPlanLimits } from '@/lib/plans'
import { PLANS, PLAN_DETAILS } from '@/lib/stripe'

interface AdminUser {
  id: string
  username: string
  email: string
  email_verified: boolean
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise'
  subscription_status: 'active' | 'cancelled' | 'past_due'
  max_events: number
  max_attendees_per_event: number
  events_created_count: number
  created_at: string
  last_login?: string
  totp_enabled?: boolean
}

type Tab = 'account' | 'security' | 'subscription' | 'danger'

export default function AdminSettings() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [actualEventCount, setActualEventCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('account')
  const router = useRouter()

  // Account tab state
  const [editingEmail, setEditingEmail] = useState(false)
  const [editingUsername, setEditingUsername] = useState(false)
  const [emailValue, setEmailValue] = useState('')
  const [usernameValue, setUsernameValue] = useState('')
  const [accountLoading, setAccountLoading] = useState(false)
  const [accountError, setAccountError] = useState('')
  const [accountSuccess, setAccountSuccess] = useState('')

  // Security tab state
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

  // Subscription tab state
  const [billingPortalLoading, setBillingPortalLoading] = useState(false)

  // Danger zone state
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

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
        setEmailValue(data.user?.email || '')
        setUsernameValue(data.user?.username || '')
        
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

  // Account tab handlers
  const handleUpdateEmail = async () => {
    if (!emailValue || emailValue === user?.email) {
      setEditingEmail(false)
      return
    }

    setAccountLoading(true)
    setAccountError('')
    setAccountSuccess('')

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: emailValue })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update email')
      }

      setAccountSuccess('Email updated successfully! Please verify your new email address.')
      if (user) {
        setUser({ ...user, email: emailValue, email_verified: false })
      }
      setEditingEmail(false)
      setTimeout(() => setAccountSuccess(''), 3000)
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : 'Failed to update email')
    } finally {
      setAccountLoading(false)
    }
  }

  const handleUpdateUsername = async () => {
    if (!usernameValue || usernameValue === user?.username) {
      setEditingUsername(false)
      return
    }

    setAccountLoading(true)
    setAccountError('')
    setAccountSuccess('')

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: usernameValue })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update username')
      }

      setAccountSuccess('Username updated successfully!')
      if (user) {
        setUser({ ...user, username: usernameValue })
      }
      setEditingUsername(false)
      setTimeout(() => setAccountSuccess(''), 3000)
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : 'Failed to update username')
    } finally {
      setAccountLoading(false)
    }
  }

  // Security tab handlers
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

  // Subscription tab handlers
  const handleBillingPortal = async () => {
    setBillingPortalLoading(true)
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/admin/settings`
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal')
      setBillingPortalLoading(false)
    }
  }

  // Danger zone handlers
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      setError('Please type DELETE to confirm')
      return
    }

    if (!confirm('Are you absolutely sure? This action cannot be undone. All your events, attendees, and data will be permanently deleted.')) {
      return
    }

    setDeleting(true)
    setError('')

    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account')
      }

      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account')
      setDeleting(false)
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

  if (!user) {
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

  const tabs: { id: Tab; label: string; icon: React.ReactElement }[] = [
    {
      id: 'account',
      label: 'Account',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      id: 'security',
      label: 'Security',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      id: 'subscription',
      label: 'Subscription',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      id: 'danger',
      label: 'Danger Zone',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    }
  ]

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bind8-bg" />
      <div className="absolute inset-0 bind8-glow" />
      <div className="relative z-10 min-h-screen p-4 sm:p-8 pb-24">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="text-white text-glow">
              <h1 className="text-4xl font-light mb-2">Account Settings</h1>
              <p className="text-white/80 text-lg">Manage your account and preferences</p>
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
                    {user.max_attendees_per_event || (user.subscription_tier === 'free' ? '25' : '200')}
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

          {/* Tabs */}
          <div className="glass-card rounded-2xl p-2">
            <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2 mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Error/Success Messages */}
            {(error || accountError || accountSuccess) && (
              <div className="mb-6">
                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 text-red-100 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}
                {accountError && (
                  <div className="bg-red-500/20 border border-red-500/30 text-red-100 px-4 py-3 rounded-xl text-sm">
                    {accountError}
                  </div>
                )}
                {accountSuccess && (
                  <div className="bg-green-500/20 border border-green-500/30 text-green-100 px-4 py-3 rounded-xl text-sm">
                    {accountSuccess}
                  </div>
                )}
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6 text-white">
                <div>
                  <h2 className="text-2xl font-light mb-6">Account Information</h2>
                  
                  {/* Email */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Email Address
                    </label>
                    {editingEmail ? (
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={emailValue}
                          onChange={(e) => setEmailValue(e.target.value)}
                          className="modern-input flex-1 px-4 py-2"
                          placeholder="Enter email address"
                          disabled={accountLoading}
                        />
                        <button
                          onClick={handleUpdateEmail}
                          disabled={accountLoading || !emailValue || emailValue === user.email}
                          className="px-4 py-2 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-all disabled:opacity-50"
                        >
                          {accountLoading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingEmail(false)
                            setEmailValue(user.email)
                            setAccountError('')
                          }}
                          disabled={accountLoading}
                          className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 transition-all text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                        <span>{user.email}</span>
                        {!user.email_verified && (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                            Unverified
                          </span>
                        )}
                        <button
                          onClick={() => setEditingEmail(true)}
                          className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 transition-all text-white text-sm"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Username */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Username
                    </label>
                    {editingUsername ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={usernameValue}
                          onChange={(e) => setUsernameValue(e.target.value)}
                          className="modern-input flex-1 px-4 py-2"
                          placeholder="Enter username"
                          minLength={3}
                          maxLength={50}
                          disabled={accountLoading}
                        />
                        <button
                          onClick={handleUpdateUsername}
                          disabled={accountLoading || !usernameValue || usernameValue === user.username}
                          className="px-4 py-2 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-all disabled:opacity-50"
                        >
                          {accountLoading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingUsername(false)
                            setUsernameValue(user.username)
                            setAccountError('')
                          }}
                          disabled={accountLoading}
                          className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 transition-all text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                        <span>{user.username}</span>
                        <button
                          onClick={() => setEditingUsername(true)}
                          className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 transition-all text-white text-sm"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Member Since */}
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Member Since
                    </label>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      {user.created_at 
                        ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                        : 'N/A'
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6 text-white">
                <div>
                  <h2 className="text-2xl font-light mb-6">Security Settings</h2>
                  
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
              </div>
            )}

            {/* Subscription Tab */}
            {activeTab === 'subscription' && (
              <div className="space-y-6 text-white">
                <div>
                  <h2 className="text-2xl font-light mb-6">Subscription & Billing</h2>
                  
                  {/* Current Plan */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Current Plan
                    </label>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-normal text-lg capitalize">{user.subscription_tier}</div>
                          <div className="text-white/60 text-sm mt-1">
                            {user.subscription_tier === 'free' 
                              ? 'Free plan with limited features'
                              : `$${PLAN_DETAILS[user.subscription_tier as keyof typeof PLAN_DETAILS]?.price || 0}/month`
                            }
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          user.subscription_status === 'active' 
                            ? 'bg-green-500/20 text-green-400'
                            : user.subscription_status === 'cancelled'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {user.subscription_status === 'active' ? 'Active' : user.subscription_status === 'cancelled' ? 'Cancelled' : 'Past Due'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Plan Limits */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Plan Limits
                    </label>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-white/80">Max Events</span>
                        <span className="font-normal">
                          {(() => {
                            const planLimits = getPlanLimits(user.subscription_tier)
                            return planLimits.maxEvents === 999999 ? 'Unlimited' : planLimits.maxEvents
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">Max Attendees per Event</span>
                        <span className="font-normal">
                          {(() => {
                            const planLimits = getPlanLimits(user.subscription_tier)
                            return planLimits.maxAttendeesPerEvent === Infinity ? 'Unlimited' : planLimits.maxAttendeesPerEvent
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">Events Created</span>
                        <span className="font-normal">{actualEventCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment & Billing */}
                  {user.subscription_tier !== 'free' && (
                    <div className="mb-6">
                      <h3 className="text-lg font-normal mb-4">Payment & Billing</h3>
                      <button
                        onClick={handleBillingPortal}
                        disabled={billingPortalLoading}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 transition-all text-white disabled:opacity-50"
                      >
                        {billingPortalLoading ? 'Opening...' : 'Manage Payment Methods & Billing'}
                      </button>
                      <p className="text-white/60 text-sm mt-2">
                        Update payment methods, view invoices, and manage your subscription
                      </p>
                    </div>
                  )}

                  {/* Upgrade Options */}
                  {user.subscription_tier === 'free' && (
                    <div className="mb-6">
                      <h3 className="text-lg font-normal mb-4">Upgrade Your Plan</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          onClick={() => router.push('/checkout?plan=basic')}
                          className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-left"
                        >
                          <div className="font-normal text-lg mb-1">Basic</div>
                          <div className="text-2xl font-light mb-2">$9<span className="text-sm text-white/60">/mo</span></div>
                          <div className="text-white/60 text-sm">5 events, custom branding, up to 200 attendees</div>
                        </button>
                        <button
                          onClick={() => router.push('/checkout?plan=pro')}
                          className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-left"
                        >
                          <div className="font-normal text-lg mb-1">Pro</div>
                          <div className="text-2xl font-light mb-2">$29<span className="text-sm text-white/60">/mo</span></div>
                          <div className="text-white/60 text-sm">25 events, advanced analytics, up to 1,000 attendees</div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Downgrade/Upgrade for paid users */}
                  {user.subscription_tier !== 'free' && (
                    <div className="mb-6">
                      <h3 className="text-lg font-normal mb-4">Change Plan</h3>
                      <p className="text-white/60 text-sm mb-4">
                        To upgrade, downgrade, or cancel your subscription, use the billing portal.
                      </p>
                      <button
                        onClick={handleBillingPortal}
                        disabled={billingPortalLoading}
                        className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 transition-all text-white disabled:opacity-50"
                      >
                        {billingPortalLoading ? 'Opening...' : 'Open Billing Portal'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <div className="space-y-6 text-white">
                <div>
                  <h2 className="text-2xl font-light mb-6 text-red-400">Danger Zone</h2>
                  
                  <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <h3 className="text-lg font-normal mb-2 text-red-300">Delete Account</h3>
                    <p className="text-white/80 text-sm mb-4">
                      Once you delete your account, there is no going back. This will permanently delete:
                    </p>
                    <ul className="list-disc list-inside text-white/70 text-sm mb-4 space-y-1">
                      <li>All your events and RSVP pages</li>
                      <li>All attendee data and responses</li>
                      <li>Your subscription (if active)</li>
                      <li>All account information</li>
                    </ul>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        placeholder="Type DELETE to confirm"
                        className="modern-input w-full px-4 py-2"
                        disabled={deleting}
                      />
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleting || deleteConfirm !== 'DELETE'}
                        className="w-full px-4 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleting ? 'Deleting Account...' : 'Delete My Account'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
