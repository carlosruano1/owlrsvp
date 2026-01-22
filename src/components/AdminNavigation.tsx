'use client'

import React, { useState, useEffect, Fragment } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'

// Admin navigation links data
const ADMIN_LINKS = [
  { href: '/admin/events', label: 'My Events' },
  { href: '/create', label: 'Create Event' },
  { href: '/admin/settings', label: 'Settings' }
]

// Auth pages that should show simplified header
const AUTH_PAGES = [
  '/admin/login',
  '/admin/register',
  '/admin/forgot-password',
  '/admin/reset-password',
  '/admin/setup-totp'
]

export default function AdminNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const isAuthPage = AUTH_PAGES.includes(pathname || '')
  
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
  
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Handle navigation
  const handleNavigate = (path: string) => {
    setMobileMenuOpen(false)
    router.push(path)
  }

  // Simplified header for auth pages
  if (isAuthPage) {
    return (
      <header className="bg-transparent py-4 fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-all">
            <span className="text-lg font-bold">
              owl<span className="text-blue-400">rsvp</span>.com
            </span>
          </Link>
        </div>
      </header>
    )
  }

  return (
    <Fragment>
      <header className="bg-black/80 backdrop-blur-md shadow-lg py-3 sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mt-1 relative z-50">
            <div className="relative h-8 w-8 overflow-hidden">
              <Image 
                src="/images/owlrsvp_logo_png.png" 
                alt="OwlRSVP Logo" 
                width={32} 
                height={32} 
                className="object-contain"
              />
            </div>
            <span className="text-white text-lg font-bold hidden sm:inline-block">
              owl<span className="text-blue-400">rsvp</span> <span className="text-xs text-white/60">admin</span>
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {ADMIN_LINKS.map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                className="text-white/80 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          
          {/* Logout Button & Mobile Menu */}
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium border border-white/20 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>

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
              {ADMIN_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-4 text-center text-white text-2xl font-medium border-b border-white/10"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Logout Button */}
          <div className="mt-8">
            <button
              onClick={handleLogout}
              className="w-full py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all text-lg flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </Fragment>
  )
}
