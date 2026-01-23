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
  const [step, setStep] = useState<'email' | 'method'>('email')
  const [resetMethod, setResetMethod] = useState<'email' | 'totp'>('totp')
  const router = useRouter()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      console.log('[Forgot Password Frontend] Received response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Request failed')
      }

      // If TOTP is enabled, show method choice
      if (data.totpEnabled) {
        console.log('[Forgot Password Frontend] TOTP enabled, showing method selection')
        setStep('method')
        setLoading(false)
        return
      }

      // If TOTP is not enabled, email was sent
      console.log('[Forgot Password Frontend] TOTP not enabled, showing email sent message')
      setSuccess('If your email is registered, you will receive a password reset link shortly.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const handleMethodSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // If TOTP method is selected but no code provided, require it
      if (resetMethod === 'totp' && !totpCode) {
        setSuccess('Please enter your authenticator code')
        setLoading(false)
        return
      }

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          totpCode: resetMethod === 'totp' ? totpCode : undefined,
          method: resetMethod
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Request failed')
      }

      // If reset token is returned (TOTP method), redirect to reset page
      if (data.resetToken) {
        router.push(`/admin/reset-password?token=${encodeURIComponent(data.resetToken)}`)
        return
      }

      // Email-based reset completed
      setSuccess('If your email is registered, you will receive a password reset link shortly.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bind8-bg" />
      <div className="absolute inset-0 bind8-glow" />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 text-white text-glow">
            <h1 className="text-4xl font-semibold mb-2 tracking-tight">Reset Password</h1>
            <p className="text-white/80 text-lg font-light">
              {success && !success.includes('Choose') ? 'Check your email for reset instructions' :
               step === 'method' ? 'Choose how to reset your password' :
               'Enter your email to reset your password'}
            </p>
          </div>

          <div className="glass-card rounded-3xl p-8 shadow-2xl">
            {success && !success.includes('Choose') ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">Reset Link Sent</h2>
                  <p className="text-white/70 text-sm">
                    If an account exists for <span className="font-medium">{email}</span>, you will receive a password reset link shortly.
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <Link
                    href="/admin/login"
                    className="block w-full text-center py-3 px-6 rounded-xl bg-white text-black font-medium transition-all hover:bg-white/90"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={step === 'email' ? handleEmailSubmit : handleMethodSubmit} className="space-y-6">
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
                    disabled={step !== 'email'}
                  />
                </div>

                {step === 'method' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-3">
                        Reset Method
                      </label>
                      <div className="space-y-2">
                        <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          resetMethod === 'totp'
                            ? 'bg-cyan-500/10 border-cyan-400/50 ring-1 ring-cyan-400/20'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}>
                          <input
                            type="radio"
                            name="resetMethod"
                            value="totp"
                            checked={resetMethod === 'totp'}
                            onChange={(e) => setResetMethod(e.target.value as 'totp')}
                            className="text-cyan-400 focus:ring-cyan-400"
                          />
                          <div className="flex-1">
                            <div className="text-white/90 font-medium">Authenticator App</div>
                            <div className="text-white/60 text-sm">Use your 2FA app for instant reset</div>
                          </div>
                          <div className="text-cyan-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </label>
                        <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          resetMethod === 'email'
                            ? 'bg-cyan-500/10 border-cyan-400/50 ring-1 ring-cyan-400/20'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}>
                          <input
                            type="radio"
                            name="resetMethod"
                            value="email"
                            checked={resetMethod === 'email'}
                            onChange={(e) => setResetMethod(e.target.value as 'email')}
                            className="text-cyan-400 focus:ring-cyan-400"
                          />
                          <div className="flex-1">
                            <div className="text-white/90 font-medium">Email Link</div>
                            <div className="text-white/60 text-sm">Receive a reset link via email</div>
                          </div>
                          <div className="text-white/60">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </label>
                      </div>
                    </div>

                    {resetMethod === 'totp' && (
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
                          required={resetMethod === 'totp'}
                          autoFocus
                        />
                        <p className="text-white/60 text-xs mt-2">
                          Enter the 6-digit code from your authenticator app
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 text-red-100 px-4 py-3 rounded-xl backdrop-blur-sm text-sm">
                    {error}
                  </div>
                )}

                {success && step === 'method' && (
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
                    step === 'email' ? 'Continue' :
                    resetMethod === 'totp' ? 'Verify & Continue' :
                    'Send Reset Link'
                  )}
                </button>
              </form>
            )}

            {!success && (
              <div className="mt-6 text-center">
                <Link
                  href="/admin/login"
                  className="text-white/70 hover:text-white/90 text-sm"
                >
                  Back to Login
                </Link>
              </div>
            )}
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

