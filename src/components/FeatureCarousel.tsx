'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface Slide {
  title: string
  subtitle?: string
  src: string
  alt: string
  badge?: string
}

interface FeatureCarouselProps {
  slides: Slide[]
  intervalMs?: number
}

export default function FeatureCarousel({ slides, intervalMs = 5000 }: FeatureCarouselProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), intervalMs)
    return () => clearInterval(id)
  }, [slides.length, intervalMs])

  if (!slides || slides.length === 0) return null

  const go = (dir: number) => setIndex((i) => (i + dir + slides.length) % slides.length)

  return (
    <div className="relative max-w-5xl mx-auto">
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/30 shadow-2xl">
        {/* Slide */}
        <div className="relative w-full h-[300px] md:h-[480px] bg-black/60">
          <Image
            src={slides[index].src}
            alt={slides[index].alt}
            fill
            className="object-contain object-center"
            priority
            sizes="(max-width: 1024px) 100vw, 900px"
          />
          {slides[index].badge && (
            <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-2 px-2 py-1 bg-white/10 backdrop-blur rounded text-xs text-white/90 border border-white/20">
              <span>{slides[index].badge}</span>
            </div>
          )}
        </div>

        {/* Overlay title */}
        {(slides[index].title || slides[index].subtitle) && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
            <div className="text-white text-lg font-semibold">{slides[index].title}</div>
            {slides[index].subtitle && <div className="text-white/80 text-sm">{slides[index].subtitle}</div>}
          </div>
        )}

        {/* Controls */}
        {slides.length > 1 && (
          <>
            <button aria-label="Previous"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white grid place-items-center border border-white/20">
              ‹
            </button>
            <button aria-label="Next"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white grid place-items-center border border-white/20">
              ›
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)} aria-label={`Go to slide ${i + 1}`}
              className={`h-2.5 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-2.5 bg-white/40'}`}></button>
          ))}
        </div>
      )}
    </div>
  )
}


