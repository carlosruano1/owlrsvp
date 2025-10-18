'use client'

import React, { useState } from 'react'

interface CalendarIntegrationProps {
  eventTitle: string
  eventDate?: string
  eventLocation?: string
  eventDescription?: string
  className?: string
}

export default function CalendarIntegration({
  eventTitle,
  eventDate,
  eventLocation,
  eventDescription,
  className = ''
}: CalendarIntegrationProps) {
  const [showCalendarOptions, setShowCalendarOptions] = useState(false)

  // Format date for calendar
  const formatDateForCalendar = (dateString?: string | null) => {
    if (!dateString) {
      console.log('No date string provided')
      return null
    }
    
    try {
      console.log('Original date string:', dateString, 'Type:', typeof dateString)
      
      // Try different date parsing approaches
      let date: Date
      
      // First try direct parsing
      date = new Date(dateString)
      
      // If that fails, try parsing as ISO string
      if (isNaN(date.getTime())) {
        console.log('Direct parsing failed, trying ISO format')
        date = new Date(dateString + 'T00:00:00.000Z')
      }
      
      // If still fails, try with current time
      if (isNaN(date.getTime())) {
        console.log('ISO parsing failed, using current time')
        date = new Date()
      }
      
      console.log('Final parsed date:', date, 'Valid:', !isNaN(date.getTime()))
      
      const startFormatted = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      const endDate = new Date(date.getTime() + 2 * 60 * 60 * 1000) // 2 hours duration
      const endFormatted = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      
      console.log('Formatted start:', startFormatted)
      console.log('Formatted end:', endFormatted)
      
      return {
        start: startFormatted,
        end: endFormatted
      }
    } catch (error) {
      console.error('Error formatting date:', error, 'Input:', dateString)
      return null
    }
  }

  const calendarData = formatDateForCalendar(eventDate)

  // Generate .ics file content
  const generateICS = () => {
    if (!calendarData) return ''

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//OwlRSVP//Event Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@owlrsvp.com`,
      `DTSTART:${calendarData.start}`,
      `DTEND:${calendarData.end}`,
      `SUMMARY:${eventTitle}`,
      eventLocation ? `LOCATION:${eventLocation}` : '',
      eventDescription ? `DESCRIPTION:${eventDescription}` : '',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(line => line !== '').join('\r\n')

    return icsContent
  }

  // Download .ics file
  const downloadICS = () => {
    const icsContent = generateICS()
    if (!icsContent) return

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Generate calendar URL that opens calendar app directly
  const getCalendarUrl = () => {
    if (!calendarData) {
      console.log('No calendar data available, using fallback')
      // Try to open Outlook first, fallback to Google Calendar
      return getOutlookCalendarUrl() || getGoogleCalendarUrl()
    }

    console.log('Calendar data:', calendarData)
    
    const startDate = new Date(calendarData.start)
    const endDate = new Date(calendarData.end)
    
    console.log('Start date:', startDate, 'Valid:', !isNaN(startDate.getTime()))
    console.log('End date:', endDate, 'Valid:', !isNaN(endDate.getTime()))
    
    // Check if dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error('Invalid dates detected:', calendarData.start, calendarData.end)
      // Try to open Outlook first, fallback to Google Calendar
      return getOutlookCalendarUrl() || getGoogleCalendarUrl()
    }
    
    // Format dates for calendar URLs
    const formatCalendarDate = (date: Date) => {
      if (isNaN(date.getTime())) {
        console.error('Invalid date passed to formatCalendarDate:', date)
        return ''
      }
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    // Detect device type
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)

    if (isIOS) {
      // iOS: Use webcal: protocol for Apple Calendar
      const params = new URLSearchParams({
        title: eventTitle,
        startdt: formatCalendarDate(startDate),
        enddt: formatCalendarDate(endDate),
        notes: eventDescription || '',
        location: eventLocation || ''
      })
      return `webcal://p01-calendarws.icloud.com/ca/subscribe/1/${params.toString()}`
    } else if (isAndroid) {
      // Android: Use Google Calendar
      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: eventTitle,
        dates: `${formatCalendarDate(startDate)}/${formatCalendarDate(endDate)}`,
        details: eventDescription || '',
        location: eventLocation || ''
      })
      return `https://calendar.google.com/calendar/render?${params.toString()}`
    } else {
      // Desktop: Try Outlook first, then Google Calendar
      return getOutlookCalendarUrl() || getGoogleCalendarUrl()
    }
  }

  // Generate Outlook Calendar URL
  const getOutlookCalendarUrl = () => {
    if (!calendarData) {
      // Fallback without dates
      const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        subject: eventTitle,
        body: eventDescription || '',
        location: eventLocation || ''
      })
      return `outlook:${params.toString()}`
    }

    const startDate = new Date(calendarData.start)
    const endDate = new Date(calendarData.end)
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return null
    }

    const formatCalendarDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: eventTitle,
      startdt: formatCalendarDate(startDate),
      enddt: formatCalendarDate(endDate),
      body: eventDescription || '',
      location: eventLocation || ''
    })
    return `outlook:${params.toString()}`
  }

  // Generate Google Calendar URL
  const getGoogleCalendarUrl = () => {
    if (!calendarData) {
      // Fallback without dates
      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: eventTitle,
        details: eventDescription || '',
        location: eventLocation || ''
      })
      return `https://calendar.google.com/calendar/render?${params.toString()}`
    }

    const startDate = new Date(calendarData.start)
    const endDate = new Date(calendarData.end)
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return null
    }

    const formatCalendarDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: eventTitle,
      dates: `${formatCalendarDate(startDate)}/${formatCalendarDate(endDate)}`,
      details: eventDescription || '',
      location: eventLocation || ''
    })
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  // Handle calendar link clicks
  const handleCalendarClick = (e: React.MouseEvent) => {
    e.preventDefault()
    
    const calendarUrl = getCalendarUrl()
    console.log('Calendar URL:', calendarUrl)
    
    // Don't try to open if URL is invalid
    if (!calendarUrl || calendarUrl === '#') {
      console.error('Invalid calendar URL, cannot open calendar')
      return
    }
    
    // Try to open calendar app directly
    try {
      // Create a temporary link and click it
      const link = document.createElement('a')
      link.href = calendarUrl
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Failed to open calendar:', error)
      // Fallback: try window.open instead of window.location
      window.open(calendarUrl, '_blank')
    }
  }

  if (!eventDate) {
    return null // Don't show calendar options if no event date
  }

  return (
    <div className={`calendar-integration ${className}`}>
      <button
        onClick={() => setShowCalendarOptions(!showCalendarOptions)}
        className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all text-white text-sm font-medium flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Add to Calendar
      </button>

      {showCalendarOptions && (
        <div className="mt-3 space-y-2 animate-fadeIn">
          {/* Add to Calendar via Email */}
          <button
            onClick={handleCalendarClick}
            className="w-full px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-all text-blue-300 text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Add to Calendar
          </button>

          {/* Download .ics File */}
          <button
            onClick={downloadICS}
            className="w-full px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg transition-all text-purple-300 text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download .ics File
          </button>
        </div>
      )}
    </div>
  )
}
