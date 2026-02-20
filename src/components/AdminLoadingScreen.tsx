'use client'

import Image from 'next/image'

export default function AdminLoadingScreen() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="animated-bg" />
      <div className="spotlight" />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Image
              src="/images/owlrsvp_logo_png.png"
              alt="OwlRSVP"
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
    </div>
  )
}
