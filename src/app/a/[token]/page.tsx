'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Event, Attendee } from '@/lib/types'
import * as XLSX from 'xlsx'
import QRCode from 'qrcode'
import Footer from '@/components/Footer'
import Image from 'next/image'
import Link from 'next/link'
import { ThemeProvider } from '@/components/ThemeProvider'
import ThemeColorPicker from '@/components/ThemeColorPicker'

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
  const [contactInfoExpanded, setContactInfoExpanded] = useState(false)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  
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
  const [showColorSettings, setShowColorSettings] = useState(false)
  const [showDetailedStats, setShowDetailedStats] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const guestLink = data ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/e/${data.event.id}` : ''

  // Handle clicks outside the menu to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setExpandedAttendee(null);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  // Check if user is logged in as admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          setIsAdmin(true)
        }
      } catch (err) {
        // Not logged in
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
      // Skip validation and directly fetch data
      // This allows access to the admin page even for users who created events without login
      fetchData()
    } catch (err) {
      console.error('Error validating admin token:', err)
      setError('Failed to validate admin access')
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
      const res = await fetch(qrCodeUrl)
      const blob = await res.blob()
      // @ts-ignore: ClipboardItem is available in browsers
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      setCopyQrSuccess(true)
      setTimeout(() => setCopyQrSuccess(false), 2000)
    } catch (err) {
      alert('Copy failed. You can download instead.')
      console.error('Failed to copy QR:', err)
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
      const response = await fetch(`/api/admin/${adminToken}`)
      const result = await response.json()

      if (!response.ok) {
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
          <div className="text-center">
            <div className="text-red-400 text-xl mb-4">Access Denied</div>
            <div className="text-white/70">Invalid admin token.</div>
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
              <button 
                onClick={() => setShowDetailedStats(!showDetailedStats)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 text-white/90 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {showDetailedStats ? 'Hide Detailed Stats' : 'Show Detailed Stats'}
              </button>
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
                    await updateEventSettings({
                      title: eventDetailsForm.title,
                      event_date: eventDetailsForm.event_date ? formatDateForDatabase(eventDetailsForm.event_date) : undefined,
                      event_location: eventDetailsForm.event_location || undefined,
                      company_name: eventDetailsForm.company_name || undefined,
                      company_logo_url: finalLogoUrl || undefined
                    });
                    
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
                    </label>
                    <input
                      type="text"
                      value={eventDetailsForm.company_name}
                      onChange={(e) => setEventDetailsForm({...eventDetailsForm, company_name: e.target.value})}
                      className="modern-input w-full px-4 py-3"
                    />
                  </div>
                  
                  {/* Company Logo */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Company Logo
                    </label>
                    
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
                <button 
                  onClick={() => setShowColorSettings(!showColorSettings)}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 text-white/90 transition-all flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  Colors
                </button>
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
            {showColorSettings && (
              <div className="mb-6 p-5 rounded-xl bg-black/30 border border-white/10 animate-fadeIn">
                <h3 className="text-lg font-medium mb-4">Color Settings</h3>
                
                {/* Theme Color Picker */}
                <ThemeColorPicker 
                  onSave={() => {
                    // Theme colors are automatically saved to localStorage by ThemeColorPicker
                    // No need to save to database as theme system handles persistence
                    console.log('Theme colors saved to localStorage');
                    // Hide the color settings menu after saving
                    setShowColorSettings(false);
                  }}
                  className="mt-4"
                />
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
              
              {/* Contact info moved to its own section below */}
            </div>
          </div>
          
          {/* Share Section */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold">Share Event</h2>
              {!isAdmin && (
                <Link 
                  href="/magic-login" 
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15 text-white/90 transition-all text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Quick Login
                </Link>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Guest Link */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Guest RSVP Link
                </label>
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <input
                    type="text"
                    value={guestLink}
                    readOnly
                    className="modern-input flex-1 px-4 py-2 text-sm"
                  />
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={copyGuestLink}
                      className="modern-button px-4 py-2 min-w-[80px] w-full sm:w-auto"
                    >
                      {copySuccess ? 'Copied' : 'Copy'}
                    </button>
                    <a
                      href={guestLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="modern-button px-4 py-2 min-w-[80px] w-full sm:w-auto"
                    >
                      Open
                    </a>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="text-center">
                <div className="text-sm font-medium text-white/80 mb-2">QR Code</div>
                {qrCodeUrl && (
                  <Image 
                    src={qrCodeUrl} 
                    alt="Event QR Code" 
                    className="mx-auto border border-white/10 rounded-lg bg-white/5"
                    width={150}
                    height={150}
                    unoptimized
                  />
                )}
                <div className="mt-3 flex flex-col sm:flex-row gap-2 justify-center">
                  <button onClick={copyQrToClipboard} className="modern-button px-4 py-2 w-full sm:w-auto">
                    {copyQrSuccess ? 'Copied QR' : 'Copy QR'}
                  </button>
                  <button onClick={downloadQr} className="modern-button px-4 py-2 w-full sm:w-auto">Download QR</button>
                </div>
              </div>
            </div>
          </div>

          {/* Attendees List */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <h2 className="text-2xl font-bold">RSVPs</h2>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 admin-actions w-full sm:w-auto">
                <button
                  onClick={downloadCSV}
                  className="modern-button px-4 py-2 w-full sm:w-auto"
                >
                  Export CSV
                </button>
                {/* Only show template and import options for guest list mode */}
                {data?.event.auth_mode === 'guest_list' && (
                  <>
                    <button onClick={downloadTemplate} className="modern-button px-4 py-2 w-full sm:w-auto">Download Template</button>
                    <label className="modern-button px-4 py-2 cursor-pointer w-full sm:w-auto text-center">
                      Import XLSX
                      <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => e.target.files && importXlsx(e.target.files[0])} />
                    </label>
                  </>
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

            {data?.attendees && data.attendees.length > 0 ? (
              <div className="overflow-x-auto">
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
                    {data.attendees.map((attendee) => editing === attendee.id ? (
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
                              className="modern-button px-3 py-1"
                            >
                              Edit
                            </button>
                            <div className="relative" ref={expandedAttendee === attendee.id ? menuRef : undefined}>
                              <button
                                onClick={() => setExpandedAttendee(expandedAttendee === attendee.id ? null : attendee.id)}
                                className="modern-button px-3 py-1 flex items-center justify-center"
                                aria-label="More options"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                              </button>
                              
                              {expandedAttendee === attendee.id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 rounded-lg shadow-lg z-10 py-1 border border-white/10">
                                  {attendee.email && (
                                    <a 
                                      href={`mailto:${attendee.email}?subject=${encodeURIComponent('Hello from ' + (data?.event.title || 'our event'))}&body=${encodeURIComponent(`Hi ${attendee.first_name || ''},\n\nThis is a quick note about ${data?.event.title || 'our event'}. You can view details and RSVP here:\n${guestLink}\n\nThanks!\n${data?.event.company_name || 'Event Organizer'}`)}`}
                                      className="block px-4 py-2 text-sm text-white hover:bg-white/10 flex items-center gap-2"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                      Email
                                    </a>
                                  )}
                                  {attendee.phone && (
                                    <a 
                                      href={`tel:${attendee.phone}`}
                                      className="block px-4 py-2 text-sm text-white hover:bg-white/10 flex items-center gap-2"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                      </svg>
                                      Call
                                    </a>
                                  )}
                                  <button
                                    onClick={() => deleteAttendee(attendee.id)}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-red-500/20 flex items-center gap-2"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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