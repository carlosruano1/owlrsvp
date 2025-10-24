'use client'

import { useState, useRef } from 'react'

interface PdfUploaderProps {
  onUploadComplete?: (url: string) => void
  eventId?: string
}

export default function PdfUploader({ onUploadComplete, eventId }: PdfUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    const file = e.target.files?.[0]
    
    if (!file) {
      setError('No file selected')
      return
    }

    // Check if it's a PDF
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed')
      return
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setError('File too large (max 5MB)')
      return
    }

    setIsUploading(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      // Add event ID if available
      if (eventId) {
        formData.append('eventId', eventId)
      }

      const response = await fetch('/api/uploads/pdf', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await response.json()
      setSuccess('PDF uploaded successfully!')
      
      if (onUploadComplete) {
        onUploadComplete(data.url)
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <label className="block text-white/80 mb-2 text-sm">Upload Information PDF</label>
        <div className="flex items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleUpload}
            disabled={isUploading}
            className="hidden"
            id="pdf-upload"
          />
          <label
            htmlFor="pdf-upload"
            className={`px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-white cursor-pointer hover:bg-white/10 transition-all ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isUploading ? 'Uploading...' : 'Select PDF File'}
          </label>
          {fileInputRef.current?.files?.[0]?.name && (
            <span className="ml-3 text-sm text-white/70">
              {fileInputRef.current.files[0].name}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="text-red-400 text-sm mt-2">{error}</div>
      )}
      
      {success && (
        <div className="text-green-400 text-sm mt-2">{success}</div>
      )}
    </div>
  )
}
