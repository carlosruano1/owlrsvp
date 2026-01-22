'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Get redirect URL from query params
  const getRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('redirect') || '/admin/events'
    }
    return '/admin/events'
  }

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          router.push(getRedirectUrl())
        }
      } catch (err) {
        // Not logged in, continue
      }
    }
    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      }).catch((fetchError) => {
        console.error('Fetch error:', fetchError)
        throw new Error('Network error: Could not connect to server. Make sure the development server is running.')
      })

      if (!response) {
        throw new Error('No response from server')
      }

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError)
        throw new Error(`Server error: ${response.status} ${response.statusText}. The API may have crashed.`)
      }

      if (!response.ok) {
        throw new Error(data.error || `Login failed: ${response.status}`)
      }

      // Redirect to intended destination or admin settings
      router.push(getRedirectUrl())
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'Login failed. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bind8-bg" />
      <div className="absolute inset-0 bind8-glow" />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8 text-white text-glow">
            <h1 className="text-4xl font-light mb-2 tracking-tight">Admin Login</h1>
            <p className="text-white/80 text-lg font-light">Sign in to your OwlRSVP account</p>
          </div>

          {/* Form Card */}
          <div className="glass-card rounded-3xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="usernameOrEmail" className="block text-sm font-medium text-white/90 mb-2">
                  Username or Email
                </label>
                <input
                  type="text"
                  id="usernameOrEmail"
                  name="usernameOrEmail"
                  value={formData.usernameOrEmail}
                  onChange={handleChange}
                  className="modern-input w-full px-4 py-3"
                  placeholder="Enter username or email"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="modern-input w-full px-4 py-3"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-100 px-4 py-3 rounded-xl backdrop-blur-sm text-sm">
                  {error}
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
                    <span>Signing In...</span>
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="text-center">
                <Link 
                  href="/admin/forgot-password" 
                  className="text-white/70 hover:text-white/90 text-sm"
                >
                  Forgot your password?
                </Link>
              </div>
              
              <div className="text-center">
                <p className="text-white/70 text-sm">
                  Don't have an account?{' '}
                  <Link href="/admin/register" className="text-white hover:text-white/80 font-medium">
                    Create one
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Back to home */}
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
