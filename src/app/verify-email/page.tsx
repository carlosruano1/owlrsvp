'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'

import LoadingScreen from '@/components/LoadingScreen'

// Main component wrapped with Suspense
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
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
