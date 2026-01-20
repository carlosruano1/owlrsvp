'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'

// Loading component for Suspense fallback
function Loading() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="animated-bg" />
      <div className="spotlight" />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="text-white/80 text-xl flex items-center gap-3">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </div>
      </div>
    </div>
  )
}

// Main component wrapped with Suspense
export default function MagicLoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MagicLogin />
    </Suspense>
  )
}

function MagicLogin() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [validatingToken, setValidatingToken] = useState(false)
  const [tokenValidated, setTokenValidated] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  // If token is provided, validate it
  useEffect(() => {
    if (token) {
      validateToken(token)
    }
  }, [token])

  const validateToken = async (token: string) => {
    setValidatingToken(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/validate-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Invalid or expired magic link')
      }
      
      setTokenValidated(true)
      
      // Redirect to admin dashboard after successful login
      setTimeout(() => {
        router.push('/admin/events')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate magic link')
    } finally {
      setValidatingToken(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send magic link')
      }
      
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
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
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-semibold text-white mb-3 tracking-tight text-glow">Magic Login</h1>
            <p className="text-white/80 text-lg font-light text-glow">Simple, passwordless access</p>
          </div>

          {/* Form Card */}
          <div className="glass-card rounded-3xl p-8 shadow-2xl">
            {token ? (
              // Token validation view
              <div className="text-center">
                {validatingToken ? (
                  <div className="py-8">
                    <div className="animate-spin h-12 w-12 border-4 border-white/20 border-t-white rounded-full mx-auto mb-4"></div>
                    <p className="text-white/80">Validating your magic link...</p>
                  </div>
                ) : tokenValidated ? (
                  <div className="py-8">
                    <div className="h-16 w-16 bg-green-500/20 text-green-300 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-medium text-white mb-2">Login Successful!</h2>
                    <p className="text-white/60 mb-4">You're being redirected to your dashboard...</p>
                  </div>
                ) : (
                  <div className="py-8">
                    <div className="h-16 w-16 bg-red-500/20 text-red-300 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-medium text-white mb-2">Invalid Magic Link</h2>
                    <p className="text-white/60 mb-6">{error || 'This link has expired or is invalid.'}</p>
                    <Link href="/magic-login" className="modern-button px-6 py-3 inline-block">
                      Try Again
                    </Link>
                  </div>
                )}
              </div>
            ) : sent ? (
              // Success view after sending magic link
              <div className="text-center py-8">
                <div className="h-16 w-16 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-medium text-white mb-2">Check Your Email</h2>
                <p className="text-white/60 mb-2">We've sent a magic link to:</p>
                <p className="text-white font-medium mb-6">{email}</p>
                <p className="text-white/40 text-sm">
                  Click the link in the email to sign in. The link will expire in 1 hour.
                </p>
                <button 
                  onClick={() => setSent(false)}
                  className="text-white/60 hover:text-white text-sm mt-8 underline"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              // Initial form view
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="modern-input w-full px-4 py-4"
                    required
                  />
                </div>
                
                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 text-red-100 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-white text-black font-medium transition-all hover:bg-white/90 disabled:opacity-50 disabled:hover:bg-white"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Sending...</span>
                    </>
                  ) : (
                    'Send Magic Link'
                  )}
                </button>
                
                <div className="text-center mt-6">
                  <p className="text-white/60 text-sm">
                    Need a regular account?{' '}
                    <Link href="/admin/register" className="text-white hover:text-white/80 underline">
                      Sign up
                    </Link>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer showDonate={false} />
    </div>
  )
}
