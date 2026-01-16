'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PLANS, PLAN_DETAILS, formatGuestLimit } from '@/lib/stripe'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import StripeCheckoutButton from '@/components/StripeCheckoutButton'
function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Get plan from URL params
  const planParam = searchParams?.get('plan')?.toLowerCase() || 'basic'
  
  // Determine which plan to use
  const planKey = planParam === 'pro' ? PLANS.PRO : 
                 planParam === 'enterprise' ? PLANS.ENTERPRISE : 
                 PLANS.BASIC
  
  const plan = PLAN_DETAILS[planKey]
  const displayPrice = plan.price
  const billingAmount = plan.price

  useEffect(() => {
    // Check if user is logged in (admin session)
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setIsLoggedIn(true)
          setUserEmail(data.user?.email || data.user?.username || 'User')
        }
      } catch (err) {
        // Not logged in
        setIsLoggedIn(false)
      }
    }
    
    checkAuth()
  }, [])

  // Handle login/signup if needed
  const handleCheckoutWithAuth = () => {
    if (!isLoggedIn) {
      // Redirect to admin login with return URL (properly encoded)
      const redirectUrl = `/checkout?plan=${planParam}`
      router.push(`/admin/login?redirect=${encodeURIComponent(redirectUrl)}`)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bind8-bg" />
      <div className="absolute inset-0 bind8-glow" />
      
      {/* Navigation */}
      <Navigation />
      
      <div className="relative z-10 min-h-screen pt-28 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="glass-card rounded-2xl p-8">
            <h1 className="text-3xl font-light text-white mb-6">Checkout</h1>
            
            {/* Order Summary */}
            <div className="mb-8">
              <h2 className="text-xl font-light text-white mb-4">Order Summary</h2>
              
              <div className="bg-black/30 rounded-xl p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-white">{plan.name} Plan</h3>
                    <p className="text-white/70">Monthly billing</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-light text-white">${displayPrice.toFixed(2)}/mo</p>
                  </div>
                </div>
                
                <div className="border-t border-white/10 pt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-white font-medium">Total</p>
                    <p className="text-white font-light">
                      ${billingAmount.toFixed(2)}/month
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Plan Features */}
              <div className="mb-6">
                <h3 className="text-lg font-light text-white mb-3">Included in your plan:</h3>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-white/80">{feature}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">Up to {formatGuestLimit(plan.guestLimit)} guests per event</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">$0.05 per guest over limit</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* User Status */}
            {!isLoggedIn ? (
              <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-lg p-4 mb-6">
                <p className="text-white">
                  You'll need to create an account or sign in before completing your purchase.
                </p>
                <button
                  onClick={handleCheckoutWithAuth}
                  className="mt-3 w-full py-3 bg-cyan-500 text-white font-medium rounded-lg hover:bg-cyan-600 transition-all"
                >
                  Continue to Sign Up / Login
                </button>
              </div>
            ) : (
              <>
              <div className="bg-teal-500/20 border border-teal-500/30 rounded-lg p-4 mb-6">
                <p className="text-white">
                  You're signed in as <span className="font-normal">{userEmail}</span>
                </p>
              </div>
                
                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-red-300 font-medium">Checkout Error</p>
                        <p className="text-red-200 text-sm mt-1">{error}</p>
                      </div>
                      <button
                        onClick={() => setError(null)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Stripe Checkout Button */}
                <div className="mb-6">
                  {!plan.stripePriceId ? (
                    <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-lg p-4">
                      <p className="text-cyan-300">
                        This plan is not available for purchase. Please contact support.
                      </p>
                    </div>
                  ) : (
                    <StripeCheckoutButton
                      priceId={plan.stripePriceId}
                      planName={plan.name}
                      isLoading={isLoading}
                      onError={(err) => {
                        setError(err.message)
                        setIsLoading(false)
                      }}
                    />
                  )}
                </div>
              </>
            )}
            
            <p className="text-center text-white/60 text-sm mt-4">
              Secure payment powered by Stripe
            </p>
          </div>
        </div>
      </div>

      <Footer showDonate={false} />
    </div>
  )
}

export default function Checkout() {
  return (
    <Suspense fallback={
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bind8-bg" />
        <div className="absolute inset-0 bind8-glow" />
        <div className="relative z-10 text-white text-xl">Loading...</div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}