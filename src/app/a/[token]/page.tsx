'use client'

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'next/navigation'
import { Event, Attendee } from '@/lib/types'
import * as XLSX from 'xlsx'
import QRCode from 'qrcode'
import Footer from '@/components/Footer'
import Image from 'next/image'
import Link from 'next/link'
import { ThemeProvider, useTheme } from '@/components/ThemeProvider'
import ThemeColorPicker from '@/components/ThemeColorPicker'
import PdfUploader from '@/components/PdfUploader'

interface AdminData {
  event: Event
  attendees: Attendee[]
  stats: {
    totalAttending: number
    totalNotAttending: number
    totalResponses: number
  }
}

export default function AdminDashboard() {
  return (
    <ThemeProvider>
      <AdminDashboardContent />
    </ThemeProvider>
  );
}

function AdminDashboardContent() {
  const params = useParams()
  const adminToken = params.token as string

  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)
  const [copyQrSuccess, setCopyQrSuccess] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Attendee>>({})
  const [saving, setSaving] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [expandedAttendee, setExpandedAttendee] = useState<string | null>(null)
  const [contextMenuPos, setContextMenuPos] = useState<{x:number;y:number} | null>(null)
  const [contextAnchor, setContextAnchor] = useState<{left:number; right:number; bottom:number; top?: number} | null>(null)
  const [contactInfoExpanded, setContactInfoExpanded] = useState(false)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  // Theme from DB -> app theme
  const { colors, setColors, saveTheme } = useTheme()
  
  // Event details editing
  const [showEventDetailsForm, setShowEventDetailsForm] = useState(false)
  const [eventDetailsForm, setEventDetailsForm] = useState<{
    title: string;
    event_date: string;
    event_location: string;
    company_name: string;
    company_logo_url: string;
  }>({
    title: '',
    event_date: '',
    event_location: '',
    company_name: '',
    company_logo_url: ''
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [dragActive, setDragActive] = useState(false)
  const [contactPhone, setContactPhone] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [userTier, setUserTier] = useState<string>('free')
  const [canUseBranding, setCanUseBranding] = useState(false)
  const [canAccessAnalytics, setCanAccessAnalytics] = useState(false)
  const [showColorSettings, setShowColorSettings] = useState(false)
  const [showDetailedStats, setShowDetailedStats] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [rsvpMenuOpen, setRsvpMenuOpen] = useState(false)
  const rsvpMenuRef = useRef<HTMLDivElement>(null)
  const [attendeesExpanded, setAttendeesExpanded] = useState(false)
  const [requiredFields, setRequiredFields] = useState<{
    email?: boolean
    phone?: boolean
    address?: boolean
    guests?: boolean
  }>({})
  const [searchQuery, setSearchQuery] = useState('')

  const guestLink = data ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/e/${data.event.id}` : ''

  // Handle clicks outside the menu to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setExpandedAttendee(null);
        setContextMenuPos(null)
      }
      if (rsvpMenuRef.current && !rsvpMenuRef.current.contains(event.target as Node)) {
        setRsvpMenuOpen(false)
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  // After the context menu renders, measure and clamp within viewport
  useLayoutEffect(() => {
    if (!expandedAttendee || !menuRef.current || !contextAnchor) return
    const menuBounds = menuRef.current.getBoundingClientRect()
    const margin = 8
    // Align menu right edge to button right edge, below the button
    let x = contextAnchor.right - menuBounds.width
    let y = contextAnchor.bottom + margin
    if (x + menuBounds.width > window.innerWidth - margin) {
      x = Math.max(margin, window.innerWidth - menuBounds.width - margin)
    }
    if (y + menuBounds.height > window.innerHeight - margin) {
      y = Math.max(margin, window.innerHeight - menuBounds.height - margin)
    }
    if (x < margin) x = margin
    if (y < margin) y = margin
    if (!contextMenuPos || x !== contextMenuPos.x || y !== contextMenuPos.y) {
      setContextMenuPos({ x, y })
    }
  }, [expandedAttendee, contextAnchor])

  // Check if user is logged in as admin and get tier
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setIsAdmin(true)
          const tier = data.user?.subscription_tier || 'free'
          setUserTier(tier)
          // Check feature access based on tier
          setCanUseBranding(tier !== 'free')
          setCanAccessAnalytics(tier === 'pro' || tier === 'enterprise')
        }
      } catch (err) {
        // Not logged in - default to free tier
        setUserTier('free')
        setCanUseBranding(false)
        setCanAccessAnalytics(false)
      }
    }
    checkAdmin()
  }, [])

  useEffect(() => {
    if (adminToken) {
      validateAndFetchData()
    }
  }, [adminToken])

  // First validate the admin token before fetching data
  const validateAndFetchData = async () => {
    try {
      console.log('Validating admin token:', adminToken);
      // Skip validation and directly fetch data
      // This allows access to the admin page even for users who created events without login
      await fetchData()
    } catch (err) {
      console.error('Error validating admin token:', err)
      setError(`Failed to validate admin access: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setLoading(false)
    }
  }

  const copyGuestLink = async () => {
    try {
      await navigator.clipboard.writeText(guestLink)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const copyQrToClipboard = async () => {
    try {
      if (!qrCodeUrl) return
      
      // Helper function to convert image URL to blob via canvas
      // This ensures proper image format and handles both data URLs and regular URLs
      const imageUrlToBlob = async (url: string): Promise<Blob> => {
        return new Promise<Blob>((resolve, reject) => {
          const img = new Image()
          
          // Handle CORS for external images
          if (!url.startsWith('data:')) {
            img.crossOrigin = 'anonymous'
          }
          
          img.onload = () => {
            try {
              // Create canvas and draw image
              const canvas = document.createElement('canvas')
              canvas.width = img.width
              canvas.height = img.height
              const ctx = canvas.getContext('2d')
              
              if (!ctx) {
                reject(new Error('Could not get canvas context'))
                return
              }
              
              ctx.drawImage(img, 0, 0)
              
              // Convert canvas to blob with explicit PNG type
              canvas.toBlob((blob) => {
                if (blob) {
                  resolve(blob)
                } else {
                  reject(new Error('Failed to create blob from canvas'))
                }
              }, 'image/png')
            } catch (error) {
              reject(error)
            }
          }
          
          img.onerror = () => {
            reject(new Error('Failed to load image'))
          }
          
          img.src = url
        })
      }
      
      // Method 1: Use ClipboardItem API (works on iOS 13.4+ and modern browsers)
      try {
        const blob = await imageUrlToBlob(qrCodeUrl)
        
        // Check if ClipboardItem is available (iOS 13.4+ supports this)
        // @ts-ignore: ClipboardItem may not be in TypeScript types
        if (typeof ClipboardItem !== 'undefined') {
          // @ts-ignore: ClipboardItem is available in browsers
          const clipboardItem = new ClipboardItem({ 
            'image/png': blob 
          })
          
          // Ensure clipboard.write is available
          if (navigator.clipboard && navigator.clipboard.write) {
            await navigator.clipboard.write([clipboardItem])
            setCopyQrSuccess(true)
            setTimeout(() => setCopyQrSuccess(false), 2000)
            return
          }
        }
      } catch (clipboardError) {
        // ClipboardItem API failed, try alternative method
        console.log('ClipboardItem API failed, trying alternative:', clipboardError)
      }
      
      // Method 2: Alternative approach - fetch and use blob directly
      // Sometimes this works better on iOS
      try {
        let blob: Blob
        
        if (qrCodeUrl.startsWith('data:')) {
          // For data URLs, convert via canvas (already handled above, but try direct fetch)
          const response = await fetch(qrCodeUrl)
          blob = await response.blob()
        } else {
          // For regular URLs, fetch directly
          const response = await fetch(qrCodeUrl)
          if (!response.ok) throw new Error('Failed to fetch image')
          blob = await response.blob()
        }
        
        // Ensure it's a PNG blob
        if (!blob.type || !blob.type.startsWith('image/')) {
          // Convert to proper image blob via canvas
          blob = await imageUrlToBlob(qrCodeUrl)
        }
        
        // Try ClipboardItem again with the fetched blob
        // @ts-ignore: ClipboardItem may not be in TypeScript types
        if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
          // @ts-ignore: ClipboardItem is available in browsers
          const clipboardItem = new ClipboardItem({ 
            'image/png': blob 
          })
          await navigator.clipboard.write([clipboardItem])
          setCopyQrSuccess(true)
          setTimeout(() => setCopyQrSuccess(false), 2000)
          return
        }
      } catch (altError) {
        console.log('Alternative method failed:', altError)
      }
      
      // If all methods fail, show helpful message
      alert('Copy failed on this device. Please use the download button instead.')
      console.error('All copy methods failed')
    } catch (err) {
      console.error('Failed to copy QR:', err)
      alert('Copy failed. You can download instead.')
    }
  }

  const downloadQr = () => {
    if (!qrCodeUrl) return
    const a = document.createElement('a')
    a.href = qrCodeUrl
    a.download = 'owlrsvp-qr.png'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  // Social sharing functions
  const shareText = `Join me at ${data?.event.title || 'this event'}! RSVP here: ${guestLink}`
  
  const shareOnLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(guestLink)}`
    window.open(url, '_blank', 'width=600,height=400')
  }

  const shareOnTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(guestLink)}`
    window.open(url, '_blank', 'width=600,height=400')
  }

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(guestLink)}`
    window.open(url, '_blank', 'width=600,height=400')
  }

  const shareOnWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`
    window.open(url, '_blank')
  }

  const shareOnInstagram = () => {
    // Instagram doesn't support direct URL sharing, so we copy the link and show instructions
    navigator.clipboard.writeText(guestLink).then(() => {
      alert('Link copied! Open Instagram Stories, add the QR code image, and paste the link in your story.')
    }).catch(() => {
      alert('Please copy the link manually and share it on Instagram Stories with the QR code image.')
    })
  }

  const downloadCSV = () => {
    window.open(`/api/admin/${adminToken}/csv`, '_blank')
  }

  const downloadTemplate = () => {
    const wsData = [[
      'first_name','last_name','email','phone','address','attending'
    ]]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, 'owlrsvp_guest_template.xlsx')
  }

  const importXlsx = async (file: File) => {
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf)
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows: Record<string, string | number>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })
    // Normalize and import
    for (const row of rows) {
      const payload: Partial<Attendee> = {
        first_name: String(row.first_name || row.First || row['First Name'] || '').trim(),
        last_name: String(row.last_name || row.Last || row['Last Name'] || '').trim(),
        email: String(row.email || row.Email || '').trim() || undefined,
        phone: String(row.phone || row.Phone || '').trim() || undefined,
        address: String(row.address || row.Address || '').trim() || undefined,
        attending: String(row.attending || row.Attending || '').toLowerCase().startsWith('y') ? true : false,
        guest_count: 0
      }
      if (!payload.first_name || !payload.last_name) continue
      const res = await fetch(`/api/admin/${adminToken}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) {
        const json = await res.json()
        setData(d => d ? ({ ...d, attendees: [json.attendee, ...d.attendees] }) : d)
      }
    }
    alert('Import complete')
  }

  const startEdit = (attendee: Attendee) => {
    setEditing(attendee.id)
    setEditForm({ ...attendee })
  }

  const cancelEdit = () => {
    setEditing(null)
    setEditForm({})
  }

  const updateEditForm = (field: string, value: string | number | boolean) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  const saveAttendee = async () => {
    if (!editForm.id) return
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/${adminToken}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update attendee')
      }
      
      // Update local data
      setData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          attendees: prev.attendees.map(a => 
            a.id === editForm.id ? result.attendee : a
          )
        }
      })
      
      setEditing(null)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update attendee')
    } finally {
      setSaving(false)
    }
  }

  const deleteAttendee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attendee?')) return
    
    try {
      const response = await fetch(`/api/admin/${adminToken}?id=${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete attendee')
      }
      
      // Update local data
      setData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          attendees: prev.attendees.filter(a => a.id !== id)
        }
      })
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete attendee')
    }
  }
  
  const updateEventSettings = async (settings: Partial<Event>) => {
    setSettingsSaving(true)
    try {
      console.log('Updating event settings:', settings)
      
      // First check if the event exists
      const checkResponse = await fetch(`/api/admin/${adminToken}/event`)
      const checkResult = await checkResponse.json()
      
      if (!checkResponse.ok) {
        console.error('Error checking event:', checkResult)
        throw new Error(checkResult.error || 'Failed to check event')
      }
      
      console.log('Current event data:', checkResult)
      
      // Now update the event
      const response = await fetch(`/api/admin/${adminToken}/event`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      const result = await response.json()
      console.log('Update response:', response.status, result)
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update event settings')
      }
      
      // Update local data
      setData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          event: { ...prev.event, ...result.event }
        }
      })
      
      // Clear form fields after successful update
      if (settings.promo_code !== undefined) setPromoCode('')
      if (settings.contact_name !== undefined) setContactName('')
      if (settings.contact_email !== undefined) setContactEmail('')
      if (settings.contact_phone !== undefined) setContactPhone('')
      
      // Force refresh data
      setTimeout(() => {
        fetchData()
      }, 500)
    } catch (error) {
      console.error('Error updating settings:', error)
      alert(error instanceof Error ? error.message : 'Failed to update event settings')
    } finally {
      setSettingsSaving(false)
    }
  }
  
  // Helper function to format date for datetime-local input (show UTC time)
  const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    
    console.log('formatDateForInput received:', dateString);
    
    // If it's already in the correct format (YYYY-MM-DDTHH:MM), return as is
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateString)) {
      console.log('Already in correct format, returning:', dateString);
      return dateString;
    }
    
    // If it's in ISO format with timezone (YYYY-MM-DDTHH:MM:SS+00:00), extract UTC time
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateString)) {
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        // Format as YYYY-MM-DDTHH:MM using UTC time
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        
        const result = `${year}-${month}-${day}T${hours}:${minutes}`;
        console.log('Formatted UTC date for input:', result);
        return result;
      } catch (error) {
        console.error('Error formatting UTC date:', error);
        return '';
      }
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // Format as YYYY-MM-DDTHH:MM for datetime-local input (local time)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      const result = `${year}-${month}-${day}T${hours}:${minutes}`;
      console.log('Formatted date:', result);
      return result;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Helper function to convert datetime-local input to database format (no timezone conversion)
  const formatDateForDatabase = (dateTimeLocalString: string): string => {
    if (!dateTimeLocalString) return '';
    
    // Just return the datetime-local string as-is (YYYY-MM-DDTHH:MM)
    // This represents local time without timezone info
    console.log('Saving date as local time:', dateTimeLocalString);
    return dateTimeLocalString;
  };

  // Helper function to format date for display (show UTC time as-is)
  const formatDateForDisplay = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Not set';
    
    console.log('Displaying date:', dateString);
    
    // If it's in ISO format with timezone (YYYY-MM-DDTHH:MM:SS+00:00), show UTC time
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateString)) {
      try {
        const date = new Date(dateString);
        // Format as MM/DD/YYYY HH:MM AM/PM in UTC
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = date.getUTCHours();
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        
        // Convert to 12-hour format
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        
        return `${month}/${day}/${year} ${displayHours}:${minutes}${ampm}`;
      } catch (error) {
        return 'Invalid date';
      }
    }
    
    // For any other format, just show as-is
    return dateString;
  };

  // Function to fetch admin data
  const fetchData = async () => {
    try {
      console.log('Fetching data for admin token:', adminToken);
      const response = await fetch(`/api/admin/${adminToken}`)
      const result = await response.json()

      console.log('API response status:', response.status);
      console.log('API response data:', result);

      if (!response.ok) {
        console.error('API error:', result);
        throw new Error(result.error || 'Invalid admin token')
      }

      setData(result)
      
      // Generate QR code
      if (result.event) {
        const url = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/e/${result.event.id}`
        const qrCode = await QRCode.toDataURL(url, { margin: 1 })
        setQrCodeUrl(qrCode)
        
        // Initialize event details form with current data
        setEventDetailsForm({
          title: result.event.title || '',
          event_date: formatDateForInput(result.event.event_date),
          event_location: result.event.event_location || '',
          company_name: result.event.company_name || '',
          company_logo_url: result.event.company_logo_url || ''
        })

        // Apply DB theme colors to ThemeProvider
        try {
          setColors({
            bg: result.event.page_background_color || '#000000',
            text: result.event.font_color || '#FFFFFF',
            primary: result.event.background_color || '#007AFF',
            secondary: result.event.spotlight_color || result.event.background_color || '#007AFF'
          })
        } catch (e) {
          // ignore theme errors
        }

        // Initialize required RSVP fields
        if (result.event.required_rsvp_fields) {
          setRequiredFields(result.event.required_rsvp_fields)
        } else {
          setRequiredFields({})
        }
      }
      
      setError('')
    } catch (err) {
      console.error('Error fetching admin data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const toggleAttendance = async (attendee: Attendee) => {
    try {
      // Create a payload that preserves all existing attendee data
      const payload = {
        id: attendee.id,
        attending: !attendee.attending,
        first_name: attendee.first_name,
        last_name: attendee.last_name,
        email: attendee.email,
        phone: attendee.phone,
        address: attendee.address,
        guest_count: attendee.guest_count || 0
      };
      
      console.log('Toggling attendance with payload:', payload);
      
      const response = await fetch(`/api/admin/${adminToken}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update attendance')
      }
      
      // Update local data
      setData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          attendees: prev.attendees.map(a => 
            a.id === attendee.id ? result.attendee : a
          )
        }
      })
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update attendance')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="animated-bg" />
        <div className="spotlight" />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="text-white/80 text-xl">Loading admin dashboard...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="animated-bg" />
        <div className="spotlight" />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="text-red-400 text-xl mb-4">Access Denied</div>
            <div className="text-white/70 mb-4">{error}</div>
            <div className="text-white/50 text-sm mb-6">
              Admin Token: {adminToken}
            </div>
            <Link 
              href="/admin/settings" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Back to Settings
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="animated-bg" />
      <div className="spotlight" />
      <div className="relative z-10 min-h-screen p-4 sm:p-8 pb-24">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-8 text-white text-glow">
            <h1 className="text-4xl font-bold mb-2">{data?.event.title}</h1>
            <p className="text-white/80 text-lg">Admin Dashboard</p>
          </div>

          {/* Account Creation CTA for guest users */}
          {!isAdmin && (
            <div className="glass-card rounded-2xl p-6 sm:p-8 text-white mb-6 border-2 border-yellow-400/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2 text-yellow-300">Save Your Progress</h2>
                    <p className="text-white/80 mb-4">Create a free account to manage all your events in one place, access advanced features, and ensure you never lose your event settings.</p>
                    <ul className="list-disc list-inside text-white/70 space-y-1 mb-6 sm:mb-0">
                      <li>Manage multiple events from one dashboard</li>
                      <li>Access advanced customization options</li>
                      <li>Get email notifications for new RSVPs</li>
                      <li>Secure your event data with a password</li>
                    </ul>
                  </div>
                  <div className="flex flex-col gap-3 sm:min-w-[200px]">
                    <Link 
                      href="/admin/register" 
                      className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded-xl hover:bg-yellow-300 transition-all text-center shadow-lg shadow-yellow-400/20"
                    >
                      Create Free Account
                    </Link>
                    <Link 
                      href="/admin/login" 
                      className="px-6 py-3 bg-white/10 border border-white/20 text-white/90 rounded-xl hover:bg-white/20 transition-all text-center"
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Brand / Company */}
          <div className="brand-bar">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="logo-frame">
                  {data?.event.company_logo_url ? (
                    <img src={data.event.company_logo_url} alt={data?.event.company_name ? `${data.event.company_name} logo` : 'Company logo'} />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/20" />
                  )}
                </div>
                <div>
                  <div className="text-white font-semibold text-lg">
                    {data?.event.company_name || 'Your Company'}
                  </div>
                  <div className="text-white/60 text-sm">Admin Dashboard</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold">Attendance Overview</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowDetailedStats(!showDetailedStats)}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 text-white/90 transition-all flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {showDetailedStats ? 'Hide Detailed Stats' : 'Show Detailed Stats'}
                </button>
                {data?.event?.id && (
                  canAccessAnalytics ? (
                    <Link 
                      href={`/admin/events/${data.event.id}/analytics`}
                      className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 text-blue-300 transition-all flex items-center gap-2"
                      title="Open full analytics dashboard"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 13h4v8H3v-8zm7-6h4v14h-4V7zm7-4h4v18h-4V3z" fill="currentColor"/>
                      </svg>
                      Analytics
                    </Link>
                  ) : (
                    <div className="relative group">
                      <button
                        disabled
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white/40 cursor-not-allowed flex items-center gap-2 opacity-50"
                        title="Advanced analytics available on Pro and Enterprise plans"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 13h4v8H3v-8zm7-6h4v14h-4V7zm7-4h4v18h-4V3z" fill="currentColor"/>
                        </svg>
                        Analytics
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                        <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg border border-white/20 whitespace-nowrap">
                          <p className="mb-1">Advanced analytics requires Pro or Enterprise plan</p>
                          <Link 
                            href="/?upgrade=true&reason=analytics#pricing" 
                            className="text-blue-400 hover:text-blue-300 underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Upgrade now →
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 admin-grid">
              {/* Visual stats cards */}
              <div className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-5">
                <div className="absolute bottom-0 left-0 h-1.5 bg-green-400" style={{ width: `${data?.attendees?.filter(a => a.attending).length ? (data.attendees.filter(a => a.attending).length / (data.stats.totalResponses || 1) * 100) : 0}%` }} />
                <div className="flex flex-col h-full">
                  <div className="text-3xl font-bold text-green-400 mb-1">
                    {data?.attendees?.filter(a => a.attending).length || 0}
                  </div>
                  <div className="text-white/80 mb-2">Confirmed RSVPs</div>
                  <div className="text-xs text-white/50 mt-auto">
                    {data?.stats.totalResponses ? 
                      `${Math.round((data.attendees.filter(a => a.attending).length / data.stats.totalResponses) * 100)}% of responses` : 
                      'No responses yet'}
                  </div>
                </div>
              </div>
              
              <div className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-5">
                <div className="absolute bottom-0 left-0 h-1.5 bg-red-400" style={{ width: `${data?.stats.totalNotAttending ? (data.stats.totalNotAttending / (data.stats.totalResponses || 1) * 100) : 0}%` }} />
                <div className="flex flex-col h-full">
                  <div className="text-3xl font-bold text-red-400 mb-1">
                    {data?.stats.totalNotAttending || 0}
                  </div>
                  <div className="text-white/80 mb-2">Not Attending</div>
                  <div className="text-xs text-white/50 mt-auto">
                    {data?.stats.totalResponses ? 
                      `${Math.round(data.stats.totalNotAttending / data.stats.totalResponses * 100)}% of responses` : 
                      'No responses yet'}
                  </div>
                </div>
              </div>
              
              <div className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-5">
                {data?.event.auth_mode === 'guest_list' && data?.attendees.length > 0 && (
                  <div className="absolute bottom-0 left-0 h-1.5 bg-blue-400" style={{ width: `${data?.stats.totalResponses ? (data.stats.totalResponses / data.attendees.length * 100) : 0}%` }} />
                )}
                <div className="flex flex-col h-full">
                  <div className="text-3xl font-bold text-blue-400 mb-1">
                    {data?.stats.totalResponses || 0}
                  </div>
                  <div className="text-white/80 mb-2">Total Responses</div>
                  {data?.event.auth_mode === 'guest_list' && data?.attendees.length > 0 ? (
                    <div className="text-xs text-white/50 mt-auto">
                      {Math.round(data.stats.totalResponses / data.attendees.length * 100)}% of invited guests
                    </div>
                  ) : (
                    <div className="text-xs text-white/50 mt-auto">&nbsp;</div>
                  )}
                </div>
              </div>
              
              <div className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-5">
                <div className="absolute bottom-0 left-0 h-1.5 bg-purple-400" style={{ width: '100%' }} />
                <div className="flex flex-col h-full">
                  <div className="text-3xl font-bold text-purple-400 mb-1">
                    {data?.stats.totalAttending || 0}
                  </div>
                  <div className="text-white/80 mb-2">Total People Expected</div>
                  <div className="text-xs text-white/50 mt-auto">
                    {data?.attendees.filter(a => a.attending).some(a => a.guest_count > 0) ? 
                      `${data?.attendees.filter(a => a.attending).length || 0} primary RSVPs + ${data?.attendees.filter(a => a.attending).reduce((total, attendee) => total + (attendee.guest_count || 0), 0) || 0} guests` : 
                      `${data?.attendees.filter(a => a.attending).length || 0} RSVPs, no additional guests`
                    }
                  </div>
                </div>
              </div>
            </div>
            
            {/* Detailed Statistics Section */}
            {showDetailedStats && (
              <div className="mt-8 border-t border-white/10 pt-6">
                <h3 className="text-xl font-semibold mb-4">Detailed Guest Statistics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Guest Distribution Chart */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <h4 className="text-lg font-medium mb-3">Additional Guests Distribution</h4>
                    <p className="text-sm text-white/60 mb-3">Shows how many additional guests attendees are bringing</p>
                    
                    <div className="relative h-64">
                      {data?.attendees && data.attendees.filter(a => a.attending).length > 0 ? (
                        <div className="flex h-full items-end">
                          {/* Calculate the total number of attending RSVPs (not including guests) */}
                          {(() => {
                            const attendingCount = data.attendees.filter(a => a.attending).length;
                            
                            // No guests count
                            const noGuestsCount = data.attendees.filter(a => a.attending && (!a.guest_count || a.guest_count === 0)).length;
                            const noGuestsPercent = Math.max(10, (noGuestsCount / attendingCount) * 100);
                            
                            // 1 guest count
                            const oneGuestCount = data.attendees.filter(a => a.attending && a.guest_count === 1).length;
                            const oneGuestPercent = Math.max(10, (oneGuestCount / attendingCount) * 100);
                            
                            // 2 guests count
                            const twoGuestsCount = data.attendees.filter(a => a.attending && a.guest_count === 2).length;
                            const twoGuestsPercent = Math.max(10, (twoGuestsCount / attendingCount) * 100);
                            
                            // 3+ guests count
                            const threeOrMoreGuestsCount = data.attendees.filter(a => a.attending && a.guest_count && a.guest_count >= 3).length;
                            const threeOrMoreGuestsPercent = Math.max(10, (threeOrMoreGuestsCount / attendingCount) * 100);
                            
                            return (
                              <>
                                {/* No guests */}
                                <div className="flex-1 flex flex-col items-center">
                                  <div className="w-full px-1">
                                    <div 
                                      className="w-full bg-blue-400 rounded-t-md" 
                                      style={{ 
                                        height: `${noGuestsPercent}%` 
                                      }}
                                    ></div>
                                  </div>
                                  <div className="mt-2 text-xs text-center">
                                    <div className="font-medium">
                                      {noGuestsCount}
                                    </div>
                                    <div className="text-white/60">No guests</div>
                                  </div>
                                </div>
                                
                                {/* 1 guest */}
                                <div className="flex-1 flex flex-col items-center">
                                  <div className="w-full px-1">
                                    <div 
                                      className="w-full bg-green-400 rounded-t-md" 
                                      style={{ 
                                        height: `${oneGuestPercent}%` 
                                      }}
                                    ></div>
                                  </div>
                                  <div className="mt-2 text-xs text-center">
                                    <div className="font-medium">
                                      {oneGuestCount}
                                    </div>
                                    <div className="text-white/60">+1 guest</div>
                                  </div>
                                </div>
                                
                                {/* 2 guests */}
                                <div className="flex-1 flex flex-col items-center">
                                  <div className="w-full px-1">
                                    <div 
                                      className="w-full bg-yellow-400 rounded-t-md" 
                                      style={{ 
                                        height: `${twoGuestsPercent}%` 
                                      }}
                                    ></div>
                                  </div>
                                  <div className="mt-2 text-xs text-center">
                                    <div className="font-medium">
                                      {twoGuestsCount}
                                    </div>
                                    <div className="text-white/60">+2 guests</div>
                                  </div>
                                </div>
                                
                                {/* 3+ guests */}
                                <div className="flex-1 flex flex-col items-center">
                                  <div className="w-full px-1">
                                    <div 
                                      className="w-full bg-purple-400 rounded-t-md" 
                                      style={{ 
                                        height: `${threeOrMoreGuestsPercent}%` 
                                      }}
                                    ></div>
                                  </div>
                                  <div className="mt-2 text-xs text-center">
                                    <div className="font-medium">
                                      {threeOrMoreGuestsCount}
                                    </div>
                                    <div className="text-white/60">3+ guests</div>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center text-white/50">
                          No data available
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Guest Distribution */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <h4 className="text-lg font-medium mb-3">Guest Distribution</h4>
                    
                    <div className="space-y-4">
                      {(() => {
                        // Calculate the total number of attending RSVPs (not including guests)
                        const attendingCount = data?.attendees.filter(a => a.attending).length || 0;
                        
                        // No guests count
                        const noGuestsCount = data?.attendees.filter(a => a.attending && (!a.guest_count || a.guest_count === 0)).length || 0;
                        const noGuestsPercent = attendingCount > 0 ? Math.max(5, (noGuestsCount / attendingCount) * 100) : 0;
                        
                        // 1 guest count
                        const oneGuestCount = data?.attendees.filter(a => a.attending && a.guest_count === 1).length || 0;
                        const oneGuestPercent = attendingCount > 0 ? Math.max(5, (oneGuestCount / attendingCount) * 100) : 0;
                        
                        // 2+ guests count
                        const twoOrMoreGuestsCount = data?.attendees.filter(a => a.attending && a.guest_count && a.guest_count >= 2).length || 0;
                        const twoOrMoreGuestsPercent = attendingCount > 0 ? Math.max(5, (twoOrMoreGuestsCount / attendingCount) * 100) : 0;
                        
                        return (
                          <>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Attendees with no additional guests</span>
                                <span className="font-medium">
                                  {noGuestsCount}
                                </span>
                              </div>
                              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-400" 
                                  style={{ width: `${noGuestsPercent}%` }} 
                                />
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Attendees with 1 guest</span>
                                <span className="font-medium">
                                  {oneGuestCount}
                                </span>
                              </div>
                              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-green-400" 
                                  style={{ width: `${oneGuestPercent}%` }} 
                                />
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Attendees with 2+ guests</span>
                                <span className="font-medium">
                                  {twoOrMoreGuestsCount}
                                </span>
                              </div>
                              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-purple-400" 
                                  style={{ width: `${twoOrMoreGuestsPercent}%` }} 
                                />
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    
                    <div className="mt-4 text-sm text-white/60">
                      <p>Average guests per RSVP: {data?.stats.totalAttending ? 
                        (data.attendees.filter(a => a.attending).reduce((total, a) => total + (a.guest_count || 0), 0) / data.stats.totalAttending).toFixed(1) : 
                        '0.0'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Guest Summary */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <h4 className="text-lg font-medium mb-3">Guest Summary</h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Total RSVPs:</span>
                        <span className="font-medium">{data?.stats.totalResponses || 0}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Confirmed Attendees:</span>
                        <span className="font-medium text-green-400">{data?.stats.totalAttending || 0}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Not Attending:</span>
                        <span className="font-medium text-red-400">{data?.stats.totalNotAttending || 0}</span>
                      </div>
                      
                      <div className="border-t border-white/10 my-2 pt-2"></div>
                      
                      <div className="flex justify-between items-center">
                        <span>Additional Guests:</span>
                        <span className="font-medium text-blue-400">
                          {data?.attendees.filter(a => a.attending).reduce((total, attendee) => total + (attendee.guest_count || 0), 0) || 0}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Total People Expected:</span>
                        <span className="font-medium text-purple-400">
                          {data?.attendees.filter(a => a.attending).reduce((total, attendee) => total + (attendee.guest_count || 0) + 1, 0) || 0}
                        </span>
                      </div>
                      
                      <div className="border-t border-white/10 my-2 pt-2"></div>
                      
                      <div className="flex justify-between items-center">
                        <span>Most guests brought:</span>
                        <span className="font-medium">
                          {Math.max(0, ...data?.attendees.filter(a => a.attending).map(a => a.guest_count || 0) || [0])}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* QR Code - Prominent Section */}
          {qrCodeUrl && (
            <div className="glass-card rounded-2xl p-6 sm:p-8 text-white">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">QR Code</h2>
                  <p className="text-white/60">Share this QR code for instant RSVP access</p>
                </div>
              </div>
              
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
                {/* QR Code Image */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 shadow-lg shrink-0">
                  <Image 
                    src={qrCodeUrl} 
                    alt="Event QR Code" 
                    className="rounded-md"
                    width={200}
                    height={200}
                    unoptimized
                  />
                </div>
                
                {/* Actions Column - Full Width on Desktop */}
                <div className="flex flex-col gap-4 flex-1 w-full">
                  {/* Copy & Download Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={copyQrToClipboard} 
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border border-blue-400/30 rounded-xl text-white transition-all duration-200 flex items-center justify-center gap-2 font-medium backdrop-blur-sm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {copyQrSuccess ? 'Copied!' : 'Copy QR'}
                    </button>
                    <button 
                      onClick={downloadQr} 
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 border border-purple-400/30 rounded-xl text-white transition-all duration-200 flex items-center justify-center gap-2 font-medium backdrop-blur-sm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download
                    </button>
                  </div>

                  {/* Copy Link Section */}
                  <div className="pt-4 border-t border-white/10">
                    <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Share Event Link
                    </h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={guestLink}
                        readOnly
                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                      <button
                        onClick={copyGuestLink}
                        className="px-6 py-2 bg-gradient-to-r from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 border border-green-400/30 rounded-lg text-white transition-all duration-200 flex items-center justify-center gap-2 font-medium backdrop-blur-sm whitespace-nowrap"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {copySuccess ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>
                  </div>

                  {/* Social Sharing Section */}
                  <div className="pt-4 border-t border-white/10">
                    <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.885 12.938 9 12.482 9 12c0-.482-.115-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share on Social Media
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {/* LinkedIn */}
                      <button
                        onClick={shareOnLinkedIn}
                        className="group relative px-4 py-3 bg-gradient-to-br from-[#0077b5]/20 to-[#0077b5]/30 hover:from-[#0077b5]/30 hover:to-[#0077b5]/40 border border-[#0077b5]/40 rounded-xl transition-all duration-200 flex flex-col items-center gap-2 backdrop-blur-sm hover:scale-105 hover:shadow-lg hover:shadow-[#0077b5]/20"
                      >
                        <svg className="w-6 h-6 text-[#0077b5]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        <span className="text-xs font-medium text-white/90">LinkedIn</span>
                      </button>

                      {/* X (Twitter) */}
                      <button
                        onClick={shareOnTwitter}
                        className="group relative px-4 py-3 bg-gradient-to-br from-black/40 to-gray-900/40 hover:from-black/50 hover:to-gray-900/50 border border-white/20 rounded-xl transition-all duration-200 flex flex-col items-center gap-2 backdrop-blur-sm hover:scale-105 hover:shadow-lg hover:shadow-white/10"
                      >
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        <span className="text-xs font-medium text-white/90">X.com</span>
                      </button>

                      {/* Facebook */}
                      <button
                        onClick={shareOnFacebook}
                        className="group relative px-4 py-3 bg-gradient-to-br from-[#1877f2]/20 to-[#1877f2]/30 hover:from-[#1877f2]/30 hover:to-[#1877f2]/40 border border-[#1877f2]/40 rounded-xl transition-all duration-200 flex flex-col items-center gap-2 backdrop-blur-sm hover:scale-105 hover:shadow-lg hover:shadow-[#1877f2]/20"
                      >
                        <svg className="w-6 h-6 text-[#1877f2]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        <span className="text-xs font-medium text-white/90">Facebook</span>
                      </button>

                      {/* WhatsApp */}
                      <button
                        onClick={shareOnWhatsApp}
                        className="group relative px-4 py-3 bg-gradient-to-br from-[#25d366]/20 to-[#25d366]/30 hover:from-[#25d366]/30 hover:to-[#25d366]/40 border border-[#25d366]/40 rounded-xl transition-all duration-200 flex flex-col items-center gap-2 backdrop-blur-sm hover:scale-105 hover:shadow-lg hover:shadow-[#25d366]/20"
                      >
                        <svg className="w-6 h-6 text-[#25d366]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        <span className="text-xs font-medium text-white/90">WhatsApp</span>
                      </button>

                      {/* Instagram */}
                      <button
                        onClick={shareOnInstagram}
                        className="group relative px-4 py-3 bg-gradient-to-br from-[#E4405F]/20 via-[#F56040]/20 to-[#FCAF45]/20 hover:from-[#E4405F]/30 hover:via-[#F56040]/30 hover:to-[#FCAF45]/30 border border-[#E4405F]/40 rounded-xl transition-all duration-200 flex flex-col items-center gap-2 backdrop-blur-sm hover:scale-105 hover:shadow-lg hover:shadow-[#E4405F]/20"
                      >
                        <svg className="w-6 h-6 text-[#E4405F]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        <span className="text-xs font-medium text-white/90">Instagram</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Event Details */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold">Event Details</h2>
              <button 
                onClick={() => setShowEventDetailsForm(!showEventDetailsForm)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 text-white/90 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {showEventDetailsForm ? 'Cancel Edit' : 'Edit Details'}
              </button>
            </div>
            
            {/* Event Details Form */}
            {showEventDetailsForm && (
              <div className="mb-6 p-5 rounded-xl bg-black/30 border border-white/10 animate-fadeIn">
                <h3 className="text-lg font-medium mb-4">Edit Event Information</h3>
                
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setSettingsSaving(true);
                  
                  try {
                    // Handle logo upload if a file is selected
                    let finalLogoUrl = eventDetailsForm.company_logo_url;
                    if (logoFile) {
                      const formData = new FormData();
                      formData.append('file', logoFile);
                      const uploadRes = await fetch('/api/uploads/logo', { 
                        method: 'POST', 
                        body: formData,
                        signal: AbortSignal.timeout(15000) 
                      });
                      const uploadJson = await uploadRes.json();
                      if (uploadRes.ok) {
                        finalLogoUrl = uploadJson.url;
                      }
                    }
                    
                    // Update event details
                    console.log('Saving event date:', eventDetailsForm.event_date);
                    const updateData: any = {
                      title: eventDetailsForm.title,
                      event_date: eventDetailsForm.event_date ? formatDateForDatabase(eventDetailsForm.event_date) : undefined,
                      event_location: eventDetailsForm.event_location || undefined,
                    };
                    
                    // Only include branding fields if user has access
                    if (canUseBranding) {
                      updateData.company_name = eventDetailsForm.company_name || undefined;
                      updateData.company_logo_url = finalLogoUrl || undefined;
                    }
                    
                    await updateEventSettings(updateData);
                    
                    setShowEventDetailsForm(false);
                    setLogoFile(null);
                    setLogoPreview('');
                  } catch (error) {
                    console.error('Error updating event details:', error);
                  } finally {
                    setSettingsSaving(false);
                  }
                }} className="space-y-4">
                  
                  {/* Event Title */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      value={eventDetailsForm.title}
                      onChange={(e) => setEventDetailsForm({...eventDetailsForm, title: e.target.value})}
                      className="modern-input w-full px-4 py-3"
                      required
                    />
                  </div>
                  
                  {/* Event Date */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Event Date
                    </label>
                    <input
                      type="datetime-local"
                      value={eventDetailsForm.event_date}
                      onChange={(e) => setEventDetailsForm({...eventDetailsForm, event_date: e.target.value})}
                      className="modern-input w-full px-4 py-3"
                    />
                  </div>
                  
                  {/* Event Location */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Event Location
                    </label>
                    <input
                      type="text"
                      value={eventDetailsForm.event_location}
                      onChange={(e) => setEventDetailsForm({...eventDetailsForm, event_location: e.target.value})}
                      placeholder="Location or address"
                      className="modern-input w-full px-4 py-3"
                    />
                  </div>
                  
                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Company Name
                      {!canUseBranding && (
                        <span className="ml-2 text-xs text-yellow-400">(Premium Feature)</span>
                      )}
                    </label>
                    {canUseBranding ? (
                      <input
                        type="text"
                        value={eventDetailsForm.company_name}
                        onChange={(e) => setEventDetailsForm({...eventDetailsForm, company_name: e.target.value})}
                        className="modern-input w-full px-4 py-3"
                        placeholder="Your company name"
                      />
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          value={eventDetailsForm.company_name}
                          disabled
                          className="modern-input w-full px-4 py-3 opacity-50 cursor-not-allowed"
                          placeholder="Upgrade to Basic plan to add company name"
                        />
                        <div className="absolute inset-0 flex items-center justify-end pr-3 pointer-events-none">
                          <Link 
                            href="/?upgrade=true&reason=branding#pricing"
                            className="text-xs text-blue-400 hover:text-blue-300 underline pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Upgrade →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Company Logo */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Company Logo
                      {!canUseBranding && (
                        <span className="ml-2 text-xs text-yellow-400">(Premium Feature)</span>
                      )}
                    </label>
                    
                    {canUseBranding ? (
                      <>
                        {/* Logo Preview */}
                        {(logoPreview || eventDetailsForm.company_logo_url) && (
                          <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10 mb-3">
                            <Image 
                              src={logoPreview || eventDetailsForm.company_logo_url} 
                              alt="Logo preview" 
                              className="h-12 w-12 object-contain rounded-lg bg-white/10 p-2" 
                              width={48} 
                              height={48} 
                              unoptimized 
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-white/90 truncate">
                                {logoFile?.name || 'Current logo'}
                              </div>
                              <button 
                                type="button" 
                                onClick={() => { 
                                  setLogoFile(null); 
                                  setLogoPreview(''); 
                                  setEventDetailsForm({...eventDetailsForm, company_logo_url: ''});
                                }}
                                className="text-xs text-white/60 hover:text-white/80"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Upload Options */}
                        {!logoPreview && !eventDetailsForm.company_logo_url && (
                          <div className="flex flex-col gap-3">
                            {/* URL Input */}
                            <input
                              type="url"
                              value={eventDetailsForm.company_logo_url}
                              onChange={(e) => setEventDetailsForm({...eventDetailsForm, company_logo_url: e.target.value})}
                              placeholder="Paste logo URL"
                              className="modern-input w-full px-4 py-3 text-base"
                              pattern="https?://.*\.(png|jpg|jpeg|webp|svg)"
                            />
                            
                            {/* Divider */}
                            <div className="flex items-center gap-3">
                              <div className="h-px flex-1 bg-white/10"></div>
                              <span className="text-xs text-white/40">or</span>
                              <div className="h-px flex-1 bg-white/10"></div>
                            </div>

                            {/* Upload Area */}
                            <div
                              role="button"
                              aria-label="Logo dropzone"
                              onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                              onDragLeave={() => setDragActive(false)}
                              onDrop={(e) => {
                                e.preventDefault()
                                setDragActive(false)
                                const f = e.dataTransfer.files?.[0]
                                if (!f) return
                                if (!['image/png','image/jpeg','image/webp','image/svg+xml'].includes(f.type)) return
                                if (f.size > 2 * 1024 * 1024) { setError('Logo too large. Max 2MB.'); return }
                                setLogoFile(f)
                                setLogoPreview(URL.createObjectURL(f))
                              }}
                              onClick={() => document.getElementById('eventLogoFileInput')?.click()}
                              className={`flex items-center justify-center gap-3 rounded-xl border border-dashed p-4 transition-all cursor-pointer ${
                                dragActive 
                                  ? 'border-white/60 bg-white/10' 
                                  : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
                              }`}
                            >
                              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-sm text-white/60">Choose or drop image</span>
                            </div>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/svg+xml"
                              onChange={(e) => {
                                const f = e.target.files?.[0] || null
                                if (!f) { setLogoFile(null); setLogoPreview(''); return }
                                if (!['image/png','image/jpeg','image/webp','image/svg+xml'].includes(f.type)) { setError('Unsupported file type'); return }
                                if (f.size > 2 * 1024 * 1024) { setError('Logo too large. Max 2MB.'); return }
                                setError('')
                                setLogoFile(f)
                                setLogoPreview(URL.createObjectURL(f))
                              }}
                              className="hidden"
                              id="eventLogoFileInput"
                            />
                            <p className="text-white/40 text-xs">Supported: PNG, JPG, JPEG, WebP, SVG • Max size: 2MB</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-white/90 text-sm mb-2">
                              Logo upload is only available on Basic, Pro, and Enterprise plans.
                            </p>
                            <Link 
                              href="/?upgrade=true&reason=branding#pricing"
                              className="inline-flex items-center gap-2 text-sm text-yellow-300 hover:text-yellow-200 underline"
                            >
                              Upgrade to unlock logo upload →
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Information PDF for Guests */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Information PDF (shown on invite)
                    </label>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="text-sm text-white/70">
                          {data?.event.info_pdf_url ? 'PDF is uploaded and visible to guests.' : 'No PDF uploaded yet.'}
                        </div>
                        {data?.event.info_pdf_url && (
                          <a
                            href={data.event.info_pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs rounded-lg bg-white/10 hover:bg-white/15"
                          >
                            View
                          </a>
                        )}
                      </div>
                      {/* Uploader */}
                      {data?.event?.id && (
                        <PdfUploader
                          eventId={data.event.id}
                          onUploadComplete={(url) => {
                            updateEventSettings({ info_pdf_url: url })
                          }}
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Form Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={settingsSaving || !eventDetailsForm.title.trim()}
                      className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-medium transition-all hover:bg-white/90 disabled:opacity-50 disabled:hover:bg-white"
                    >
                      {settingsSaving ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Saving...</span>
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEventDetailsForm(false);
                        setLogoFile(null);
                        setLogoPreview('');
                        // Reset form to original values
                        if (data?.event) {
                          setEventDetailsForm({
                            title: data.event.title || '',
                            event_date: formatDateForInput(data.event.event_date),
                            event_location: data.event.event_location || '',
                            company_name: data.event.company_name || '',
                            company_logo_url: data.event.company_logo_url || ''
                          });
                        }
                      }}
                      className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white/90 hover:bg-white/15 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Current Event Details Display */}
            {!showEventDetailsForm && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Event Info */}
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Event Title - Full Width */}
                    <div className="md:col-span-2">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3 mb-2">
                          <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H3a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v3m0 0h8" />
                          </svg>
                          <span className="text-sm font-medium text-white/60">Event Title</span>
                        </div>
                        <p className="text-lg font-semibold text-white/90">{data?.event.title || 'Not set'}</p>
                      </div>
                    </div>
                    
                    {/* Event Date */}
                    <div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3 mb-2">
                          <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm font-medium text-white/60">Event Date</span>
                        </div>
                        <p className="text-white/90">
                          {formatDateForDisplay(data?.event.event_date)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Event Location */}
                    <div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3 mb-2">
                          <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm font-medium text-white/60">Location</span>
                        </div>
                        <p className="text-white/90">{data?.event.event_location || 'Not set'}</p>
                      </div>
                    </div>
                    
                    {/* Company Name */}
                    <div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3 mb-2">
                          <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="text-sm font-medium text-white/60">Company</span>
                        </div>
                        <p className="text-white/90">{data?.event.company_name || 'Not set'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Company Logo Section */}
                <div className="lg:col-span-1">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium text-white/60">Company Logo</span>
                    </div>
                    
                    {data?.event.company_logo_url ? (
                      <div className="text-center">
                        <div className="relative inline-block">
                          <Image 
                            src={data.event.company_logo_url} 
                            alt="Company logo" 
                            className="h-24 w-24 object-contain rounded-lg bg-white/10 p-3 mx-auto" 
                            width={96} 
                            height={96} 
                            unoptimized 
                          />
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-sm text-white/90 mt-3">Logo is set</p>
                        <p className="text-xs text-white/60 mt-1">Click "Edit Details" to change</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="h-24 w-24 rounded-lg bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center mx-auto mb-3">
                          <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-sm text-white/60">No logo set</p>
                        <p className="text-xs text-white/40 mt-1">Click "Edit Details" to add one</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Event Settings */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold">Event Settings</h2>
              <div className="flex flex-wrap gap-2">
                {canUseBranding ? (
                  <button 
                    onClick={() => setShowColorSettings(!showColorSettings)}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 text-white/90 transition-all flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    Colors
                  </button>
                ) : (
                  <div className="relative group">
                    <button
                      disabled
                      onClick={() => {
                        // Show upgrade prompt
                        const upgradeUrl = '/?upgrade=true&reason=branding#pricing'
                        window.open(upgradeUrl, '_blank')
                      }}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white/40 cursor-not-allowed flex items-center gap-2 opacity-50 hover:opacity-70"
                      title="Custom colors available on Basic, Pro, and Enterprise plans"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                      Colors
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </button>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                      <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg border border-white/20 whitespace-nowrap">
                        <p className="mb-1">Custom colors require Basic plan or higher</p>
                        <Link 
                          href="/?upgrade=true&reason=branding#pricing" 
                          className="text-blue-400 hover:text-blue-300 underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Upgrade now →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
                <Link href={`/a/${adminToken}/access`} className="modern-button px-4 py-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Team Access
                </Link>
                {isAdmin && (
                  <Link href="/admin/settings" className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 text-white/90 transition-all flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Account Settings
                  </Link>
                )}
              </div>
            </div>
            
            {/* Color Customization Panel */}
            {showColorSettings && canUseBranding && (
              <div className="mb-6 p-5 rounded-xl bg-black/30 border border-white/10 animate-fadeIn">
                <h3 className="text-lg font-medium mb-4">Color Settings</h3>
                
                {/* Theme Color Picker */}
                <ThemeColorPicker 
                  onSave={async () => {
                    // Save to localStorage
                    saveTheme();
                    // Persist to Supabase
                    try {
                      await updateEventSettings({
                        background_color: colors.primary,
                        page_background_color: colors.bg,
                        spotlight_color: colors.secondary,
                        font_color: colors.text,
                      })
                    } catch (e) {
                      // ignore UI error, already alerted by updateEventSettings
                    }
                    setShowColorSettings(false);
                  }}
                  className="mt-4"
                />
              </div>
            )}
            {showColorSettings && !canUseBranding && (
              <div className="mb-6 p-5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 animate-fadeIn">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-yellow-300 mb-2">Custom Colors Unavailable</h3>
                    <p className="text-white/80 text-sm mb-3">
                      Custom color customization is only available on Basic, Pro, and Enterprise plans. Upgrade to unlock this feature and personalize your event appearance.
                    </p>
                    <Link 
                      href="/?upgrade=true&reason=branding#pricing"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-300 hover:bg-yellow-500/30 transition-all text-sm font-medium"
                    >
                      View Plans & Upgrade
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Access Mode
                </label>
                <select 
                  value={data?.event.auth_mode || (data?.event.open_invite ? 'open' : 'guest_list')}
                  onChange={(e) => {
                    const newMode = e.target.value as 'open' | 'code' | 'guest_list';
                    console.log('Changing auth mode to:', newMode);
                    
                    // Always preserve the existing promo code when switching modes
                    updateEventSettings({ 
                      auth_mode: newMode,
                    });
                  }}
                  className="modern-input w-full px-4 py-3"
                >
                  <option value="open">Open Invite (Anyone can RSVP)</option>
                  <option value="code">Promo Code (Require a code to RSVP)</option>
                  <option value="guest_list">Guest List Only (Pre-added guests only)</option>
                </select>
                
                {(data?.event.auth_mode === 'code') && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Promo Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode || data?.event.promo_code || ''}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Enter promo code"
                        className="modern-input flex-1 px-4 py-2"
                      />
                      <button 
                        onClick={() => updateEventSettings({ promo_code: promoCode })}
                        className="modern-button px-4 py-2"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Required RSVP Fields Configuration (Paid Users Only) */}
              {userTier !== 'free' && (
                <div className="mt-6 p-5 rounded-xl bg-black/30 border border-white/10">
                  <h3 className="text-lg font-medium mb-4">Required RSVP Fields</h3>
                  <p className="text-sm text-white/60 mb-4">
                    Choose which information attendees must provide when RSVPing. Name and last name are always required.
                  </p>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requiredFields.email || false}
                        onChange={(e) => {
                          const newFields = { ...requiredFields, email: e.target.checked }
                          setRequiredFields(newFields)
                          updateEventSettings({ required_rsvp_fields: newFields })
                        }}
                        className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-white/90">Email Address</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requiredFields.phone || false}
                        onChange={(e) => {
                          const newFields = { ...requiredFields, phone: e.target.checked }
                          setRequiredFields(newFields)
                          updateEventSettings({ required_rsvp_fields: newFields })
                        }}
                        className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-white/90">Phone Number</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requiredFields.address || false}
                        onChange={(e) => {
                          const newFields = { ...requiredFields, address: e.target.checked }
                          setRequiredFields(newFields)
                          updateEventSettings({ required_rsvp_fields: newFields })
                        }}
                        className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-white/90">Address</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requiredFields.guests || false}
                        onChange={(e) => {
                          const newFields = { ...requiredFields, guests: e.target.checked }
                          setRequiredFields(newFields)
                          updateEventSettings({ required_rsvp_fields: newFields })
                        }}
                        className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-white/90">Number of Guests</span>
                    </label>
                  </div>
                </div>
              )}
              
              {/* Contact info moved to its own section below */}
            </div>
          </div>
          
          {/* Attendees List */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div 
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setAttendeesExpanded(!attendeesExpanded)}
              >
                <h2 className="text-2xl font-bold">RSVPs</h2>
                {data?.attendees && data.attendees.length > 0 && (
                  <span className="text-sm text-white/60">
                    ({data.attendees.length} {data.attendees.length === 1 ? 'response' : 'responses'})
                  </span>
                )}
                <svg 
                  className={`w-5 h-5 text-white/60 transition-transform ${attendeesExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div className="relative w-full sm:w-auto" ref={rsvpMenuRef}>
                <button
                  onClick={() => setRsvpMenuOpen(!rsvpMenuOpen)}
                  className="modern-button px-4 py-2 w-full sm:w-auto inline-flex items-center justify-center gap-2"
                  aria-haspopup="menu"
                  aria-expanded={rsvpMenuOpen}
                >
                  Manage RSVPs
                  <svg className={`w-4 h-4 transition-transform ${rsvpMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {rsvpMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-gray-800 rounded-lg shadow-lg z-10 py-1 border border-white/10" role="menu">
                    <button onClick={downloadCSV} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10" role="menuitem">Export CSV</button>
                    {data?.event.auth_mode === 'guest_list' && (
                      <>
                        <button onClick={downloadTemplate} className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10" role="menuitem">Download Template</button>
                        <label className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 cursor-pointer" role="menuitem">
                          Import XLSX
                          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => e.target.files && importXlsx(e.target.files[0])} />
                        </label>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Show info message for open access mode */}
            {data?.event.auth_mode === 'open' && (
              <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="text-blue-300 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-blue-300 font-medium mb-1">Open Access Mode</h3>
                    <p className="text-white/70 text-sm">
                      This event is set to "Open Invite" mode, which means anyone with the link can RSVP. 
                      Guest list management features are only available when using "Guest List" access mode.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Search Bar */}
            {attendeesExpanded && data?.attendees && data.attendees.length > 0 && (
              <div className="mb-4">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, or phone..."
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                {searchQuery && (
                  <div className="mt-2 text-sm text-white/60">
                    {data.attendees.filter(attendee => {
                      const query = searchQuery.toLowerCase()
                      const fullName = `${attendee.first_name} ${attendee.last_name}`.toLowerCase()
                      const email = (attendee.email || '').toLowerCase()
                      const phone = (attendee.phone || '').toLowerCase()
                      return fullName.includes(query) || email.includes(query) || phone.includes(query)
                    }).length} result(s)
                  </div>
                )}
              </div>
            )}

            {attendeesExpanded && data?.attendees && data.attendees.length > 0 ? (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-white admin-table">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-3 px-4 font-medium text-white/80">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-white/80">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-white/80">Status</th>
                        <th className="text-center py-3 px-4 font-medium text-white/80">Guests</th>
                        <th className="text-center py-3 px-4 font-medium text-white/80">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(searchQuery ? data.attendees.filter(attendee => {
                        const query = searchQuery.toLowerCase()
                        const fullName = `${attendee.first_name} ${attendee.last_name}`.toLowerCase()
                        const email = (attendee.email || '').toLowerCase()
                        const phone = (attendee.phone || '').toLowerCase()
                        return fullName.includes(query) || email.includes(query) || phone.includes(query)
                      }) : data.attendees).map((attendee) => editing === attendee.id ? (
                      <tr key={attendee.id} className="border-b border-white/10 bg-white/10">
                        <td className="py-3 px-4" data-label="Name">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={editForm.first_name || ''}
                              onChange={(e) => updateEditForm('first_name', e.target.value)}
                              className="modern-input w-full px-3 py-2"
                              placeholder="First name"
                            />
                            <input
                              type="text"
                              value={editForm.last_name || ''}
                              onChange={(e) => updateEditForm('last_name', e.target.value)}
                              className="modern-input w-full px-3 py-2"
                              placeholder="Last name"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4" data-label="Email">
                          <input
                            type="email"
                            value={editForm.email || ''}
                            onChange={(e) => updateEditForm('email', e.target.value)}
                            className="modern-input w-full px-3 py-2"
                            placeholder="Email"
                          />
                        </td>
                        <td className="py-3 px-4" data-label="Status">
                          <select
                            value={editForm.attending ? 'yes' : 'no'}
                            onChange={(e) => updateEditForm('attending', e.target.value === 'yes')}
                            className="modern-input w-full px-3 py-2"
                          >
                            <option value="yes">Attending</option>
                            <option value="no">Not Attending</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-center" data-label="Guests">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={editForm.guest_count || 0}
                            onChange={(e) => updateEditForm('guest_count', parseInt(e.target.value) || 0)}
                            className="modern-input w-20 px-3 py-2 text-center mx-auto"
                          />
                        </td>
                        <td className="py-3 px-4 text-center" data-label="Actions">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={saveAttendee}
                              disabled={saving}
                              className="modern-button px-3 py-1"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg hover:bg-white/15"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={attendee.id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="py-3 px-4" data-label="Name">
                          {attendee.first_name} {attendee.last_name}
                        </td>
                        <td className="py-3 px-4 text-white/70" data-label="Email">
                          {attendee.email || '-'}
                        </td>
                        <td className="py-3 px-4" data-label="Status">
                          <button
                            onClick={() => toggleAttendance(attendee)}
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            attendee.attending 
                              ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                              : 'bg-red-500/20 text-red-300 border border-red-400/30'
                            }`}
                          >
                            {attendee.attending ? 'Yes' : 'No'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center" data-label="Guests">
                          {attendee.attending ? (
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              attendee.guest_count > 0 
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' 
                                : 'bg-gray-500/20 text-gray-300 border border-gray-400/30'
                            }`}>
                              {attendee.guest_count > 0 ? `+${attendee.guest_count}` : '0'}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center" data-label="Actions">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => startEdit(attendee)}
                              className="modern-button modern-button-sm inline-flex items-center justify-center w-24"
                            >
                              Edit
                            </button>
                            <div className="relative" ref={expandedAttendee === attendee.id ? menuRef : undefined}>
                              <button
                                onClick={(e) => {
                                  const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect()
                                  setContextAnchor({ left: rect.left, right: rect.right, bottom: rect.bottom, top: rect.top })
                                  setExpandedAttendee(expandedAttendee === attendee.id ? null : attendee.id)
                                }}
                                className="modern-button modern-button-sm inline-flex items-center justify-center w-24"
                                aria-label="More options"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                              </button>
                              {expandedAttendee === attendee.id && contextAnchor && (
                                <RowMenu
                                  anchorRect={{ left: contextAnchor.left, right: contextAnchor.right, bottom: contextAnchor.bottom!, top: contextAnchor.top! } as DOMRect}
                                  onClose={() => { setExpandedAttendee(null); setContextMenuPos(null) }}
                                  email={attendee.email}
                                  phone={attendee.phone}
                                  onDelete={() => deleteAttendee(attendee.id)}
                                />
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile List View */}
                <div className="md:hidden space-y-2 max-h-[600px] overflow-y-auto -mx-2 px-2">
                  {(searchQuery ? data.attendees.filter(attendee => {
                    const query = searchQuery.toLowerCase()
                    const fullName = `${attendee.first_name} ${attendee.last_name}`.toLowerCase()
                    const email = (attendee.email || '').toLowerCase()
                    const phone = (attendee.phone || '').toLowerCase()
                    return fullName.includes(query) || email.includes(query) || phone.includes(query)
                  }) : data.attendees).map((attendee) => editing === attendee.id ? (
                    <div key={attendee.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editForm.first_name || ''}
                            onChange={(e) => updateEditForm('first_name', e.target.value)}
                            className="modern-input w-full px-3 py-2 text-sm"
                            placeholder="First name"
                          />
                          <input
                            type="text"
                            value={editForm.last_name || ''}
                            onChange={(e) => updateEditForm('last_name', e.target.value)}
                            className="modern-input w-full px-3 py-2 text-sm"
                            placeholder="Last name"
                          />
                        </div>
                        <input
                          type="email"
                          value={editForm.email || ''}
                          onChange={(e) => updateEditForm('email', e.target.value)}
                          className="modern-input w-full px-3 py-2 text-sm"
                          placeholder="Email"
                        />
                        <select
                          value={editForm.attending ? 'yes' : 'no'}
                          onChange={(e) => updateEditForm('attending', e.target.value === 'yes')}
                          className="modern-input w-full px-3 py-2 text-sm"
                        >
                          <option value="yes">Attending</option>
                          <option value="no">Not Attending</option>
                        </select>
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-white/70">Guests:</label>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={editForm.guest_count || 0}
                            onChange={(e) => updateEditForm('guest_count', parseInt(e.target.value) || 0)}
                            className="modern-input w-20 px-3 py-2 text-center text-sm"
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={saveAttendee}
                            disabled={saving}
                            className="flex-1 modern-button px-3 py-2 text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/15 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div 
                      key={attendee.id} 
                      className="bg-white/5 border-b border-white/10 py-3 px-3 active:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-white truncate">
                              {attendee.first_name} {attendee.last_name}
                            </h3>
                            <button
                              onClick={() => toggleAttendance(attendee)}
                              className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                                attendee.attending 
                                  ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                                  : 'bg-red-500/20 text-red-300 border border-red-400/30'
                              }`}
                            >
                              {attendee.attending ? 'Yes' : 'No'}
                            </button>
                            {attendee.attending && attendee.guest_count > 0 && (
                              <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30">
                                +{attendee.guest_count}
                              </span>
                            )}
                          </div>
                          {attendee.email && (
                            <p className="text-sm text-white/60 truncate mb-1">{attendee.email}</p>
                          )}
                          {attendee.phone && (
                            <p className="text-xs text-white/50 truncate">{attendee.phone}</p>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => startEdit(attendee)}
                            className="px-3 py-1.5 text-xs bg-white/10 border border-white/20 rounded-lg hover:bg-white/15 text-white/90"
                          >
                            Edit
                          </button>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect()
                                setContextAnchor({ left: rect.left, right: rect.right, bottom: rect.bottom, top: rect.top })
                                setExpandedAttendee(expandedAttendee === attendee.id ? null : attendee.id)
                              }}
                              className="px-2 py-1.5 bg-white/10 border border-white/20 rounded-lg hover:bg-white/15 text-white/90"
                              aria-label="More options"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>
                            {expandedAttendee === attendee.id && contextAnchor && (
                              <RowMenu
                                anchorRect={{ left: contextAnchor.left, right: contextAnchor.right, bottom: contextAnchor.bottom!, top: contextAnchor.top! } as DOMRect}
                                onClose={() => { setExpandedAttendee(null); setContextMenuPos(null) }}
                                email={attendee.email}
                                phone={attendee.phone}
                                onDelete={() => deleteAttendee(attendee.id)}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : attendeesExpanded && (!data?.attendees || data.attendees.length === 0) ? (
              <div className="text-center py-8 text-white/50">
                No RSVPs yet. Share the guest link to start receiving responses!
              </div>
            ) : !attendeesExpanded && data?.attendees && data.attendees.length > 0 ? (
              <div className="text-center py-6 text-white/70">
                <p className="mb-2">
                  {data.attendees.length} {data.attendees.length === 1 ? 'RSVP' : 'RSVPs'} 
                  {' • '}
                  {data.attendees.filter(a => a.attending).length} attending
                  {data.attendees.filter(a => !a.attending).length > 0 && (
                    <> • {data.attendees.filter(a => !a.attending).length} not attending</>
                  )}
                </p>
                <button
                  onClick={() => setAttendeesExpanded(true)}
                  className="modern-button px-4 py-2 text-sm mt-2"
                >
                  View Full List
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-white/50">
                No RSVPs yet. Share the guest link to start receiving responses!
              </div>
            )}
          </div>
          {/* Manual Add Guest - Available for all auth modes */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">Add Guest Manually</h2>
            <p className="text-white/70 text-sm mb-4">
              Add guests manually for phone calls, walk-ins, or other situations where they can't RSVP online.
            </p>
            <AddGuestForm adminToken={adminToken} onAdded={(attendee) => setData(d => d ? ({ ...d, attendees: [attendee, ...d.attendees] }) : d)} />
          </div>

          {/* Contact Info for Guests - Discrete & Collapsible */}
          <div className="glass-card rounded-2xl p-4 sm:p-6 text-white">
            <div 
              className="flex justify-between items-center cursor-pointer hover:bg-white/5 rounded-lg p-2 -m-2 transition-colors"
              onClick={() => setContactInfoExpanded(!contactInfoExpanded)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white/80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 8l-9 6-9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-white/90">Contact Information for Guests</div>
                  <div className="text-xs text-white/60">Set contact details that will appear on the RSVP page</div>
                </div>
              </div>
              <svg 
                className={`w-5 h-5 text-white/60 transition-transform ${contactInfoExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {contactInfoExpanded && (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={contactName || data?.event.contact_name || ''}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Your name (e.g., Jane Doe)"
                    className="modern-input w-full px-3 py-2 text-sm"
                  />
                  <input
                    type="email"
                    value={contactEmail || data?.event.contact_email || ''}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Your email (e.g., jane@company.com)"
                    className="modern-input w-full px-3 py-2 text-sm"
                  />
                  <input
                    type="tel"
                    value={contactPhone || data?.event.contact_phone || ''}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Your phone (e.g., +1 919-555-1234)"
                    className="modern-input w-full px-3 py-2 text-sm"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      // Use the current state values directly
                      const contactSettings = {
                        contact_name: contactName || '',
                        contact_email: contactEmail || '',
                        contact_phone: contactPhone || ''
                      };
                      console.log('Saving contact info:', contactSettings);
                      updateEventSettings(contactSettings);
                    }}
                    className="modern-button px-4 py-2 text-sm"
                  >
                    Save Contact Info
                  </button>
                  <button
                    onClick={() => {
                      setContactName('')
                      setContactEmail('')
                      setContactPhone('')
                      updateEventSettings({ contact_name: null, contact_email: null, contact_phone: null })
                    }}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/15 text-sm"
                  >
                    Clear
                  </button>
                </div>

                {/* Preview */}
                {(contactName || contactEmail || contactPhone || data?.event.contact_name || data?.event.contact_email || data?.event.contact_phone) && (
                  <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg">
                    <div className="text-xs text-white/60 mb-2">Preview (as guests will see it):</div>
                    <div className="text-sm text-white/80">
                      Questions? Contact{' '}
                      <span className="font-medium text-white">
                        {contactName || data?.event.contact_name || 'Your Name'}
                      </span>
                      {(contactEmail || data?.event.contact_email) && (
                        <span className="ml-2 text-white/60">
                          at {contactEmail || data?.event.contact_email}
                        </span>
                      )}
                      {(contactPhone || data?.event.contact_phone) && (
                        <span className="ml-2 text-white/60">
                          or {contactPhone || data?.event.contact_phone}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
        {/* Final CTA before footer for guest users */}
        {!isAdmin && (
          <div className="max-w-4xl mx-auto mt-12 mb-8 p-4 sm:p-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl text-center border border-yellow-500/30">
            <h3 className="text-xl font-semibold text-white mb-2">Don't lose access to your event!</h3>
            <p className="text-white/70 mb-4">Create a free account now to securely manage this event and create unlimited events in the future.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                href="/admin/register" 
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-semibold rounded-xl hover:from-yellow-300 hover:to-orange-300 transition-all text-center shadow-lg"
              >
                Create Free Account
              </Link>
              <Link 
                href="/magic-login" 
                className="px-6 py-3 bg-white/10 border border-white/20 text-white/90 rounded-xl hover:bg-white/20 transition-all text-center"
              >
                Quick Login
              </Link>
            </div>
          </div>
        )}
        <Footer showDonate={true} />
      </div>
    </div>
  );
}

function AddGuestForm({ adminToken, onAdded }: { adminToken: string, onAdded: (a: Attendee) => void }) {
  const [form, setForm] = useState<{ first_name: string; last_name: string; email?: string; phone?: string; address?: string; guest_count: number; attending: boolean }>({ 
    first_name: '', 
    last_name: '', 
    email: '', 
    phone: '', 
    address: '', 
    guest_count: 0, 
    attending: true 
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [addressQuery, setAddressQuery] = useState('')
  const [addressResults, setAddressResults] = useState<Array<{ display_name: string }>>([])
  const [addressLoading, setAddressLoading] = useState(false)

  useEffect(() => {
    if (!addressQuery || addressQuery.trim().length < 3) { setAddressResults([]); return }
    const id = setTimeout(async () => {
      try {
        setAddressLoading(true)
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&limit=5`)
        const json = await res.json()
        setAddressResults(json || [])
      } catch (e) {
        // ignore
      } finally {
        setAddressLoading(false)
      }
    }, 400)
    return () => clearTimeout(id)
  }, [addressQuery])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.first_name.trim() || !form.last_name.trim()) { setError('First and last name required'); return }
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const payload = { ...form }
      const res = await fetch(`/api/admin/${adminToken}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to add guest')
      
      onAdded(json.attendee)
      
      // Show appropriate success message based on whether it was an update or new addition
      if (json.updated) {
        setSuccess(`Updated RSVP for ${form.first_name} ${form.last_name}`)
      } else {
        setSuccess(`Added ${form.first_name} ${form.last_name} to the guest list`)
      }
      
      // Reset form
      setForm({ first_name: '', last_name: '', email: '', phone: '', address: '', guest_count: 0, attending: true })
      setAddressQuery('')
      setAddressResults([])
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess('')
      }, 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding guest')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 relative">
        <input aria-label="First name" className="modern-input px-3 py-3" placeholder="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
        <input aria-label="Last name" className="modern-input px-3 py-3" placeholder="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        <input aria-label="Email" type="email" className="modern-input px-3 py-3" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input aria-label="Phone" type="tel" className="modern-input px-3 py-3" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <div className="md:col-span-1 col-span-1">
          <input aria-label="Address" className="modern-input px-3 py-3 w-full" placeholder="Address (optional)" value={addressQuery} onChange={(e) => { setAddressQuery(e.target.value); setForm({ ...form, address: e.target.value }) }} />
          {addressQuery && addressResults.length > 0 && (
            <div className="absolute z-20 mt-1 max-h-48 overflow-auto w-full md:w-[calc(100%/6*1-0.75rem)] bg-black/60 border border-white/20 rounded-lg">
              {addressResults.map((r, idx) => (
                <button key={idx} type="button" className="block w-full text-left px-3 py-2 hover:bg-white/10 text-sm" onClick={() => { setForm({ ...form, address: r.display_name }); setAddressQuery(r.display_name); setAddressResults([]) }}>
                  {r.display_name}
                </button>
              ))}
              {addressLoading && <div className="px-3 py-2 text-xs text-white/60">Searching…</div>}
            </div>
          )}
        </div>
        <button type="submit" className="modern-button px-4 py-3" disabled={submitting}>{submitting ? 'Adding...' : 'Add'}</button>
      </div>
      
      {/* Additional options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-white/80">
            <input
              type="checkbox"
              checked={form.attending}
              onChange={(e) => setForm({ ...form, attending: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm">Attending</span>
          </label>
        </div>
        
        <div className="flex items-center space-x-3">
          <label className="text-white/80 text-sm">Guest count:</label>
          <input
            type="number"
            min="0"
            max="20"
            value={form.guest_count}
            onChange={(e) => setForm({ ...form, guest_count: parseInt(e.target.value) || 0 })}
            className="modern-input px-3 py-2 w-20 text-center"
            placeholder="0"
          />
        </div>
      </div>
      
      {error && <div className="text-red-300 text-sm">{error}</div>}
      {success && <div className="text-green-300 text-sm">{success}</div>}
    </form>
  );
}

// Portal-based row menu component
function RowMenu({ anchorRect, onClose, email, phone, onDelete }: { anchorRect: DOMRect, onClose: () => void, email?: string | null, phone?: string | null, onDelete: () => void }) {
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [pos, setPos] = React.useState<{x:number;y:number}>({ x: 0, y: 0 })

  React.useLayoutEffect(() => {
    const margin = 8
    const menuEl = menuRef.current
    if (!menuEl) return
    const { offsetWidth: width, offsetHeight: height } = menuEl
    let x = anchorRect.right - width
    let y = anchorRect.bottom + margin
    x = Math.min(x, window.innerWidth - width - margin)
    x = Math.max(x, margin)
    if (y + height > window.innerHeight - margin) {
      y = anchorRect.top - height - margin
    }
    if (y < margin) y = Math.max(margin, anchorRect.bottom + margin)
    setPos({ x, y })
  }, [anchorRect])

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    function onResize() { onClose() }
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
    }
  }, [onClose])

  return createPortal(
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div ref={menuRef} className="fixed z-50 w-48 bg-gray-800 rounded-lg shadow-lg py-1 border border-white/10" style={{ left: pos.x, top: pos.y }} role="menu">
        {email && (
          <a href={`mailto:${email}`} className="block px-4 py-2 text-sm text-white hover:bg-white/10 flex items-center gap-2" target="_blank" rel="noopener noreferrer" role="menuitem">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Email
          </a>
        )}
        {phone && (
          <a href={`tel:${phone}`} className="block px-4 py-2 text-sm text-white hover:bg-white/10 flex items-center gap-2" role="menuitem">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            Call
          </a>
        )}
        <button onClick={onDelete} className="block w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-red-500/20 flex items-center gap-2" role="menuitem">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Delete
        </button>
      </div>
    </>,
    document.body
  )
}