'use client'

import { useState } from 'react'
import Image from 'next/image'

interface Photo {
  src: string
  alt: string
  caption?: string
}

interface ModernPhotoGridProps {
  photos: Photo[]
}

export default function ModernPhotoGrid({ photos }: ModernPhotoGridProps) {
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null)
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Photo grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {photos.map((photo, index) => (
          <div 
            key={photo.src} 
            className={`group relative overflow-hidden rounded-lg cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
              index === 0 ? 'col-span-2 row-span-2 md:col-span-2 md:row-span-2' : ''
            }`}
            style={{ aspectRatio: index === 0 ? '4/3' : '1/1' }}
            onClick={() => setActivePhoto(photo)}
          >
            {/* Image */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300 z-10"></div>
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              className="object-cover transition-all duration-500 group-hover:scale-105"
            />
            
            {/* Caption overlay on hover */}
            {photo.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                <p className="text-sm">{photo.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Lightbox */}
      {activePhoto && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setActivePhoto(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[80vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              onClick={() => setActivePhoto(null)}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="relative w-full h-full max-h-[70vh]">
              <Image
                src={activePhoto.src}
                alt={activePhoto.alt}
                fill
                className="object-contain"
              />
            </div>
            
            {activePhoto.caption && (
              <div className="mt-4 text-center text-white">
                <p>{activePhoto.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
