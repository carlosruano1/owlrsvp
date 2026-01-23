'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'

function AcceptTeamInvitationContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    const handleInvitation = async () => {
      if (!token) {
        setStatus('error')
        setMessage('Invalid invitation link')
        return
      }

      try {
        // First validate the invitation
        const validationResponse = await fetch(`/api/admin/team/accept-invitation?token=${token}`)
        const validationData = await validationResponse.json()

        if (!validationResponse.ok) {
          setStatus('error')
          setMessage(validationData.error || 'Invalid invitation')
          return
        }

        // Check if user exists with this email
        if (!validationData.user_exists) {
          // User doesn't exist, redirect to registration
          router.push(`/admin/register-team?token=${token}`)
          return
        }

        // User exists, check if they're logged in
        const userResponse = await fetch('/api/auth/me')
        if (!userResponse.ok) {
          // User not logged in, redirect to login with invitation context
          sessionStorage.setItem('pendingTeamInvitation', token)
          router.push(`/admin/login?message=Please log in with ${validationData.invitation.email} to accept your team invitation&invitation_token=${token}`)
          return
        }

        const userData = await userResponse.json()

        // Verify the logged-in user matches the invited email
        if (userData.user.email !== validationData.invitation.email) {
          setStatus('error')
          setMessage(`Please log in with ${validationData.invitation.email} to accept this invitation`)
          return
        }

        setUser(userData.user)

        // Accept the invitation
        const response = await fetch('/api/admin/team/accept-invitation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ invitation_token: token })
        })

        const data = await response.json()

        if (!response.ok) {
          if (response.status === 400 && data.error.includes('expired')) {
            setStatus('expired')
          } else {
            setStatus('error')
          }
          setMessage(data.error || 'Failed to accept invitation')
          return
        }

        setStatus('success')
        setMessage('Successfully joined the team!')

        // Redirect to settings after a delay
        setTimeout(() => {
          router.push('/admin/settings?tab=team')
        }, 3000)

      } catch (error) {
        setStatus('error')
        setMessage('An unexpected error occurred')
      }
    }

    handleInvitation()
  }, [token, router])

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
            {status === 'loading' && (
              <>
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h2 className="text-xl font-normal text-white mb-4">Processing Invitation</h2>
                <p className="text-white/70">Please wait while we set up your team access...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-normal text-white mb-4">Welcome to the Team!</h2>
                <p className="text-white/70 mb-6">{message}</p>
                <p className="text-white/60 text-sm">Redirecting you to your team settings...</p>
              </>
            )}

            {status === 'expired' && (
              <>
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-normal text-white mb-4">Invitation Expired</h2>
                <p className="text-white/70 mb-6">This team invitation has expired. Please ask your team owner to send a new invitation.</p>
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-normal rounded-xl hover:bg-white/90 transition-all"
                >
                  Go to Login
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-normal text-white mb-4">Invitation Error</h2>
                <p className="text-white/70 mb-6">{message}</p>
                <div className="space-y-3">
                  <Link
                    href="/admin/login"
                    className="block w-full px-6 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 transition-all text-white text-center"
                  >
                    Go to Login
                  </Link>
                  <Link
                    href="/admin/settings?tab=team"
                    className="block w-full px-6 py-3 bg-white text-black font-normal rounded-xl hover:bg-white/90 transition-all text-center"
                  >
                    Team Settings
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default function AcceptTeamInvitation() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <AcceptTeamInvitationContent />
    </Suspense>
  )
}