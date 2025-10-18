'use client'

import { useEffect, useRef, useState } from 'react'

interface ScrollRevealOptions {
  threshold?: number
  rootMargin?: string
}

export function useScrollReveal({ threshold = 0.1, rootMargin = '0px' }: ScrollRevealOptions = {}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true)
          observer.unobserve(element)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, rootMargin])

  return { ref, isRevealed }
}

export function useParallax() {
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const element = ref.current
    if (!element) return
    
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const { innerWidth, innerHeight } = window
      
      // Calculate mouse position as a percentage of the screen
      const x = (clientX / innerWidth - 0.5) * 2 // -1 to 1
      const y = (clientY / innerHeight - 0.5) * 2 // -1 to 1
      
      // Apply parallax effect to layers
      const layers = element.querySelectorAll('.parallax-layer')
      layers.forEach((layer, index) => {
        const depth = index + 1
        const moveX = x * depth * 10
        const moveY = y * depth * 10
        
        const htmlLayer = layer as HTMLElement
        htmlLayer.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`
      })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])
  
  return { ref }
}
