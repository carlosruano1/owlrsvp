'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [requiresTOTP, setRequiresTOTP] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, totpCode: totpCode || undefined })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Request failed')
      }

      // If TOTP is required, show TOTP input
      if (data.requiresTOTP && !totpCode) {
        setRequiresTOTP(true)
        setSuccess('Please enter your authenticator app code')
        return
      }

      // If reset token is returned, redirect to reset page
      if (data.resetToken) {
        router.push(`/admin/reset-password?token=${encodeURIComponent(data.resetToken)}`)
        return
      }

      // Email-based reset
      setSuccess('If your email is registered, you will receive a password reset link shortly.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="animated-bg" />
      <div className="spotlight" />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 text-white text-glow">
            <h1 className="text-4xl font-semibold mb-2 tracking-tight">Reset Password</h1>
            <p className="text-white/80 text-lg font-light">
              {requiresTOTP ? 'Enter your authenticator code' : 'Enter your email to reset your password'}
            </p>
          </div>

          <div className="glass-card rounded-3xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="modern-input w-full px-4 py-3"
                  placeholder="Enter your email"
                  required
                  disabled={requiresTOTP}
                />
              </div>

              {requiresTOTP && (
                <div>
                  <label htmlFor="totpCode" className="block text-sm font-medium text-white/90 mb-2">
                    Authenticator Code
                  </label>
                  <input
                    type="text"
                    id="totpCode"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="modern-input w-full px-4 py-3 text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    required
                    autoFocus
                  />
                  <p className="text-white/60 text-xs mt-2">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-100 px-4 py-3 rounded-xl backdrop-blur-sm text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-500/20 border border-green-500/30 text-green-100 px-4 py-3 rounded-xl backdrop-blur-sm text-sm">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-white text-black font-medium transition-all hover:bg-white/90 disabled:opacity-50 disabled:hover:bg-white"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  requiresTOTP ? 'Verify & Continue' : 'Request Reset'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link 
                href="/admin/login" 
                className="text-white/70 hover:text-white/90 text-sm"
              >
                Back to Login
              </Link>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link 
              href="/" 
              className="text-white/60 hover:text-white/80 text-sm"
            >
              ← Back to OwlRSVP
            </Link>
          </div>
        </div>
      </div>
      <Footer showDonate={false} />
    </div>
  )
}

