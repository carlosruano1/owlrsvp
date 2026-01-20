'use client'

import React, { useState, useRef, useEffect } from 'react'

interface ChartDownloadMenuProps {
  chartRef: React.RefObject<any>
  chartTitle: string
  exportData: () => { csv: string; json: string }
  className?: string
}

const ChartDownloadMenu: React.FC<ChartDownloadMenuProps> = ({
  chartRef,
  chartTitle,
  exportData,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const downloadImage = () => {
    if (!chartRef.current) return

    try {
      // react-chartjs-2 ref gives us the chart instance
      const chart = chartRef.current
      
      // Get canvas - react-chartjs-2 exposes it directly
      const canvas = chart.canvas
      
      if (!canvas) {
        console.error('Could not find canvas element')
        return
      }
      
      // Create a download link
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `${chartTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_chart.png`
      link.href = url
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to download chart image:', error)
    }
  }

  const downloadCSV = () => {
    try {
      const { csv } = exportData()
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.download = `${chartTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_data.csv`
      link.href = URL.createObjectURL(blob)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
      
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to download CSV:', error)
    }
  }

  const downloadJSON = () => {
    try {
      const { json } = exportData()
      const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
      const link = document.createElement('a')
      link.download = `${chartTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_data.json`
      link.href = URL.createObjectURL(blob)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
      
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to download JSON:', error)
    }
  }

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg text-white transition-all"
        aria-label="Download options"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <svg 
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-white/20 rounded-lg shadow-xl z-50 overflow-hidden">
          <button
            onClick={downloadImage}
            className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Download Image (PNG)</span>
          </button>
          <button
            onClick={downloadCSV}
            className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3 border-t border-white/10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Download Data (CSV)</span>
          </button>
          <button
            onClick={downloadJSON}
            className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3 border-t border-white/10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>Download Data (JSON)</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default ChartDownloadMenu
