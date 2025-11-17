'use client'

import { useState, useEffect, Fragment } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

// Navigation links data - single source of truth
const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#how-it-works', label: 'How It Works' }
]

interface User {
  username?: string
  email?: string
}

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Handle scroll effect with debounce
  useEffect(() => {
    let ticking = false

    const updateScrolled = () => {
      setScrolled(window.scrollY > 20)
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrolled)
        ticking = true
      }
    }

    updateScrolled() // Initial check
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setIsLoggedIn(true)
          setUser(data.user)
        } else {
          setIsLoggedIn(false)
          setUser(null)
        }
      } catch (err) {
        setIsLoggedIn(false)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])
  
  // Handle navigation
  const handleNavigate = (path: string) => {
    setMobileMenuOpen(false)
    router.push(path)
  }

  return (
    <Fragment>
      {/* Fixed header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || mobileMenuOpen
            ? 'bg-black/80 backdrop-blur-md shadow-lg py-3' 
            : 'bg-transparent py-5'
        }`}
      >
        <div className="container mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mt-1 relative z-50">
            <div className="relative h-10 w-10 overflow-hidden">
              <Image 
                src="/images/owlrsvp_logo_png.png" 
                alt="OwlRSVP Logo" 
                width={40} 
                height={40} 
                className="object-contain"
              />
            </div>
            <span className="text-white text-xl font-bold hidden sm:inline-block">
              owl<span className="text-blue-400">rsvp</span>
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="text-white/80 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          
          {/* CTA & Admin */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/create')}
              className="bg-white text-black px-5 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Create Event
            </button>
            {!loading && (
              isLoggedIn && user ? (
                <Link 
                  href="/admin/settings" 
                  className="text-white/90 hover:text-white text-sm font-medium transition-colors hidden sm:flex items-center gap-2"
                >
                  <span>{user.username || user.email || 'Admin'}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
              ) : (
                <Link 
                  href="/admin/login" 
                  className="text-white/70 hover:text-white text-sm transition-colors hidden sm:block"
                >
                  Login
                </Link>
              )
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden relative z-50 p-2"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span 
                  className={`w-full h-0.5 bg-white transition-transform duration-300 ${
                    mobileMenuOpen ? 'translate-y-2 rotate-45' : ''
                  }`}
                />
                <span 
                  className={`w-full h-0.5 bg-white transition-opacity duration-300 ${
                    mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span 
                  className={`w-full h-0.5 bg-white transition-transform duration-300 ${
                    mobileMenuOpen ? '-translate-y-2 -rotate-45' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu - Full Screen Sheet */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 bg-black z-40 md:hidden transition-all duration-300 ${
          mobileMenuOpen 
            ? 'opacity-100 pointer-events-auto' 
            : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!mobileMenuOpen}
        role="dialog"
        aria-modal="true"
      >
        {/* Safe area for iOS/Android */}
        <div className="flex flex-col h-full pt-20 pb-8 px-6">
          {/* Navigation Links */}
          <div className="flex-1 flex flex-col justify-center">
            <nav className="space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-4 text-center text-white text-2xl font-medium border-b border-white/10"
                >
                  {link.label}
                </Link>
              ))}
              {!loading && (
                isLoggedIn && user ? (
                  <Link
                    href="/admin/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-4 text-center text-white text-2xl font-medium border-b border-white/10"
                  >
                    {user.username || user.email || 'Admin'}
                  </Link>
                ) : (
                  <Link
                    href="/admin/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-4 text-center text-white text-2xl font-medium border-b border-white/10"
                  >
                    Login
                  </Link>
                )
              )}
            </nav>
          </div>
          
          {/* CTA Button */}
          <div className="mt-8">
            <button
              onClick={() => handleNavigate('/create')}
              className="w-full py-4 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all text-lg"
            >
              Create Your Event
            </button>
          </div>
        </div>
      </div>
    </Fragment>
  )
}
