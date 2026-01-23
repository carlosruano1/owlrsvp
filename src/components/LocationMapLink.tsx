'use client'

import { useState, useEffect } from 'react'

interface LocationMapLinkProps {
  location: string
  locationLink?: string
  className?: string
}

export default function LocationMapLink({ location, locationLink, className = '' }: LocationMapLinkProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [showMapOptions, setShowMapOptions] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                            (window.innerWidth <= 768 && 'ontouchstart' in window)
      setIsMobile(isMobileDevice)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const openGoogleMaps = () => {
    const mapQuery = locationLink || location
    const encodedLocation = encodeURIComponent(mapQuery)
    // Universal URL that works on all platforms and opens native app when available
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank')
    setShowMapOptions(false)
  }

  const openAppleMaps = () => {
    const mapQuery = locationLink || location
    const encodedLocation = encodeURIComponent(mapQuery)
    // maps.apple.com automatically opens native app on iOS, web on other platforms
    window.open(`https://maps.apple.com/?q=${encodedLocation}`, '_blank')
    setShowMapOptions(false)
  }

  const openWaze = () => {
    const mapQuery = locationLink || location
    const encodedLocation = encodeURIComponent(mapQuery)
    // Universal URL - mobile browsers will prompt to open native app if installed
    window.open(`https://waze.com/ul?q=${encodedLocation}`, '_blank')
    setShowMapOptions(false)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isMobile) {
      setShowMapOptions(true)
    } else {
      openGoogleMaps()
    }
  }

  return (
    <>
      <div 
        className={`cursor-pointer hover:opacity-80 transition-opacity ${className}`}
        onClick={handleClick}
      >
        <div className="flex items-center justify-center">
          <svg className="w-5 h-5 mr-2 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="underline decoration-dotted">{location}</span>
        </div>
      </div>

      {showMapOptions && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowMapOptions(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Open in Maps</h3>
            <div className="space-y-3">
              <button
                onClick={openGoogleMaps}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#4285F4">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
                <span className="font-medium text-gray-900">Google Maps</span>
              </button>
              
              <button
                onClick={openAppleMaps}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#000000">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
                <span className="font-medium text-gray-900">Apple Maps</span>
              </button>
              
              <button
                onClick={openWaze}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#33CCFF">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
                <span className="font-medium text-gray-900">Waze</span>
              </button>
            </div>
            <button
              onClick={() => setShowMapOptions(false)}
              className="mt-4 w-full py-3 text-gray-600 hover:text-gray-900 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}
