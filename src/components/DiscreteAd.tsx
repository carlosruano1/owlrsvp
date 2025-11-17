'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

interface DiscreteAdProps {
  /**
   * Only show ads for free tier events
   */
  show: boolean
}

/**
 * Discrete ad component for free tier events
 * Uses Google AdSense with a subtle, non-intrusive design
 */
export default function DiscreteAd({ show }: DiscreteAdProps) {
  const adRef = useRef<HTMLDivElement>(null)
  const adLoaded = useRef(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  const adClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID

  // Debug logging (remove in production)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DiscreteAd] Debug:', {
        show,
        adClient: adClient ? `${adClient.substring(0, 10)}...` : 'NOT SET',
        hasAdRef: !!adRef.current,
        scriptLoaded,
        adLoaded: adLoaded.current
      })
    }
  }, [show, adClient, scriptLoaded])

  useEffect(() => {
    if (!show || adLoaded.current || !adRef.current || !adClient || !scriptLoaded) return

    // Initialize ad after script loads
    const initAd = () => {
      try {
        if (window.adsbygoogle && adRef.current && !adLoaded.current) {
          console.log('[DiscreteAd] Initializing ad...')
          window.adsbygoogle.push({})
          adLoaded.current = true
          console.log('[DiscreteAd] Ad initialized successfully')
        }
      } catch (err) {
        console.error('[DiscreteAd] Error loading ad:', err)
      }
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initAd()
    }, 200)

    return () => clearTimeout(timer)
  }, [show, adClient, scriptLoaded])

  // Handle script load
  const handleScriptLoad = () => {
    console.log('[DiscreteAd] AdSense script loaded')
    setScriptLoaded(true)
  }

  if (!show) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DiscreteAd] Not showing: show prop is false')
    }
    return null
  }

  if (!adClient) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[DiscreteAd] AdSense client ID not configured. Add NEXT_PUBLIC_ADSENSE_CLIENT_ID to .env.local')
    }
    return null
  }

  return (
    <>
      {/* Load AdSense script only when ad should be shown */}
      <Script
        id="adsbygoogle-init"
        strategy="lazyOnload"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
        crossOrigin="anonymous"
        onLoad={handleScriptLoad}
        onError={(e) => {
          console.error('[DiscreteAd] Script load error:', e)
        }}
      />
      
      <div className="w-full flex justify-center my-6">
        <div 
          ref={adRef}
          className="inline-block rounded-lg overflow-hidden relative"
          style={{ 
            minWidth: '320px',
            maxWidth: '728px',
            width: '100%',
            minHeight: '90px'
          }}
        >
          {/* Visible border for debugging - shows container is there */}
          <div className="absolute inset-0 border-2 border-dashed border-white/20 rounded-lg pointer-events-none" 
               style={{ 
                 display: process.env.NODE_ENV === 'development' ? 'block' : 'none' 
               }}
          />
          
          <ins
            className="adsbygoogle"
            style={{
              display: 'block',
              width: '100%',
              minHeight: '90px',
              backgroundColor: 'transparent'
            }}
            data-ad-client={adClient}
            data-ad-slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID || ''}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
          
          {/* Fallback placeholder for development/localhost (AdSense won't show ads on localhost) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/5 rounded-lg pointer-events-none">
              <div className="text-center text-white/40 text-xs px-4">
                <div className="mb-1">Ad Space</div>
                <div className="text-[10px]">(Ads won't show on localhost)</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

