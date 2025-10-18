'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function AdminNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className="bg-black/80 backdrop-blur-md shadow-lg py-3 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/admin/settings" className="flex items-center gap-3 mt-1 relative z-50">
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
          <Link href="/admin/settings" className="text-white/80 hover:text-white transition-colors">
            Settings
          </Link>
          <Link href="/admin/events" className="text-white/80 hover:text-white transition-colors">
            My Events
          </Link>
          <Link href="/create" className="text-white/80 hover:text-white transition-colors">
            Create Event
          </Link>
        </nav>
        
        {/* Logout Button */}
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
            className="md:hidden relative z-50 p-1"
            aria-label="Toggle mobile menu"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span 
                className={`w-full h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}
              ></span>
              <span 
                className={`w-full h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}
              ></span>
              <span 
                className={`w-full h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}
              ></span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-black/90 backdrop-blur-lg z-40 md:hidden transition-all duration-300 ${
          mobileMenuOpen 
            ? 'opacity-100 pointer-events-auto' 
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <nav className="flex flex-col items-center gap-6 py-8">
            <Link 
              href="/admin/settings" 
              className="text-white/80 hover:text-white transition-colors text-xl font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Settings
            </Link>
            <Link 
              href="/admin/events" 
              className="text-white/80 hover:text-white transition-colors text-xl font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              My Events
            </Link>
            <Link 
              href="/create" 
              className="text-white/80 hover:text-white transition-colors text-xl font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Create Event
            </Link>
            <button
              onClick={handleLogout}
              className="mt-8 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}
