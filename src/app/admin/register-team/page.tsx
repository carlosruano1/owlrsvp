'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'

interface InvitationData {
  valid: boolean
  invitation: {
    email: string
    role: string
    inviter: {
      username: string
      email: string
    }
    admin_tier: string
    expires_at: string
  }
  user_exists: boolean
  user_verified: boolean
}

function RegisterTeamContent() {
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  })
  const [registering, setRegistering] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    const validateInvitation = async () => {
      if (!token) {
        setError('Invalid invitation link')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/admin/team/accept-invitation?token=${token}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Invalid invitation')
          setLoading(false)
          return
        }

        setInvitationData(data)

        // If user already exists, redirect to login
        if (data.user_exists) {
          router.push(`/admin/login?message=An account with ${data.invitation.email} already exists. Please log in to accept the invitation.&invitation_token=${token}`)
          return
        }

        setLoading(false)
      } catch (err) {
        setError('Failed to validate invitation')
        setLoading(false)
      }
    }

    validateInvitation()
  }, [token, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (registering || !invitationData) return

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      setRegistering(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setRegistering(false)
      return
    }

    if (!formData.acceptTerms) {
      setError('You must accept the terms and conditions')
      setRegistering(false)
      return
    }

    setRegistering(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: invitationData.invitation.email,
          password: formData.password,
          invitation_token: token
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Registration successful, the invitation was already accepted in the API
      // Redirect to login so they can log in with their new account
      router.push(`/admin/login?message=Account created successfully! Please log in to access your team dashboard.&invitation_processed=true`)
    } catch (err) {
      console.error('Registration error:', err)
      let errorMessage = err instanceof Error ? err.message : 'Registration failed'

      // Make error messages more user-friendly
      if (errorMessage.includes('Username or email already exists')) {
        errorMessage = 'This username is already taken. Please choose a different username.'
      } else if (errorMessage.includes('username')) {
        errorMessage = 'Username is not available. Please try a different one.'
      }

      setError(errorMessage)
      setRegistering(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bind8-bg" />
        <div className="absolute inset-0 bind8-glow" />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="text-white/80 text-xl">Validating invitation...</div>
        </div>
      </div>
    )
  }

  if (error || !invitationData) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bind8-bg" />
        <div className="absolute inset-0 bind8-glow" />
        <div className="relative z-10 min-h-screen p-4 sm:p-8 pb-24">
          <div className="max-w-md mx-auto pt-20">
            <div className="text-center mb-8">
              <div className="text-white text-glow">
                <h1 className="text-3xl font-light mb-2">Team Invitation</h1>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-normal text-white mb-4">Invalid Invitation</h2>
              <p className="text-white/70 mb-6">{error}</p>
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-normal rounded-xl hover:bg-white/90 transition-all"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bind8-bg" />
      <div className="absolute inset-0 bind8-glow" />
      <div className="relative z-10 min-h-screen p-4 sm:p-8 pb-24">
        <div className="max-w-md mx-auto pt-10">
          <div className="text-center mb-8">
            <div className="text-white text-glow">
              <h1 className="text-3xl font-light mb-2">Join the Team</h1>
              <p className="text-white/80">Create your account to accept the invitation</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-8">
            {/* Invitation Info */}
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-blue-200 font-medium">Team Invitation</span>
              </div>
              <p className="text-white/80 text-sm mb-2">
                <strong>{invitationData.invitation.inviter.username}</strong> invited you to join their team as <strong>{invitationData.invitation.role}</strong>
              </p>
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>You'll get full access to {invitationData.invitation.admin_tier} features!</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {registering && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="bg-gray-900 rounded-2xl p-6 text-center border border-white/20">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-5 h-5 text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <p className="text-white font-medium">Creating your account...</p>
                    <p className="text-white/70 text-sm mt-1">Please wait while we set up your team access</p>
                  </div>
                </div>
              )}
              {/* Email (pre-filled and readonly) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={invitationData.invitation.email}
                  readOnly
                  disabled={registering}
                  className="modern-input w-full px-4 py-2 bg-white/5 cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-white/60 text-xs mt-1">This email was specified in your invitation</p>
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-white/90 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  disabled={registering}
                  className="modern-input w-full px-4 py-2 disabled:opacity-50"
                  placeholder="Choose a username"
                  required
                  minLength={3}
                  maxLength={50}
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  disabled={registering}
                  className="modern-input w-full px-4 py-2 disabled:opacity-50"
                  placeholder="Create a password"
                  required
                  minLength={8}
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  disabled={registering}
                  className="modern-input w-full px-4 py-2 disabled:opacity-50"
                  placeholder="Confirm your password"
                  required
                  minLength={8}
                />
              </div>

              {/* Terms */}
              <div>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => setFormData(prev => ({ ...prev, acceptTerms: e.target.checked }))}
                    disabled={registering}
                    className="mt-1 rounded border-white/20 disabled:opacity-50"
                    required
                  />
                  <span className="text-white/80 text-sm">
                    I accept the <Link href="/terms" className="text-blue-400 hover:text-blue-300 underline">Terms of Service</Link> and <Link href="/privacy" className="text-blue-400 hover:text-blue-300 underline">Privacy Policy</Link>
                  </span>
                </label>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-100 px-4 py-3 rounded-xl text-sm animate-pulse">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{error}</span>
                  </div>
                  <p className="text-red-200 text-xs mt-1">Please correct the error and try again.</p>
                </div>
              )}

              <button
                type="submit"
                disabled={registering}
                className="w-full px-4 py-3 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-all disabled:opacity-50"
              >
                {registering ? 'Creating Account...' : 'Create Account & Join Team'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-white/60 text-sm">
                Already have an account?{' '}
                <Link
                  href={`/admin/login?invitation_token=${token}`}
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Sign in instead
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default function RegisterTeam() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <RegisterTeamContent />
    </Suspense>
  )
}