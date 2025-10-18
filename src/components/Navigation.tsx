'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled)
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [scrolled])
  
  // Close mobile menu when navigating
  const handleNavigate = (path: string) => {
    setMobileMenuOpen(false)
    router.push(path)
  }

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
  
  return (
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
          <Link href="/#features" className="text-white/80 hover:text-white transition-colors">
            Features
          </Link>
          <Link href="/#pricing" className="text-white/80 hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="/#how-it-works" className="text-white/80 hover:text-white transition-colors">
            How It Works
          </Link>
          <Link href="/about" className="text-white/80 hover:text-white transition-colors">
            About
          </Link>
        </nav>
        
        {/* CTA & Admin */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/create')}
            className="bg-white text-black px-5 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            Create Event
          </button>
          <Link 
            href="/admin/login" 
            className="text-white/70 hover:text-white text-sm transition-colors hidden sm:block"
          >
            Login
          </Link>

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
          <nav className="flex flex-col items-center gap-8 py-8">
            <Link 
              href="/#features" 
              className="text-white/80 hover:text-white transition-colors text-2xl font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="/#pricing" 
              className="text-white/80 hover:text-white transition-colors text-2xl font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link 
              href="/#how-it-works" 
              className="text-white/80 hover:text-white transition-colors text-2xl font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link 
              href="/about" 
              className="text-white/80 hover:text-white transition-colors text-2xl font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              href="/admin/login" 
              className="text-white/70 hover:text-white transition-colors text-xl mt-4"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                router.push('/create');
              }}
              className="mt-8 px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all"
            >
              Create Your Event
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}
