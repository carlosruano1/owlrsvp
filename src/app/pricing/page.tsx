'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PLANS, PLAN_DETAILS } from '@/lib/stripe'
import { SubscriptionTier } from '@/lib/types'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'

function PricingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isAnnual, setIsAnnual] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('')

  // Check for upgrade parameters
  useEffect(() => {
    const upgrade = searchParams.get('upgrade')
    const reason = searchParams.get('reason')
    
    if (upgrade === 'true') {
      if (reason === 'event_limit') {
        setUpgradeMessage('You\'ve reached your event limit! Upgrade to create more events.')
      } else {
        setUpgradeMessage('Upgrade your plan to unlock more features!')
      }
    }
  }, [searchParams])

  // Pricing discount for annual billing (20% off)
  const annualDiscount = 0.2

  // Animate elements when loaded
  useState(() => {
    setIsLoaded(true)
  })

  // Convert plan details to subscription tiers
  const subscriptionTiers: SubscriptionTier[] = [
    {
      name: PLAN_DETAILS[PLANS.FREE].name,
      price: PLAN_DETAILS[PLANS.FREE].price,
      guestLimit: PLAN_DETAILS[PLANS.FREE].guestLimit,
      features: PLAN_DETAILS[PLANS.FREE].features,
      stripePriceId: PLAN_DETAILS[PLANS.FREE].stripePriceId,
    },
    {
      name: PLAN_DETAILS[PLANS.BASIC].name,
      price: PLAN_DETAILS[PLANS.BASIC].price,
      guestLimit: PLAN_DETAILS[PLANS.BASIC].guestLimit,
      features: PLAN_DETAILS[PLANS.BASIC].features,
      stripePriceId: PLAN_DETAILS[PLANS.BASIC].stripePriceId,
      isPopular: true,
    },
    {
      name: PLAN_DETAILS[PLANS.PRO].name,
      price: PLAN_DETAILS[PLANS.PRO].price,
      guestLimit: PLAN_DETAILS[PLANS.PRO].guestLimit,
      features: PLAN_DETAILS[PLANS.PRO].features,
      stripePriceId: PLAN_DETAILS[PLANS.PRO].stripePriceId,
    },
    {
      name: PLAN_DETAILS[PLANS.ENTERPRISE].name,
      price: PLAN_DETAILS[PLANS.ENTERPRISE].price,
      guestLimit: PLAN_DETAILS[PLANS.ENTERPRISE].guestLimit,
      features: PLAN_DETAILS[PLANS.ENTERPRISE].features,
      stripePriceId: PLAN_DETAILS[PLANS.ENTERPRISE].stripePriceId,
    },
  ]

  // Handle subscription checkout
  const handleSubscribe = (tier: SubscriptionTier) => {
    if (tier.name === 'Free') {
      // For free tier, redirect to signup
      router.push('/auth/register?plan=free')
    } else if (tier.name === 'Enterprise') {
      // For enterprise, redirect to contact form
      router.push('/contact?subject=Enterprise%20Plan%20Inquiry')
    } else {
      // For paid plans, redirect to checkout
      router.push(`/checkout?plan=${tier.name.toLowerCase()}${isAnnual ? '&billing=annual' : ''}`)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="animated-bg" />
      <div className="spotlight" />
      
      {/* Navigation */}
      <Navigation />
      
      <div className={`relative z-10 min-h-screen transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {/* Hero Section */}
        <div className="flex items-center justify-center min-h-[50vh] p-6 pt-28">
          <div className="w-full max-w-4xl text-center">
            <h1 className="text-5xl font-bold text-white mb-6 tracking-tight animate-slideDown">
              Simple, <span className="text-gradient">Transparent</span> Pricing
            </h1>
            <p className="text-xl text-white/80 font-light mb-12 animate-fadeIn max-w-2xl mx-auto">
              Choose the plan that's right for you. All plans include our beautiful RSVP pages, 
              guest management, and analytics.
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-12">
              <div className="bg-black/30 rounded-full p-1 inline-flex">
                <button 
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${!isAnnual ? 'bg-white text-black' : 'text-white/70 hover:text-white'}`}
                  onClick={() => setIsAnnual(false)}
                >
                  Monthly
                </button>
                <button 
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${isAnnual ? 'bg-white text-black' : 'text-white/70 hover:text-white'}`}
                  onClick={() => setIsAnnual(true)}
                >
                  Annual <span className="text-green-500 font-bold">(Save 20%)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Message */}
        {upgradeMessage && (
          <div className="px-6 mb-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl p-6 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-xl font-semibold text-white">Upgrade Required</h2>
                </div>
                <p className="text-white/80 text-lg">{upgradeMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {subscriptionTiers.map((tier, index) => {
                // Calculate annual price with discount
                const annualPrice = isAnnual ? tier.price * 12 * (1 - annualDiscount) : tier.price
                const displayPrice = isAnnual ? annualPrice / 12 : tier.price
                
                return (
                  <div 
                    key={tier.name}
                    className={`glass-card rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:transform hover:scale-105 ${tier.isPopular ? 'border-2 border-blue-400/50' : ''}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {tier.isPopular && (
                      <div className="absolute top-0 right-0">
                        <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 transform rotate-45 translate-x-2 -translate-y-1">
                          POPULAR
                        </div>
                      </div>
                    )}
                    
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-3xl font-bold text-white">${displayPrice.toFixed(2)}</span>
                        <span className="text-white/60">/mo</span>
                      </div>
                      {isAnnual && tier.price > 0 && (
                        <p className="text-green-400 text-sm mt-1">Billed annually (${annualPrice.toFixed(2)})</p>
                      )}
                      <p className="text-white/70 text-sm mt-2">Up to {tier.guestLimit.toLocaleString()} guests per event</p>
                    </div>
                    
                    <div className="mb-6">
                      <ul className="space-y-3">
                        {tier.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-white/80">{feature}</span>
                          </li>
                        ))}
                        
                        {tier.name !== 'Free' && (
                          <li className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-white/80">$0.03 per guest over limit</span>
                          </li>
                        )}
                      </ul>
                    </div>
                    
                    <button
                      onClick={() => handleSubscribe(tier)}
                      className={`w-full py-3 rounded-lg font-medium transition-all ${
                        tier.name === 'Free'
                          ? 'bg-white/20 text-white hover:bg-white/30'
                          : tier.isPopular
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-white text-black hover:bg-white/90'
                      }`}
                    >
                      {tier.name === 'Free' ? 'Get Started' : tier.name === 'Enterprise' ? 'Contact Us' : 'Subscribe'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-gradient">Frequently Asked Questions</h2>
            
            <div className="space-y-8">
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-3">What happens if I go over my guest limit?</h3>
                <p className="text-white/80">
                  If you exceed your plan's guest limit, we'll automatically charge $0.03 per additional guest. 
                  This ensures you never have to worry about hitting limits during important events. You can 
                  always upgrade your plan if you expect to consistently exceed your current limit.
                </p>
              </div>
              
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-3">Can I upgrade or downgrade my plan?</h3>
                <p className="text-white/80">
                  Yes! You can upgrade your plan at any time. When you upgrade, you'll be charged the prorated 
                  difference for the remainder of your billing period. Downgrades take effect at the end of your 
                  current billing period.
                </p>
              </div>
              
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-3">Is there a free trial?</h3>
                <p className="text-white/80">
                  We offer a generous free plan that lets you create one event with up to 50 guests. This gives 
                  you a chance to try out our platform before committing to a paid plan. No credit card required!
                </p>
              </div>
              
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-3">What payment methods do you accept?</h3>
                <p className="text-white/80">
                  We accept all major credit cards (Visa, Mastercard, American Express, Discover) through our 
                  secure payment processor, Stripe. For Enterprise plans, we can also accommodate invoicing and 
                  other payment methods.
                </p>
              </div>
              
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-3">What's included in the Enterprise plan?</h3>
                <p className="text-white/80">
                  The Enterprise plan includes everything in the Pro plan, plus white-labeling options, 
                  custom integrations with your existing systems, dedicated support, and higher guest limits. 
                  Contact us for a custom quote based on your specific needs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 px-6 subtle-grid dark-overlay">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6 text-gradient">Ready to Get Started?</h2>
            <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
              Create beautiful RSVP pages for your events in minutes. Choose the plan that fits your needs 
              and start managing your events like a pro.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/create"
                className="px-10 py-5 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all shadow-xl"
              >
                Create Your First Event
              </Link>
              <Link
                href="/contact"
                className="px-10 py-5 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 hover:border-white/50 transition-all"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer showDonate={false} />
    </div>
  )
}

export default function Pricing() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  )
}
