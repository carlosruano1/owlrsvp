'use client'

import React from 'react'
import Image from 'next/image'

interface ElegantLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showImage?: boolean
}

export default function ElegantLogo({ size = 'lg', showImage = false }: ElegantLogoProps) {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-5xl',
    xl: 'text-7xl'
  }
  
  const imageSizes = {
    sm: 24,
    md: 32,
    lg: 48,
    xl: 64
  }
  
  return (
    <div className="logo-container relative flex items-center gap-3">
      {showImage && (
        <div className={`relative overflow-hidden`} style={{ width: imageSizes[size], height: imageSizes[size] }}>
          <Image 
            src="/images/owlrsvp_logo_png.png" 
            alt="OwlRSVP Logo" 
            width={imageSizes[size]} 
            height={imageSizes[size]} 
            className="object-contain"
          />
        </div>
      )}
      <h1 className={`font-bold tracking-tight ${sizeClasses[size]}`}>
        <span className="text-white">owl</span>
        <span className="text-blue-400">rsvp</span>
      </h1>
    </div>
  )
}
