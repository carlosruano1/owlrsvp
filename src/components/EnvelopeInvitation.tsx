'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

export default function EnvelopeInvitation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateScrollProgress = () => {
      const rect = container.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      
      // Animation starts when section is well centered in viewport (30% of viewport)
      // This ensures the section is clearly visible before animation begins
      const startPoint = viewportHeight * 0.3  // Start later - when section is clearly in view
      const endPoint = viewportHeight * 0.05   // Complete when near top
      
      let progress = 0
      if (rect.top < startPoint) {
        if (rect.top > endPoint) {
          progress = (startPoint - rect.top) / (startPoint - endPoint)
        } else {
          progress = 1
        }
      }
      
      progress = Math.max(0, Math.min(1, progress))
      setScrollProgress(progress)
    }

    updateScrollProgress()
    window.addEventListener('scroll', updateScrollProgress, { passive: true })
    window.addEventListener('resize', updateScrollProgress)

    return () => {
      window.removeEventListener('scroll', updateScrollProgress)
      window.removeEventListener('resize', updateScrollProgress)
    }
  }, [])

  // Apple-style easing - smoother, more dramatic
  const easeInOutQuart = (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
  const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
  
  const easedProgress = easeInOutQuart(scrollProgress)
  const contentEase = easeOutExpo(scrollProgress)
  
  // Enhanced 3D paper fold animations
  const topFoldAngle = Math.min(180, easedProgress * 200) // Slightly over-rotate for drama
  const bottomFoldAngle = Math.min(180, Math.max(0, (easedProgress - 0.05) * 200)) // Delayed start
  const contentOpacity = Math.max(0, Math.min(1, (scrollProgress - 0.3) * 2)) // Earlier fade-in
  const contentScale = 0.88 + contentEase * 0.12 // Smoother scale
  
  // 3D transforms
  const containerRotateX = (1 - easedProgress) * 12 // Less aggressive tilt
  const shadowIntensity = 0.2 + easedProgress * 0.35
  const glowIntensity = 0.2 + easedProgress * 0.5

  return (
    <div 
      ref={containerRef}
      className="relative w-full mx-auto pt-16 pb-8 md:py-28 px-3 sm:px-4"
      style={{ minHeight: '100vh' }}
    >
      {/* Section Title */}
      <div className="text-center mb-12 md:mb-20 max-w-4xl mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-purple-200 via-pink-200 to-amber-200 bg-clip-text text-transparent">
          A New Way to Invite
        </h2>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/70 leading-relaxed">
          Print beautiful invitations with QR codes. Your guests scan and RSVP instantly—no phone calls, no hassle.
        </p>
      </div>

      {/* Paper Container with enhanced 3D perspective */}
      <div 
        className="relative flex items-center justify-center"
        style={{
          perspective: '1500px',
          perspectiveOrigin: 'center center',
        }}
      >
        {/* Enhanced ambient glow with particles */}
        <div
          className="absolute rounded-full blur-[100px] md:blur-[140px] -z-10"
          style={{
            background: `radial-gradient(circle, rgba(167,139,250,${glowIntensity}), rgba(236,72,153,${glowIntensity * 0.6}), transparent 70%)`,
            width: '400px',
            height: '400px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.3s ease-out',
          }}
        />
        
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-300/30 rounded-full blur-sm"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 2) * 40}%`,
              opacity: easedProgress * 0.6,
              transform: `translateY(${-easedProgress * 20}px) scale(${1 + easedProgress * 0.5})`,
              transition: 'all 0.3s ease-out',
            }}
          />
        ))}

        {/* Main paper card - wider on mobile */}
        <div
          className="relative w-[92vw] max-w-[380px] sm:max-w-[460px] md:max-w-[540px] lg:max-w-[600px]"
          style={{
            transform: `rotateX(${containerRotateX}deg) translateZ(0)`,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.15s ease-out',
          }}
        >
          {/* Paper sheet with enhanced 3D folds */}
          <div className="relative aspect-[3/4] w-full"
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Main card body with enhanced shadows */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-[28px] md:rounded-[36px] overflow-hidden"
              style={{
                boxShadow: `
                  0 60px 120px rgba(0, 0, 0, ${shadowIntensity}),
                  0 25px 50px rgba(0, 0, 0, ${shadowIntensity * 0.6}),
                  0 10px 20px rgba(0, 0, 0, ${shadowIntensity * 0.4}),
                  inset 0 1px 3px rgba(255, 255, 255, 0.9),
                  inset 0 -1px 2px rgba(0, 0, 0, 0.08)
                `,
                transform: `scale(${contentScale}) translateZ(20px)`,
                transformStyle: 'preserve-3d',
                transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out',
              }}
            >
              {/* Top fold - enhanced 3D */}
              <div
                className="absolute top-0 left-0 right-0 h-[35%] origin-top"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(245,245,250,0.95) 50%, rgba(235,235,245,0.92) 100%)',
                  transform: `rotateX(${-topFoldAngle}deg) translateZ(10px)`,
                  transformStyle: 'preserve-3d',
                  zIndex: topFoldAngle > 90 ? 1 : 5,
                  backfaceVisibility: 'hidden',
                  borderTopLeftRadius: '28px',
                  borderTopRightRadius: '28px',
                  boxShadow: `
                    0 ${Math.min(topFoldAngle, 90) * 0.8}px ${Math.min(topFoldAngle, 90) * 1.5}px rgba(0,0,0,${0.25 * (topFoldAngle / 180)}),
                    inset 0 -1px 2px rgba(0,0,0,0.1)
                  `,
                  transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out',
                }}
              >
                {/* Enhanced fold crease line */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gray-400/60 to-transparent shadow-sm" />
                {/* Inner fold shadow */}
                <div 
                  className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5"
                  style={{ opacity: Math.min(1, topFoldAngle / 180) }}
                />
              </div>

              {/* Bottom fold - enhanced 3D */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[35%] origin-bottom"
                style={{
                  background: 'linear-gradient(0deg, rgba(255,255,255,0.98) 0%, rgba(245,245,250,0.95) 50%, rgba(235,235,245,0.92) 100%)',
                  transform: `rotateX(${bottomFoldAngle}deg) translateZ(10px)`,
                  transformStyle: 'preserve-3d',
                  zIndex: bottomFoldAngle > 90 ? 1 : 5,
                  backfaceVisibility: 'hidden',
                  borderBottomLeftRadius: '28px',
                  borderBottomRightRadius: '28px',
                  boxShadow: `
                    0 ${-Math.min(bottomFoldAngle, 90) * 0.8}px ${Math.min(bottomFoldAngle, 90) * 1.5}px rgba(0,0,0,${0.25 * (bottomFoldAngle / 180)}),
                    inset 0 1px 2px rgba(0,0,0,0.1)
                  `,
                  transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out',
                }}
              >
                {/* Enhanced fold crease line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gray-400/60 to-transparent shadow-sm" />
                {/* Inner fold shadow */}
                <div 
                  className="absolute inset-0 bg-gradient-to-t from-transparent to-black/5"
                  style={{ opacity: Math.min(1, bottomFoldAngle / 180) }}
                />
              </div>

              {/* Content - visible when paper opens with better mobile spacing */}
              <div
                className="absolute inset-0 flex flex-col p-5 sm:p-6 md:p-10 lg:p-12 z-10"
                style={{
                  opacity: contentOpacity,
                  pointerEvents: contentOpacity > 0.5 ? 'auto' : 'none',
                  transform: `translateZ(30px)`,
                }}
              >
                {/* Header with logo - better mobile layout */}
                <div className="flex items-start justify-between mb-3 sm:mb-4 md:mb-6">
                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-0.5 sm:mb-1">
                      You're Invited
                    </h3>
                    <p className="text-xs sm:text-sm md:text-base text-gray-500">
                      An exclusive event
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-br from-purple-50 to-pink-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg md:rounded-xl border border-purple-100/50 ml-2">
                    <Image
                      src="/images/owlrsvp_logo_png.png"
                      alt="OwlRSVP"
                      width={20}
                      height={20}
                      className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 object-contain"
                    />
                    <span className="text-[10px] sm:text-xs font-bold text-purple-600 tracking-wider hidden sm:inline">OWLRSVP</span>
                  </div>
                </div>

                {/* Large attention-grabbing text */}
                <div className="mb-2 sm:mb-3 md:mb-4 text-center">
                  <p className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-amber-400 leading-none tracking-tight">
                    RSVP
                  </p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-400 mt-1 tracking-wider">
                    INSTANTLY
                  </p>
                </div>

                {/* Body - optimized spacing with reduced gap */}
                <div className="flex-1 flex flex-col justify-center space-y-2.5 sm:space-y-3 md:space-y-4 text-xs sm:text-sm md:text-base text-gray-700 leading-relaxed">
                  <p className="mt-1"><strong className="text-gray-900">Dear Guest,</strong></p>
                  <p>
                    We're thrilled to invite you to our upcoming celebration. 
                    Simply scan the QR code below to confirm your attendance instantly.
                  </p>
                  <p className="text-gray-600 italic text-xs sm:text-sm">
                    No phone calls or emails needed—just scan and you're set!
                  </p>
                </div>

                {/* QR Code - enhanced with better mobile sizing */}
                <div className="mt-4 sm:mt-6 md:mt-8 flex flex-col items-center">
                  <div className="relative">
                    <div 
                      className="absolute inset-0 bg-gradient-to-br from-purple-400/30 to-pink-400/30 blur-xl rounded-2xl"
                      style={{ 
                        transform: 'scale(1.15)',
                        opacity: contentOpacity,
                      }}
                    />
                    <div className="relative bg-white p-3 sm:p-4 md:p-5 rounded-xl md:rounded-2xl shadow-xl border-2 border-gray-100">
                      <Image
                        src="/images/qr-code.png"
                        alt="Scan to RSVP"
                        width={140}
                        height={140}
                        className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[140px] md:h-[140px]"
                      />
                    </div>
                  </div>
                  <p className="mt-3 sm:mt-4 text-[10px] sm:text-xs md:text-sm text-gray-500 font-semibold tracking-[0.1em] text-center">
                    SCAN TO RSVP • INSTANT CONFIRMATION
                  </p>
                </div>

                {/* Footer - tighter mobile spacing */}
                <div className="mt-3 sm:mt-4 md:mt-6 pt-3 sm:pt-4 md:pt-6 border-t border-gray-200 text-center">
                  <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 italic">
                    We look forward to celebrating with you!
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced decorative corner accents */}
            <div 
              className="absolute -top-2 sm:-top-3 -left-2 sm:-left-3 w-16 sm:w-20 h-16 sm:h-20 border-l-2 border-t-2 border-purple-400/40 rounded-tl-3xl"
              style={{ 
                opacity: easedProgress * 0.8,
                transform: `scale(${1 + easedProgress * 0.1})`,
                transition: 'all 0.3s ease-out',
              }}
            />
            <div 
              className="absolute -bottom-2 sm:-bottom-3 -right-2 sm:-right-3 w-16 sm:w-20 h-16 sm:h-20 border-r-2 border-b-2 border-pink-400/40 rounded-br-3xl"
              style={{ 
                opacity: easedProgress * 0.8,
                transform: `scale(${1 + easedProgress * 0.1})`,
                transition: 'all 0.3s ease-out',
              }}
            />
          </div>
        </div>
      </div>

      {/* Enhanced scroll hint */}
      {scrollProgress < 0.05 && (
        <div className="absolute bottom-4 md:bottom-12 left-1/2 -translate-x-1/2 text-center animate-bounce">
          <p className="text-white/60 text-xs sm:text-sm mb-2 font-medium tracking-wide">Scroll to unfold</p>
          <svg className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      )}
    </div>
  )
}
