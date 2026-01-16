'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function CheckoutSuccess() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)
  
  useEffect(() => {
    // Start countdown to redirect to dashboard
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/admin/settings')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bind8-bg" />
      <div className="absolute inset-0 bind8-glow" />
      
      {/* Navigation */}
      <Navigation />
      
      <div className="relative z-10 min-h-screen pt-28 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass-card rounded-2xl p-8">
            <div className="w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-light text-white mb-4">Payment Successful!</h1>
            <p className="text-xl text-white/80 mb-8">
              Thank you for subscribing to OwlRSVP. Your account has been upgraded successfully.
            </p>
            
            <div className="bg-black/30 p-6 rounded-xl mb-8">
              <h2 className="text-xl font-light text-white mb-4">What's Next?</h2>
              <ul className="space-y-3 text-left">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-cyan-500/30 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-sm font-light text-cyan-400">1</span>
                  </div>
                  <span className="text-white/80">Create beautiful RSVP pages for your events</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-cyan-500/30 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-sm font-light text-cyan-400">2</span>
                  </div>
                  <span className="text-white/80">Customize your event with your brand colors and logo</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-cyan-500/30 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-sm font-light text-cyan-400">3</span>
                  </div>
                  <span className="text-white/80">Track RSVPs and manage your guest list</span>
                </li>
              </ul>
            </div>
            
            <p className="text-white/70 mb-6">
              You will be redirected to your dashboard in {countdown} seconds...
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/admin/settings"
                className="px-8 py-3 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-all"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/create"
                className="px-8 py-3 border border-white/30 text-white font-medium rounded-xl hover:bg-white/10 hover:border-white/50 transition-all"
              >
                Create New Event
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer showDonate={false} />
    </div>
  )
}
