'use client'

import React, { useState } from 'react'
import { getCalendarFloatingRange } from '@/lib/dateUtils'

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

  // Use floating local times derived from the raw datetime-local string
  const formatDateForCalendar = (dateString?: string | null) => {
    const range = getCalendarFloatingRange(dateString, 120); // 2 hours
    if (!range) return null;
    return {
      start: range.start,
      end: range.end,
    };
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

  // Create an object URL for ICS and attempt to open with default calendar
  const openICSDefault = () => {
    const icsContent = generateICS()
    if (!icsContent) return null

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    // Try to open in a new tab first (mobile often prompts calendar app)
    const w = window.open(url, '_blank')
    if (!w) {
      // Fallback to programmatic click
      const a = document.createElement('a')
      a.href = url
      a.download = `${eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }

    // Revoke later to allow browser to resolve the URL
    setTimeout(() => URL.revokeObjectURL(url), 4000)
    return url
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
    
    // Format dates for calendar URLs - preserving original time
    const formatCalendarDate = (date: Date) => {
      if (isNaN(date.getTime())) {
        console.error('Invalid date passed to formatCalendarDate:', date)
        return ''
      }
      
      // Create a UTC date that preserves the original time values
      // This ensures the time displayed is exactly what was entered
      const utcDate = new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
      ))
      
      console.log('Calendar URL date input:', date);
      console.log('Calendar URL UTC date:', utcDate);
      
      return utcDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
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
      // Create a UTC date that preserves the original time values
      const utcDate = new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
      ))
      
      return utcDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
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
      // Create a UTC date that preserves the original time values
      const utcDate = new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
      ))
      
      console.log('Google Calendar date input:', date);
      console.log('Google Calendar UTC date:', utcDate);
      
      return utcDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
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

    // First, try ICS which lets OS choose default calendar
    const icsUrl = openICSDefault()
    if (icsUrl) return

    // Fallback to URL-based handlers
    const calendarUrl = getCalendarUrl()
    if (!calendarUrl || calendarUrl === '#') return
    window.open(calendarUrl, '_blank')
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 01-2-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Add to Calendar
          </button>
        </div>
      )}
    </div>
  )
}
