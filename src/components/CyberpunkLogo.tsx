'use client'

import React, { useEffect, useRef } from 'react'

interface CyberpunkLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  glitchEffect?: boolean
}

export default function CyberpunkLogo({ size = 'lg', glitchEffect = true }: CyberpunkLogoProps) {
  const logoRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (glitchEffect && logoRef.current) {
      const glitchInterval = setInterval(() => {
        const logo = logoRef.current
        if (!logo) return
        
        // Add glitch class briefly
        logo.classList.add('glitching')
        
        // Remove after short delay
        setTimeout(() => {
          logo?.classList.remove('glitching')
        }, 150)
      }, 3000)
      
      return () => clearInterval(glitchInterval)
    }
  }, [glitchEffect])
  
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-5xl',
    xl: 'text-7xl'
  }
  
  return (
    <div className="logo-container relative" ref={logoRef}>
      <h1 className={`font-bold tracking-tight ${sizeClasses[size]} relative z-10`}>
        <span className="neon-text">owl</span>
        <span className="neon-text-pink">rsvp</span>
      </h1>
      
      {/* Glitch effect layers */}
      <div className={`absolute top-0 left-0 w-full h-full font-bold tracking-tight ${sizeClasses[size]} opacity-0 glitch-layer-1`}>
        <span className="neon-text">owl</span>
        <span className="neon-text-pink">rsvp</span>
      </div>
      
      <div className={`absolute top-0 left-0 w-full h-full font-bold tracking-tight ${sizeClasses[size]} opacity-0 glitch-layer-2`}>
        <span className="neon-text">owl</span>
        <span className="neon-text-pink">rsvp</span>
      </div>
      
      <style jsx>{`
        .logo-container.glitching .glitch-layer-1 {
          opacity: 0.8;
          transform: translate(-2px, 1px);
          filter: blur(1px);
          clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
        }
        
        .logo-container.glitching .glitch-layer-2 {
          opacity: 0.8;
          transform: translate(2px, -1px);
          filter: blur(1px);
          clip-path: polygon(0 60%, 100% 60%, 100% 100%, 0 100%);
        }
      `}</style>
    </div>
  )
}
