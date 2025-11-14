'use client'

import Link from 'next/link'

export default function Watermark() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="flex items-center justify-center py-3 px-4">
        <div className="bg-black/40 backdrop-blur-sm border-t border-white/10 px-4 py-2 rounded-t-xl">
          <Link 
            href="https://owlrsvp.com" 
            className="text-white/60 hover:text-white/80 text-xs font-medium transition-colors pointer-events-auto flex items-center gap-1.5"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Powered by</span>
            <span className="font-semibold text-white/80">OwlRSVP</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

