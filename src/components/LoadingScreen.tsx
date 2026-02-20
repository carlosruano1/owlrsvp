'use client'

import Image from 'next/image'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Image
            src="/images/owlrsvp_logo_png.png"
            alt="OwlRSVP Logo"
            width={80}
            height={80}
            className="object-contain animate-pulse-dim"
            priority
          />
        </div>
        <div className="text-white/60 text-sm font-light tracking-wide">
          Loading...
        </div>
      </div>
    </div>
  )
}
