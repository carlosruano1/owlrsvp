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
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<Loading />}>
      <VerifyEmail />
    </Suspense>
  )
}

function VerifyEmail() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error')
        setMessage('No verification token provided')
        return
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })

        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage('Email verified successfully! You can now sign in to your account.')
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed')
        }
      } catch (err) {
        setStatus('error')
        setMessage('Verification failed. Please try again.')
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="animated-bg" />
      <div className="spotlight" />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md glass-card rounded-3xl p-8 shadow-2xl text-center text-white">
          {status === 'verifying' && (
            <>
              <div className="text-6xl mb-4">⏳</div>
              <h1 className="text-2xl font-semibold mb-4">Verifying Email...</h1>
              <p className="text-white/80">Please wait while we verify your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-2xl font-semibold mb-4">Email Verified!</h1>
              <p className="text-white/80 mb-6">{message}</p>
              <Link 
                href="/admin/login"
                className="inline-block px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all"
              >
                Sign In to Your Account
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-6xl mb-4">❌</div>
              <h1 className="text-2xl font-semibold mb-4">Verification Failed</h1>
              <p className="text-white/80 mb-6">{message}</p>
              <div className="space-y-3">
                <Link 
                  href="/admin/register"
                  className="inline-block px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all"
                >
                  Create New Account
                </Link>
                <div>
                  <Link 
                    href="/admin/login"
                    className="text-white/70 hover:text-white/90 text-sm"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer showDonate={false} />
    </div>
  )
}
