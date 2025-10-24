'use client'

import { useState } from 'react'

interface PdfDownloaderProps {
  pdfUrl: string | null
  fileName?: string
}

export default function PdfDownloader({ pdfUrl, fileName = 'event-information.pdf' }: PdfDownloaderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  if (!pdfUrl) {
    return null
  }

  const handleDownload = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      // Fetch the PDF file
      const response = await fetch(pdfUrl)
      
      if (!response.ok) {
        throw new Error('Failed to download the PDF')
      }
      
      // Convert to blob
      const blob = await response.blob()
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err: any) {
      setError(err.message || 'Download failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <button
          onClick={handleDownload}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {isLoading ? 'Downloading...' : 'Download Information PDF'}
        </button>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 text-sm rounded-lg bg-white/10 text-white/80 hover:bg-white/15 transition-all"
        >
          View PDF
        </a>
      </div>
      
      {error && (
        <div className="text-red-400 text-sm mt-2">{error}</div>
      )}
    </div>
  )
}
