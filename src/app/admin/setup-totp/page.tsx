'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'

export default function SetupTOTP() {
  const [qrCode, setQrCode] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [setupLoading, setSetupLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (!response.ok) {
          router.push('/admin/login')
        }
      } catch (err) {
        router.push('/admin/login')
      }
    }
    checkAuth()
  }, [router])

  const handleSetup = async () => {
    setError('')
    setSuccess('')
    setSetupLoading(true)

    try {
      const response = await fetch('/api/auth/setup-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Setup failed')
      }

      setQrCode(data.qrCode)
      setSuccess('Scan the QR code with your authenticator app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed')
    } finally {
      setSetupLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (!totpCode || totpCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/verify-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: totpCode })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      setSuccess('TOTP enabled successfully! Redirecting...')
      setTimeout(() => {
        router.push('/admin/settings')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
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
            <h1 className="text-4xl font-semibold mb-2 tracking-tight">Setup Authenticator</h1>
            <p className="text-white/80 text-lg font-light">
              Enable two-factor authentication for your account
            </p>
          </div>

          <div className="glass-card rounded-3xl p-8 shadow-2xl">
            {!qrCode ? (
              <div className="space-y-6">
                <div className="bg-blue-500/20 border border-blue-500/30 text-blue-100 px-4 py-3 rounded-xl backdrop-blur-sm text-sm">
                  <p className="font-medium mb-2">What is this?</p>
                  <p>Authenticator apps (like Google Authenticator, Authy, or Microsoft Authenticator) generate secure codes for password resets and login verification.</p>
                </div>

                <button
                  onClick={handleSetup}
                  disabled={setupLoading}
                  className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-white text-black font-medium transition-all hover:bg-white/90 disabled:opacity-50 disabled:hover:bg-white"
                >
                  {setupLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Generating QR Code...</span>
                    </>
                  ) : (
                    'Generate QR Code'
                  )}
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerify} className="space-y-6">
                <div className="text-center">
                  <p className="text-white/90 mb-4 text-sm">
                    Scan this QR code with your authenticator app:
                  </p>
                  <div className="bg-white p-4 rounded-xl inline-block">
                    <img src={qrCode} alt="TOTP QR Code" className="w-48 h-48" />
                  </div>
                  <p className="text-white/60 text-xs mt-4">
                    Popular apps: Google Authenticator, Authy, Microsoft Authenticator
                  </p>
                </div>

                <div>
                  <label htmlFor="totpCode" className="block text-sm font-medium text-white/90 mb-2">
                    Enter Verification Code
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
                      <span>Verifying...</span>
                    </>
                  ) : (
                    'Verify & Enable'
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link
                href="/admin/settings"
                className="text-white/70 hover:text-white/90 text-sm"
              >
                Back to Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer showDonate={false} />
    </div>
  )
}