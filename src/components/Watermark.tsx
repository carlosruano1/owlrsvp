'use client'

import Link from 'next/link'

export default function Watermark() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-none">
      <div className="flex items-center justify-center py-4 px-4">
        <div className="bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-md border-t-2 border-white/20 px-6 py-3 rounded-t-2xl shadow-2xl">
          <Link 
            href="https://owlrsvp.com" 
            className="text-white hover:text-white/90 text-sm font-semibold transition-all pointer-events-auto flex items-center gap-2 group"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="group-hover:scale-105 transition-transform">Create your event with</span>
            <span className="font-bold text-lg group-hover:scale-110 transition-transform">OwlRSVP</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

