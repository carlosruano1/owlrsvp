'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'
import ElegantLogo from '@/components/ElegantLogo'
import Navigation from '@/components/Navigation'
import Image from 'next/image'
import FeatureCarousel from '@/components/FeatureCarousel'
import EnvelopeInvitation from '@/components/EnvelopeInvitation'
import PricingComparison from '@/components/PricingComparison'
import { useScrollReveal, useParallax } from '@/hooks/useScrollReveal'
import { PLANS, PLAN_DETAILS } from '@/lib/stripe'

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoaded, setIsLoaded] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('')
  const [showUpgradeMessage, setShowUpgradeMessage] = useState(false)
  const growRef = useRef<HTMLSpanElement>(null)
  const featuresSectionRef = useRef<HTMLDivElement>(null)
  
  // Animation hooks
  const heroReveal = useScrollReveal()
  const featuresReveal = useScrollReveal()
  const pricingReveal = useScrollReveal()
  const howItWorksReveal = useScrollReveal()
  const howItWorksRef = useRef<HTMLDivElement>(null)
  const envelopeRef = useRef<HTMLDivElement>(null)
  const ctaReveal = useScrollReveal()
  
  // We're not using the mouse parallax effect anymore
  // const heroParallax = useParallax()

  // Check for upgrade parameters
  useEffect(() => {
    const upgrade = searchParams.get('upgrade')
    const reason = searchParams.get('reason')

    if (upgrade === 'true') {
      if (reason === 'event_limit') {
        setUpgradeMessage('You\'ve reached your event limit! Upgrade to create more events.')
      } else if (reason === 'branding') {
        setUpgradeMessage('Custom branding is only available on paid plans. Upgrade to access these features.')
      } else if (reason === 'analytics') {
        setUpgradeMessage('Advanced analytics is only available on Pro and Enterprise plans.')
      } else {
        setUpgradeMessage('Upgrade your plan to unlock more features!')
      }
      
      setShowUpgradeMessage(true)

      // Scroll to pricing section after a short delay
      setTimeout(() => {
        const pricingSection = document.getElementById('pricing')
        if (pricingSection) {
          pricingSection.scrollIntoView({ behavior: 'smooth' })
        }
      }, 500)
      
      // Clear URL parameters to prevent message from persisting
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href)
          url.searchParams.delete('upgrade')
          url.searchParams.delete('reason')
          window.history.replaceState({}, '', url.toString())
        }
      }, 1000)
      
      // Auto-dismiss after 10 seconds
      setTimeout(() => {
        setShowUpgradeMessage(false)
      }, 10000)
    } else {
      setShowUpgradeMessage(false)
    }
  }, [searchParams])

  useEffect(() => {
    setIsLoaded(true)

    // Initialize reveal animations on page load
    const revealElements = document.querySelectorAll('.animate-reveal')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1 })

    revealElements.forEach(element => {
      observer.observe(element)
    })

    // Apple-like compact scroll highlight for feature cards
    const section = featuresSectionRef.current
    const cards = section ? Array.from(section.querySelectorAll<HTMLElement>('.apple-feature')) : []
    const onFeatureScroll = () => {
      if (!section || cards.length === 0) return
      const rect = section.getBoundingClientRect()
      const viewH = window.innerHeight
      const viewportCenter = viewH / 2
      const progress = Math.max(0, Math.min(1, (viewportCenter - rect.top) / Math.max(1, rect.height)))
      const total = Math.max(1, cards.length - 1)
      cards.forEach((el, idx) => {
        const anchor = idx / total
        const delta = Math.abs(progress - anchor)
        const scale = Math.max(0.94, 1 - delta * 0.06)
        const translate = Math.min(10, delta * 14)
        const opacity = Math.max(0.65, 1 - delta * 0.4)
        el.style.transform = `translateY(${translate}px) scale(${scale})`
        el.style.opacity = String(opacity)
        el.style.willChange = 'transform, opacity'
      })
    }
    onFeatureScroll()
    window.addEventListener('scroll', onFeatureScroll, { passive: true })
    window.addEventListener('resize', onFeatureScroll)

    // Scroll-driven scaling for the word "grow"
    const onScroll = () => {
      const el = growRef.current
      if (!el) return
      const y = window.scrollY
      const start = 0
      const end = 500
      const progress = Math.max(0, Math.min(1, (y - start) / (end - start)))
      const scale = 1 + progress * 0.35 // up to ~1.35x
      el.style.transform = `scale(${scale})`
      el.style.transformOrigin = 'left center'
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    // Apple-like scroll-driven How It Works animation
    const onHowItWorksScroll = () => {
      const el = howItWorksRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const viewH = window.innerHeight
      const viewportCenter = viewH / 2
      const progress = Math.max(0, Math.min(1, (viewportCenter - rect.top) / Math.max(1, rect.height)))
      const steps = Array.from(el.querySelectorAll<HTMLElement>('.how-step'))
      const image = el.querySelector<HTMLElement>('.how-image')
      steps.forEach((step, idx) => {
        const anchor = idx / Math.max(1, steps.length - 1)
        const delta = Math.abs(progress - anchor)
        const scale = Math.max(0.92, 1 - delta * 0.08)
        const translate = Math.min(16, delta * 20)
        const opacity = Math.max(0.7, 1 - delta * 0.3)
        step.style.transform = `translateY(${translate}px) scale(${scale})`
        step.style.opacity = String(opacity)
        step.style.willChange = 'transform, opacity'
      })
      if (image) {
        const delta = Math.abs(progress - 0.5)
        const scale = Math.max(0.95, 1 - delta * 0.05)
        const translate = Math.min(12, delta * 16)
        image.style.transform = `translateY(${translate}px) scale(${scale})`
        image.style.opacity = String(Math.max(0.8, 1 - delta * 0.2))
        image.style.willChange = 'transform, opacity'
      }
    }
    onHowItWorksScroll()
    window.addEventListener('scroll', onHowItWorksScroll, { passive: true })
    window.addEventListener('resize', onHowItWorksScroll)


    return () => {
      revealElements.forEach(element => {
        observer.unobserve(element)
      })
      window.removeEventListener('scroll', onFeatureScroll)
      window.removeEventListener('resize', onFeatureScroll)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('scroll', onHowItWorksScroll)
      window.removeEventListener('resize', onHowItWorksScroll)
    }
  }, [])

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-amber-400 opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/40 via-blue-900/30 to-gray-900/90" />
      
      {/* Navigation */}
      <Navigation />
      
      <div className={`relative z-10 min-h-screen transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {/* Hero Section - Stripe-inspired */}
        <div 
          className="flex flex-col lg:flex-row items-center justify-between min-h-screen p-6 pt-28 max-w-7xl mx-auto"
        >
          <div className="w-full lg:w-1/2 lg:pr-8 mb-16 lg:mb-0">
            <div 
              className="transform transition-all duration-700 animate-reveal text-left"
              ref={heroReveal.ref}
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-3 leading-tight tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 animate-gradient-x">
                  Event
                </span>
                {" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 animate-gradient-x">
                  management
                </span>
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-500 to-blue-600 animate-gradient-x">
                  infrastructure
                </span>
              </h1>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-white">to</span>{" "}
                <span ref={growRef} className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-white will-change-transform">grow</span>{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-white">your</span>{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient-x">attendance</span>
              </h2>
            </div>

            {/* Description */}
            <div className="max-w-xl stagger-reveal animate-reveal text-left">
              <p className="text-xl text-white/80 leading-relaxed mb-8">
                Create beautiful RSVP pages in seconds, track attendance, and manage guests 
                for events of any size with our simple yet powerful platform.
              </p>
              <div className="flex flex-wrap gap-6 text-base text-white/70 mb-10">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  No signup required
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Custom branding
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  QR codes included
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Export to CSV
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="animate-reveal max-w-xl">
              <Link
                href="/create"
                className="group relative inline-flex items-center justify-center px-8 py-4 bg-white text-black font-semibold rounded-lg transition-all hover:scale-105 shadow-xl text-lg"
              >
                <span className="relative z-10">Create Your Event</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <svg className="w-5 h-5 ml-2 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
          
          {/* Phone Mockup with Enhanced Animations - Hidden on Mobile */}
          <div className="hidden lg:flex w-full lg:w-1/2 justify-center lg:justify-end">
            <div className="relative w-[300px] h-[600px]" style={{animation: "float-phone 8s ease-in-out infinite"}}>
              {/* Phone Frame with Glow Effect */}
              <div className="absolute inset-0 bg-black rounded-[40px] shadow-2xl z-10">
                {/* Animated glow effect around the phone */}
                <div className="absolute -inset-3 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 rounded-[50px] blur-xl z-0 opacity-70" style={{animation: "screen-glow 4s ease-in-out infinite"}}></div>
              </div>
              
              {/* Phone Inner Frame */}
              <div className="absolute inset-[3px] bg-black rounded-[38px] z-20 overflow-hidden">
                {/* Real mobile screenshot */}
                <div className="absolute inset-0 z-30">
                  {/* Safe area to avoid notch overlap */}
                  <div className="absolute inset-x-[8px] top-[16px] bottom-[8px] rounded-[30px] overflow-hidden">
                    <Image 
                      src="/screenshots/phone-sc.png.png" 
                      alt="Mobile RSVP experience"
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 768px) 100vw, 300px"
                    />
                  </div>
                  {/* Subtle screen shine */}
                  <div 
                    className="absolute inset-0 z-40 pointer-events-none"
                    style={{
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                      backgroundSize: "200% 100%",
                      animation: "shine-effect 3s linear infinite"
                    }}
                  ></div>
                </div>
                
                {/* Phone Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-7 bg-black rounded-b-2xl z-40"></div>
                
                {/* Dynamic Screen Glow */}
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent z-20 pointer-events-none opacity-70"
                  style={{animation: "pulse 4s ease-in-out infinite alternate"}}
                ></div>
              </div>
              
              {/* Phone Buttons with subtle highlight */}
              <div className="absolute right-[-2px] top-28 h-16 w-1 bg-gray-800 rounded-l-lg z-40">
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50"></div>
              </div>
              <div className="absolute left-[-2px] top-24 h-10 w-1 bg-gray-800 rounded-r-lg z-40">
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50"></div>
              </div>
              <div className="absolute left-[-2px] top-40 h-10 w-1 bg-gray-800 rounded-r-lg z-40">
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50"></div>
              </div>
              <div className="absolute left-[-2px] top-52 h-10 w-1 bg-gray-800 rounded-r-lg z-40">
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50"></div>
              </div>
              
              {/* Enhanced Reflection Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 rounded-[40px] z-50 pointer-events-none"></div>
              
              {/* Animated Particle Effects */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-blue-500/20 rounded-full filter blur-2xl animate-pulse z-5"></div>
              <div className="absolute -top-8 -left-8 w-24 h-24 bg-purple-500/20 rounded-full filter blur-2xl animate-pulse z-5" style={{animationDelay: "1s"}}></div>
            </div>
          </div>
        </div>

        {/* Desktop Screenshot Section with Enhanced Animations - Hidden on Mobile */}
        <div className="py-16 px-6 relative overflow-hidden hidden md:block">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 animate-reveal" ref={featuresReveal.ref}>
              <h3 className="inline-block px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white/90 rounded-full text-sm font-medium mb-4 animate-pulse">
                Powerful Dashboard
              </h3>
              <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
                Manage your events with ease
              </h2>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">
                Track RSVPs, export guest lists, and get insights into your event's performance
                with our intuitive dashboard.
              </p>
            </div>
            
            <div className="relative">
              {/* Desktop Frame with Animation */}
              <div className="bg-gray-900 rounded-t-xl shadow-2xl p-4 max-w-5xl mx-auto transform transition-all duration-700 hover:scale-[1.02]">
                {/* Animated Glow Effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-xl blur-xl opacity-70 -z-10" 
                     style={{animation: "screen-glow 4s ease-in-out infinite alternate"}}></div>
                
                {/* Browser Controls with Animation */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 hover:animate-pulse"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500 hover:animate-pulse"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500 hover:animate-pulse"></div>
                  <div className="ml-4 bg-gray-800 rounded h-6 w-full relative overflow-hidden">
                    {/* URL Bar Shine Effect */}
                    <div 
                      className="absolute inset-0" 
                      style={{
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                        backgroundSize: "200% 100%",
                        animation: "shine-effect 2s linear infinite"
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* Feature Carousel */}
                <FeatureCarousel
                  slides={[
                    { title: 'Analytics', subtitle: 'Understand responses at a glance', src: '/screenshots/analytics-sc.png', alt: 'Analytics dashboard', badge: 'Analytics' },
                    { title: 'Admin Dashboard', subtitle: 'Edit details and manage attendees', src: '/screenshots/admin-sc.png', alt: 'Admin dashboard', badge: 'Admin' },
                  ]}
                />
              </div>
              
              {/* Animated Decorative Elements */}
              <div 
                className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full filter blur-3xl opacity-20"
                style={{animation: "pulse 6s ease-in-out infinite alternate"}}
              ></div>
              <div 
                className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-r from-amber-500 to-pink-500 rounded-full filter blur-3xl opacity-20"
                style={{animation: "pulse 8s ease-in-out infinite alternate-reverse"}}
              ></div>
              
              {/* Floating Particles */}
              <div className="absolute top-1/4 left-1/5 w-4 h-4 bg-blue-500/50 rounded-full blur-sm" 
                   style={{animation: "float 10s ease-in-out infinite"}}></div>
              <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-purple-500/50 rounded-full blur-sm" 
                   style={{animation: "float 7s ease-in-out infinite", animationDelay: "1s"}}></div>
              <div className="absolute top-2/3 left-1/3 w-2 h-2 bg-pink-500/50 rounded-full blur-sm" 
                   style={{animation: "float 12s ease-in-out infinite", animationDelay: "2s"}}></div>
            </div>
          </div>
        </div>

        {/* Main Features Section (compact, Apple-like) */}
        <div id="features" className="page-section bg-gradient-to-b from-transparent to-gray-900/50 diagonal-bottom">
          <div 
            className="page-section-content"
            ref={featuresSectionRef}
          >
            <div className="text-center mb-10 animate-reveal" ref={featuresReveal.ref}>
              <div className="apple-kicker">FEATURES</div>
              <h2 className="apple-section-title">Built for modern events</h2>
              <p className="apple-subtitle mt-3 text-white/80">Fast to set up. Effortless to manage. Delightful for guests.</p>
            </div>
            <div className="section-cards">
              <div className="feature-card apple-feature p-8 text-center transition-all duration-300">
                <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Lightning Fast</h3>
                <p className="text-white/80 text-lg">Create and customize your RSVP page in under 60 seconds. No complex setup required.</p>
              </div>
              
              <div className="feature-card apple-feature p-8 text-center transition-all duration-300">
                <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Beautiful Design</h3>
                <p className="text-white/80 text-lg">Stunning, modern interface that your guests will love. Customize colors and branding to match your style.</p>
              </div>
              
              <div className="feature-card apple-feature p-8 text-center transition-all duration-300">
                <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Easy Management</h3>
                <p className="text-white/80 text-lg">Track responses, export data, and manage your guest list with our intuitive admin dashboard.</p>
              </div>
              
              <div className="feature-card apple-feature p-8 text-center transition-all duration-300">
                <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Secure Access</h3>
                <p className="text-white/80 text-lg">Team access controls, magic links, and secure admin portal to protect your event data.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Comparison Section */}
        <PricingComparison />

        {/* Upgrade Message */}
        {upgradeMessage && showUpgradeMessage && (
          <div className="px-6 mb-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl p-6 text-center relative">
                <button
                  onClick={() => setShowUpgradeMessage(false)}
                  className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                  aria-label="Dismiss"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
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

        {/* Pricing Section */}
        <div id="pricing" className="page-section subtle-grid dark-overlay relative z-10">
          <div
            className={`page-section-content animate-reveal stagger-reveal relative z-20 ${pricingReveal.isRevealed ? 'revealed' : ''}`}
            ref={pricingReveal.ref}
          >
            <h2 className="text-4xl font-bold text-center mb-6 text-gradient">Simple, Transparent Pricing</h2>
            <p className="text-xl text-white/80 text-center mb-16 max-w-2xl mx-auto">
              Choose the plan that fits your needs. All plans include our beautiful RSVP pages and core features.
            </p>
            
            {/* Main Pricing Tiers: Free, Basic, Pro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
              {/* Free Plan */}
              <div className="glass-card rounded-2xl p-6 relative transition-all duration-300 hover:transform hover:scale-105 flex flex-col">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{PLAN_DETAILS[PLANS.FREE].name}</h3>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-3xl font-bold text-white">${PLAN_DETAILS[PLANS.FREE].price.toFixed(2)}</span>
                  </div>
                  <p className="text-white/70 text-sm mt-2">Up to {PLAN_DETAILS[PLANS.FREE].guestLimit === Infinity ? 'Unlimited' : PLAN_DETAILS[PLANS.FREE].guestLimit.toLocaleString()} guests per event</p>
                </div>
                
                <div className="mb-6 flex-grow">
                  <ul className="space-y-3">
                    {PLAN_DETAILS[PLANS.FREE].features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-white/80">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <button
                  onClick={() => router.push('/create')}
                  className="w-full py-3 rounded-lg font-medium transition-all bg-white/20 text-white hover:bg-white/30 mt-auto"
                >
                  Get Started
                </button>
              </div>
              
              {/* Basic Plan - Featured/Larger */}
              <div className="glass-card rounded-2xl p-8 relative transition-all duration-300 hover:transform hover:scale-105 border-2 border-blue-400/50 flex flex-col transform scale-105 md:scale-110">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                    POPULAR
                  </div>
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{PLAN_DETAILS[PLANS.BASIC].name}</h3>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-4xl font-bold text-white">${PLAN_DETAILS[PLANS.BASIC].price.toFixed(2)}</span>
                    <span className="text-white/60">/mo</span>
                  </div>
                  <p className="text-white/70 text-sm mt-2">Up to {PLAN_DETAILS[PLANS.BASIC].guestLimit === Infinity ? 'Unlimited' : PLAN_DETAILS[PLANS.BASIC].guestLimit.toLocaleString()} guests per event</p>
                </div>
                
                <div className="mb-6 flex-grow">
                  <ul className="space-y-3">
                    {PLAN_DETAILS[PLANS.BASIC].features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
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
                      <span className="text-white/80">$0.05 per guest over limit</span>
                    </li>
                  </ul>
                </div>
                
                <button
                  onClick={() => router.push('/checkout?plan=basic')}
                  className="w-full py-4 rounded-lg font-semibold transition-all bg-blue-500 text-white hover:bg-blue-600 cursor-pointer mt-auto text-lg"
                >
                  Subscribe
                </button>
              </div>
              
              {/* Pro Plan */}
              <div className="glass-card rounded-2xl p-6 relative transition-all duration-300 hover:transform hover:scale-105 flex flex-col">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{PLAN_DETAILS[PLANS.PRO].name}</h3>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-3xl font-bold text-white">${PLAN_DETAILS[PLANS.PRO].price.toFixed(2)}</span>
                    <span className="text-white/60">/mo</span>
                  </div>
                  <p className="text-white/70 text-sm mt-2">Up to {PLAN_DETAILS[PLANS.PRO].guestLimit === Infinity ? 'Unlimited' : PLAN_DETAILS[PLANS.PRO].guestLimit.toLocaleString()} guests per event</p>
                </div>
                
                <div className="mb-6 flex-grow">
                  <ul className="space-y-3">
                    {PLAN_DETAILS[PLANS.PRO].features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
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
                      <span className="text-white/80">$0.05 per guest over limit</span>
                    </li>
                  </ul>
                </div>
                
                <button
                  onClick={() => router.push('/checkout?plan=pro')}
                  className="w-full py-3 rounded-lg font-medium transition-all bg-white text-black hover:bg-white/90 cursor-pointer mt-auto"
                >
                  Subscribe
                </button>
              </div>
              
            </div>
            
            {/* Enterprise Plan - Simple Contact Line */}
            <div className="text-center mt-8">
              <p className="text-white/70 text-sm">
                For enterprise pricing,{' '}
                <Link 
                  href="/contact?subject=Enterprise%20Plan%20Inquiry"
                  className="text-blue-400 hover:text-blue-300 underline transition-colors"
                >
                  contact our team
                </Link>
              </p>
            </div>
            
            <div className="text-center mt-8">
              <Link
                href="/create"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                Start creating your event
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div id="how-it-works" className="page-section pattern-overlay diagonal-top" ref={howItWorksRef}>
          {/* Mobile animated orbs background (subtle) */}
          <div className="howitworks-mobile-orbs">
            <span className="orb orb--a" aria-hidden="true" />
            <span className="orb orb--b" aria-hidden="true" />
          </div>
          <div 
            className={`page-section-content animate-reveal stagger-reveal ${howItWorksReveal.isRevealed ? 'revealed' : ''}`}
            ref={howItWorksReveal.ref}
          >
            <h2 className="text-5xl md:text-6xl font-bold text-center mb-20 text-gradient">How It Works</h2>
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                {/* Steps */}
                <div className="space-y-16">
                  <div className="how-step flex items-start gap-8 transition-all duration-300">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/30 border border-blue-400/30 flex items-center justify-center shrink-0 backdrop-blur-sm">
                      <span className="text-4xl font-bold text-blue-400">1</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-3xl md:text-4xl font-bold mb-4 text-white">Create Your Event</h3>
                      <p className="text-xl text-white/90 leading-relaxed">Enter your event details, customize colors, and upload your company logo. No account required to get started.</p>
                    </div>
                  </div>
                  
                  <div className="how-step flex items-start gap-8 transition-all duration-300">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-pink-500/20 to-pink-600/30 border border-pink-400/30 flex items-center justify-center shrink-0 backdrop-blur-sm">
                      <span className="text-4xl font-bold text-pink-400">2</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-3xl md:text-4xl font-bold mb-4 text-white">Share With Guests</h3>
                      <p className="text-xl text-white/90 leading-relaxed">Send your custom RSVP link via email, social media, or embed the QR code in your invitations.</p>
                    </div>
                  </div>
                  
                  <div className="how-step flex items-start gap-8 transition-all duration-300">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/30 border border-green-400/30 flex items-center justify-center shrink-0 backdrop-blur-sm">
                      <span className="text-4xl font-bold text-green-400">3</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-3xl md:text-4xl font-bold mb-4 text-white">Track Responses</h3>
                      <p className="text-xl text-white/90 leading-relaxed">Monitor RSVPs in real-time through your admin dashboard. Export the guest list anytime.</p>
                    </div>
                  </div>
                </div>
                
                {/* Image with elegant frame */}
                <div className="how-image transition-all duration-300 hidden lg:block">
                  <div className="relative">
                    {/* Elegant frame with multiple layers */}
                    <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl"></div>
                    <div className="absolute -inset-2 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl backdrop-blur-sm border border-white/20"></div>
                    <div className="relative bg-black/40 p-6 rounded-2xl backdrop-blur-md border border-white/10">
                      <div className="aspect-[4/5] rounded-xl overflow-hidden">
                        <Image 
                          src="/images/woman-phone.jpeg"
                          alt="Woman using phone for RSVP"
                          width={400}
                          height={500}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Subtle overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-xl"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Envelope Invitation Section */}
        <div id="invitations" className="page-section radial-overlay" ref={envelopeRef}>
          <div className="page-section-content">
            <EnvelopeInvitation />
          </div>
        </div>

        {/* Final CTA */}
        <div className="py-32 px-6 subtle-grid dark-overlay">
          <div 
            className={`max-w-3xl mx-auto text-center animate-reveal ${ctaReveal.isRevealed ? 'revealed' : ''}`}
            ref={ctaReveal.ref}
          >
            <div className="mb-12">
              <span className="inline-block px-4 py-2 bg-green-500/20 text-green-300 rounded-full text-sm font-medium mb-4 animate-pulse">Simple Pricing</span>
              <h2 className="text-5xl font-bold mb-8 relative">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500 animate-gradient-x">
                  Ready to Create Your Event?
                </span>
                {/* Subtle glow for improved visibility */}
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-500/20 blur-lg -z-10 opacity-30"></span>
              </h2>
              <p className="text-xl text-white/80 mb-6">
                Create beautiful RSVP pages and start managing your events today.
              </p>
              <p className="text-xl font-medium mb-6">
                <span className="text-emerald-400">Plans starting at just $9/month</span>
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/create"
                className="inline-block px-10 py-5 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-all shadow-xl text-lg"
              >
                Create Your RSVP Page Now
              </Link>
              <Link
                href="/#pricing"
                className="inline-block px-10 py-5 bg-white/10 border border-emerald-500/50 text-white font-semibold rounded-xl hover:bg-emerald-500/10 transition-all text-lg"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer showDonate={true} />
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen relative overflow-hidden">
        <div className="animated-bg" />
        <div className="spotlight" />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
        <Footer showDonate={true} />
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}