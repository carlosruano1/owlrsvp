'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface Photo {
  src: string
  alt: string
  caption?: string
}

interface PhotoGalleryProps {
  photos: Photo[]
}

export default function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // Auto-rotate photos
  useEffect(() => {
    const interval = setInterval(() => {
      nextPhoto()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [activeIndex])
  
  const nextPhoto = () => {
    if (isAnimating) return
    
    setIsAnimating(true)
    setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % photos.length)
      setIsAnimating(false)
    }, 500)
  }
  
  const prevPhoto = () => {
    if (isAnimating) return
    
    setIsAnimating(true)
    setTimeout(() => {
      setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length)
      setIsAnimating(false)
    }, 500)
  }
  
  const goToPhoto = (index: number) => {
    if (isAnimating) return
    setActiveIndex(index)
  }
  
  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Decorative frame */}
      <div className="absolute -top-3 -left-3 -right-3 -bottom-3 border-2 border-blue-400/30 rounded-xl"></div>
      <div className="absolute -top-6 -right-6 -bottom-6 -left-6 border border-pink-400/20 rounded-xl"></div>
      
      {/* Main photo container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
        {/* Photos */}
        {photos.map((photo, index) => (
          <div
            key={photo.src}
            className={`absolute inset-0 transition-all duration-500 ${
              index === activeIndex 
                ? 'opacity-100 transform-none' 
                : index < activeIndex
                  ? 'opacity-0 translate-x-full'
                  : 'opacity-0 -translate-x-full'
            }`}
          >
            <div className="relative w-full h-full bg-black/40 backdrop-blur-sm p-2">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-contain rounded"
              />
            </div>
            
            {/* Caption */}
            {photo.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-3 text-center">
                <p className="text-sm">{photo.caption}</p>
              </div>
            )}
          </div>
        ))}
        
        {/* Navigation buttons */}
        <button
          onClick={prevPhoto}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10"
          aria-label="Previous photo"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button
          onClick={nextPhoto}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10"
          aria-label="Next photo"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Thumbnails */}
      <div className="flex justify-center mt-4 gap-2">
        {photos.map((photo, index) => (
          <button
            key={`thumb-${photo.src}`}
            onClick={() => goToPhoto(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === activeIndex ? 'bg-blue-400 scale-125' : 'bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to photo ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
