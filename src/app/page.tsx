'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'
import ElegantLogo from '@/components/ElegantLogo'
import Navigation from '@/components/Navigation'
import Image from 'next/image'
import { useScrollReveal, useParallax } from '@/hooks/useScrollReveal'

export default function Home() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Animation hooks
  const heroReveal = useScrollReveal()
  const featuresReveal = useScrollReveal()
  const pricingReveal = useScrollReveal()
  const howItWorksReveal = useScrollReveal()
  const testimonialsReveal = useScrollReveal()
  const ctaReveal = useScrollReveal()
  
  // We're not using the mouse parallax effect anymore
  // const heroParallax = useParallax()

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
    
    return () => {
      revealElements.forEach(element => {
        observer.unobserve(element)
      })
    }
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden">
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
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight tracking-tight">
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
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-white">
                  to grow your
                </span>
                {" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient-x">
                  attendance
                </span>
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

            {/* Email Form */}
            <div className="animate-reveal flex flex-col sm:flex-row gap-3 max-w-xl">
              <input 
                type="email" 
                placeholder="Email address" 
                className="px-5 py-4 rounded-lg bg-white/10 border border-white/20 text-white w-full sm:w-2/3 focus:outline-none focus:border-blue-500"
              />
              <Link
                href="/create"
                className="group relative px-6 py-4 bg-white text-black font-semibold rounded-lg transition-all hover:scale-105 shadow-xl inline-block w-full sm:w-1/3 text-center"
              >
                <span className="relative z-10">Start now</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity"></div>
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
                {/* Phone Screen */}
                <div className="absolute inset-0 z-30">
                  <img 
                    src="/screenshots/phone_sc.png" 
                    alt="OwlRSVP Mobile App" 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Animated screen shine effect */}
                  <div 
                    className="absolute inset-0 z-40 pointer-events-none"
                    style={{
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
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
              <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
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
                
                {/* Screenshot with Interactive Effects */}
                <div className="relative rounded-md overflow-hidden">
                  <img 
                    src="/screenshots/desktop_sc.png" 
                    alt="OwlRSVP Dashboard" 
                    className="w-full h-auto object-cover"
                  />
                  
                  {/* Interactive Hover Highlight */}
                  <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-purple-500/10 to-transparent"></div>
                    
                    {/* Hotspot Animations */}
                    <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-blue-500/30 rounded-full animate-ping" style={{animationDuration: "3s"}}></div>
                    <div className="absolute top-2/3 right-1/3 w-12 h-12 bg-purple-500/30 rounded-full animate-ping" style={{animationDuration: "4s", animationDelay: "1s"}}></div>
                  </div>
                  
                  {/* Enhanced Reflection/Glare Effect */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none"
                    style={{
                      maskImage: "linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0.5), rgba(0,0,0,0))",
                      WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0.5), rgba(0,0,0,0))"
                    }}
                  ></div>
                  
                  {/* Moving Shine Effect */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                      backgroundSize: "200% 100%",
                      animation: "shine-effect 3s linear infinite"
                    }}
                  ></div>
                </div>
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

        {/* Main Features Section */}
        <div id="features" className="page-section bg-gradient-to-b from-transparent to-gray-900/50 diagonal-bottom">
          <div 
            className="page-section-content animate-reveal stagger-reveal"
            ref={featuresReveal.ref}
          >
            <h2 className="text-4xl font-bold text-center mb-16 text-gradient">Main Features</h2>
            <div className="section-cards">
              <div className="feature-card p-8 text-center hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Lightning Fast</h3>
                <p className="text-white/80 text-lg">Create and customize your RSVP page in under 60 seconds. No complex setup required.</p>
              </div>
              
              <div className="feature-card p-8 text-center hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Beautiful Design</h3>
                <p className="text-white/80 text-lg">Stunning, modern interface that your guests will love. Customize colors and branding to match your style.</p>
              </div>
              
              <div className="feature-card p-8 text-center hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Easy Management</h3>
                <p className="text-white/80 text-lg">Track responses, export data, and manage your guest list with our intuitive admin dashboard.</p>
              </div>
              
              <div className="feature-card p-8 text-center hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-xl flex items-center justify-center mx-auto mb-6 animate-pulse">
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

        {/* Pricing Section */}
        <div id="pricing" className="page-section subtle-grid dark-overlay">
          <div 
            className="page-section-content animate-reveal stagger-reveal"
            ref={pricingReveal.ref}
          >
            <h2 className="text-4xl font-bold text-center mb-6 text-gradient">Simple, Transparent Pricing</h2>
            <p className="text-xl text-white/80 text-center mb-16 max-w-2xl mx-auto">
              Choose the plan that fits your needs. All plans include our beautiful RSVP pages and core features.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Free Plan */}
              <div className="glass-card rounded-2xl p-8 hover:transform hover:scale-105 transition-all duration-300">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                  <div className="text-4xl font-bold text-white mb-2">$0</div>
                  <p className="text-white/70">Perfect for small events</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">Up to 50 guests</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">Single event</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">Basic customization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">Export to CSV</span>
                  </li>
                </ul>
                
                <button
                  onClick={() => router.push('/create')}
                  className="w-full py-3 rounded-lg font-medium transition-all bg-white/20 text-white hover:bg-white/30"
                >
                  Get Started
                </button>
              </div>
              
              {/* Basic Plan */}
              <div className="glass-card rounded-2xl p-8 border-2 border-blue-400/50 transform scale-105">
                <div className="absolute -top-3 right-4">
                  <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">POPULAR</span>
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Basic</h3>
                  <div className="text-4xl font-bold text-white mb-2">$9</div>
                  <p className="text-white/70">Per month</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">Up to 500 guests</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">Multiple events</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">Custom branding</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">$0.03 per guest over limit</span>
                  </li>
                </ul>
                
                <button
                  onClick={() => router.push('/create')}
                  className="w-full py-3 rounded-lg font-medium transition-all bg-blue-500 text-white hover:bg-blue-600"
                >
                  Choose Plan
                </button>
              </div>
              
              {/* Pro Plan */}
              <div className="glass-card rounded-2xl p-8 hover:transform hover:scale-105 transition-all duration-300">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                  <div className="text-4xl font-bold text-white mb-2">$29</div>
                  <p className="text-white/70">Per month</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">Up to 5,000 guests</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">Unlimited events</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">Advanced analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">$0.03 per guest over limit</span>
                  </li>
                </ul>
                
                <button
                  onClick={() => router.push('/create')}
                  className="w-full py-3 rounded-lg font-medium transition-all bg-white/20 text-white hover:bg-white/30"
                >
                  Choose Plan
                </button>
              </div>
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
        <div id="how-it-works" className="page-section polygons-bg pattern-overlay diagonal-top">
          <div 
            className="page-section-content animate-reveal stagger-reveal"
            ref={howItWorksReveal.ref}
          >
            <h2 className="text-4xl font-bold text-center mb-16 text-gradient">How It Works</h2>
            <div className="section-split">
              <div className="space-y-12">
                <div className="flex items-start gap-6 animate-slideInLeft" style={{ animationDelay: '0.2s' }}>
                  <div className="w-16 h-16 rounded-full bg-blue-500/30 border border-blue-400/30 flex items-center justify-center shrink-0">
                    <span className="text-2xl font-bold text-blue-400">1</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-2">Create Your Event</h3>
                    <p className="text-white/90">Enter your event details, customize colors, and upload your company logo. No account required to get started.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-6 animate-slideInLeft" style={{ animationDelay: '0.4s' }}>
                  <div className="w-16 h-16 rounded-full bg-pink-500/30 border border-pink-400/30 flex items-center justify-center shrink-0">
                    <span className="text-2xl font-bold text-pink-400">2</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-2">Share With Guests</h3>
                    <p className="text-white/90">Send your custom RSVP link via email, social media, or embed the QR code in your invitations.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-6 animate-slideInLeft" style={{ animationDelay: '0.6s' }}>
                  <div className="w-16 h-16 rounded-full bg-green-500/30 border border-green-400/30 flex items-center justify-center shrink-0">
                    <span className="text-2xl font-bold text-green-400">3</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-2">Track Responses</h3>
                    <p className="text-white/90">Monitor RSVPs in real-time through your admin dashboard. Export the guest list anytime.</p>
                  </div>
                </div>
              </div>
              
              <div className="hidden md:flex items-center justify-center animate-scaleIn">
                <div className="relative w-full max-w-md">
                  <div className="absolute -top-6 -left-6 w-full h-full border-2 border-blue-400/30 rounded-xl"></div>
                  <div className="absolute -bottom-6 -right-6 w-full h-full border-2 border-pink-400/30 rounded-xl"></div>
                  <div className="relative bg-black/40 p-8 rounded-xl backdrop-blur-sm">
                    <Image 
                      src="/images/owlrsvp_logo_png.png"
                      alt="OwlRSVP Logo"
                      width={80}
                      height={80}
                      className="mx-auto mb-6"
                    />
                    <h4 className="text-xl font-semibold text-center mb-4">Simple 3-Step Process</h4>
                    <p className="text-white/80 text-center">From creation to management, our platform makes event RSVPs effortless.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div id="testimonials" className="page-section space-bg radial-overlay">
          <div 
            className="page-section-content animate-reveal stagger-reveal"
            ref={testimonialsReveal.ref}
          >
            <h2 className="text-4xl font-bold text-center mb-16 text-gradient">What People Say</h2>
            
            <div className="relative max-w-4xl mx-auto">
              {/* Decorative elements */}
              <div className="absolute -top-12 -left-12 w-24 h-24 border-t-2 border-l-2 border-blue-400/30"></div>
              <div className="absolute -bottom-12 -right-12 w-24 h-24 border-b-2 border-r-2 border-pink-400/30"></div>
              
              {/* Testimonial cards with staggered animation */}
              <div className="space-y-8">
                <div className="feature-card p-6 md:p-8 animate-slideInRight" style={{ animationDelay: '0.2s' }}>
                  <div className="flex flex-col md:flex-row md:items-center gap-6 mb-4">
                    <div className="w-20 h-20 rounded-full bg-blue-500/30 flex items-center justify-center shrink-0 mx-auto md:mx-0">
                      <span className="text-2xl font-bold text-blue-300">JD</span>
                    </div>
                    <div className="text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <h4 className="text-xl font-semibold text-white">John Doe</h4>
                      <p className="text-base text-white/60">Marketing Director</p>
                    </div>
                  </div>
                  <p className="text-white/90 text-lg italic">"OwlRSVP transformed our corporate event management. The customization options are perfect for maintaining our brand identity."</p>
                </div>
                
                <div className="feature-card p-6 md:p-8 animate-slideInRight" style={{ animationDelay: '0.4s' }}>
                  <div className="flex flex-col md:flex-row md:items-center gap-6 mb-4">
                    <div className="w-20 h-20 rounded-full bg-pink-500/30 flex items-center justify-center shrink-0 mx-auto md:mx-0">
                      <span className="text-2xl font-bold text-pink-300">AS</span>
                    </div>
                    <div className="text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <h4 className="text-xl font-semibold text-white">Alice Smith</h4>
                      <p className="text-base text-white/60">Event Planner</p>
                    </div>
                  </div>
                  <p className="text-white/90 text-lg italic">"I love how quickly I can set up new events. The admin dashboard makes tracking responses so simple, and my clients are impressed!"</p>
                </div>
                
                <div className="feature-card p-6 md:p-8 animate-slideInRight" style={{ animationDelay: '0.6s' }}>
                  <div className="flex flex-col md:flex-row md:items-center gap-6 mb-4">
                    <div className="w-20 h-20 rounded-full bg-green-500/30 flex items-center justify-center shrink-0 mx-auto md:mx-0">
                      <span className="text-2xl font-bold text-green-300">RJ</span>
                    </div>
                    <div className="text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <h4 className="text-xl font-semibold text-white">Robert Johnson</h4>
                      <p className="text-base text-white/60">Tech Startup CEO</p>
                    </div>
                  </div>
                  <p className="text-white/90 text-lg italic">"The QR code feature is a game-changer for our tech conferences. Attendees love the sleek design and how easy it is to respond."</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="py-32 px-6 subtle-grid dark-overlay">
          <div 
            className="max-w-3xl mx-auto text-center animate-reveal"
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