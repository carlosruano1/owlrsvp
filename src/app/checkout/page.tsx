'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PLANS, PLAN_DETAILS } from '@/lib/stripe'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import StripeCheckoutButton from '@/components/StripeCheckoutButton'
import { supabase } from '@/lib/supabase'

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Get plan from URL params
  const planParam = searchParams?.get('plan')?.toLowerCase() || 'basic'
  const billingCycle = searchParams?.get('billing')?.toLowerCase() || 'monthly'
  
  // Determine which plan to use
  const planKey = planParam === 'pro' ? PLANS.PRO : 
                 planParam === 'enterprise' ? PLANS.ENTERPRISE : 
                 PLANS.BASIC
  
  const plan = PLAN_DETAILS[planKey]
  const isAnnual = billingCycle === 'annual'
  
  // Calculate price with annual discount if applicable
  const annualDiscount = 0.2
  const annualPrice = isAnnual ? plan.price * 12 * (1 - annualDiscount) : plan.price
  const displayPrice = isAnnual ? annualPrice / 12 : plan.price
  const billingAmount = isAnnual ? annualPrice : plan.price

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session && session.user.email) {
        setIsLoggedIn(true)
        setUserEmail(session.user.email)
      }
    }
    
    checkAuth()
  }, [])

  // Handle checkout errors
  const handleCheckoutError = (err: Error) => {
    console.error('Checkout error:', err)
    setError(err.message || 'An error occurred during checkout')
    setIsLoading(false)
  }

  // Handle login/signup if needed
  const handleCheckoutWithAuth = () => {
    if (!isLoggedIn) {
      router.push(`/auth/register?plan=${planParam}&billing=${billingCycle}`)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-amber-400 opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/40 via-blue-900/30 to-gray-900/90" />
      
      {/* Navigation */}
      <Navigation />
      
      <div className="relative z-10 min-h-screen pt-28 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="glass-card rounded-2xl p-8">
            <h1 className="text-3xl font-bold text-white mb-6">Checkout</h1>
            
            {/* Order Summary */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Order Summary</h2>
              
              <div className="bg-black/30 rounded-xl p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-white">{plan.name} Plan</h3>
                    <p className="text-white/70">{isAnnual ? 'Annual' : 'Monthly'} billing</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-white">${displayPrice.toFixed(2)}/mo</p>
                    {isAnnual && (
                      <p className="text-green-400 text-sm">Billed annually (${billingAmount.toFixed(2)})</p>
                    )}
                  </div>
                </div>
                
                <div className="border-t border-white/10 pt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-white font-medium">Total</p>
                    <p className="text-white font-bold">
                      ${billingAmount.toFixed(2)} {isAnnual ? '/year' : '/month'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Plan Features */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Included in your plan:</h3>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-white/80">{feature}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">Up to {plan.guestLimit.toLocaleString()} guests per event</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">$0.03 per guest over limit</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* User Status */}
            {!isLoggedIn ? (
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                <p className="text-white">
                  You'll need to create an account or sign in before completing your purchase.
                </p>
                <button
                  onClick={handleCheckoutWithAuth}
                  className="mt-3 w-full py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all"
                >
                  Continue to Sign Up / Login
                </button>
              </div>
            ) : (
              <>
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6">
                  <p className="text-white">
                    You're signed in as <span className="font-semibold">{userEmail}</span>
                  </p>
                </div>
                
                {/* Stripe Checkout Button */}
                <div className="mb-6">
                  <StripeCheckoutButton
                    priceId={plan.stripePriceId || ''}
                    planName={plan.name}
                    isAnnual={isAnnual}
                    isLoading={isLoading}
                    onError={handleCheckoutError}
                  />
                </div>
                
                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
                    <p className="text-white">{error}</p>
                  </div>
                )}
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
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-amber-400 opacity-80" />
        <div className="relative z-10 text-white text-xl">Loading...</div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}