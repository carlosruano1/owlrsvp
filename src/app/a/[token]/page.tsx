'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Event, Attendee } from '@/lib/types'
import * as XLSX from 'xlsx'
import QRCode from 'qrcode'
import Footer from '@/components/Footer'
import Image from 'next/image'

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
  const params = useParams()
  const adminToken = params.token as string

  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Attendee>>({})
  const [saving, setSaving] = useState(false)

  const guestLink = data ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/e/${data.event.id}` : ''

  useEffect(() => {
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
          const guestUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/e/${result.event.id}`
          const qrUrl = await QRCode.toDataURL(guestUrl)
          setQrCodeUrl(qrUrl)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load admin data')
      } finally {
        setLoading(false)
      }
    }

    if (adminToken) {
      fetchData()
    }
  }, [adminToken])

  const copyGuestLink = async () => {
    try {
      await navigator.clipboard.writeText(guestLink)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
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

  const toggleAttendance = async (attendee: Attendee) => {
    try {
      const response = await fetch(`/api/admin/${adminToken}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: attendee.id,
          attending: !attendee.attending
        })
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
            <h1 className="text-4xl font-bold mb-2">🦉 {data?.event.title}</h1>
            <p className="text-white/80 text-lg">Admin Dashboard</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 admin-grid">
            <div className="glass-card rounded-2xl p-6 text-white">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {data?.stats.totalAttending || 0}
              </div>
              <div className="text-white/80">Attending</div>
            </div>
            <div className="glass-card rounded-2xl p-6 text-white">
              <div className="text-3xl font-bold text-red-400 mb-2">
                {data?.stats.totalNotAttending || 0}
              </div>
              <div className="text-white/80">Not Attending</div>
            </div>
            <div className="glass-card rounded-2xl p-6 text-white">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {data?.stats.totalResponses || 0}
              </div>
              <div className="text-white/80">Total Responses</div>
            </div>
          </div>

          {/* Share Section */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">Share Event</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Guest Link */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Guest RSVP Link
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={guestLink}
                    readOnly
                    className="modern-input flex-1 px-4 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={copyGuestLink}
                      className="modern-button px-4 py-2 min-w-[80px]"
                    >
                      {copySuccess ? '✅' : '📋'}
                    </button>
                    <a
                      href={guestLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="modern-button px-4 py-2 min-w-[80px]"
                    >
                      🔎
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
              </div>
            </div>
          </div>

          {/* Attendees List */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <h2 className="text-2xl font-bold">RSVPs</h2>
              <div className="flex flex-wrap gap-2 admin-actions">
                <button
                  onClick={downloadCSV}
                  className="modern-button px-4 py-2"
                >
                  📊 CSV
                </button>
                <button onClick={downloadTemplate} className="modern-button px-4 py-2">⬇️ Template</button>
                <label className="modern-button px-4 py-2 cursor-pointer">
                  ⬆️ Import
                  <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => e.target.files && importXlsx(e.target.files[0])} />
                </label>
              </div>
            </div>

            {data?.attendees && data.attendees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-white admin-table">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-3 px-4 font-medium text-white/80">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-white/80">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-white/80">Status</th>
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
                            {attendee.attending ? '✅ Yes' : '❌ No'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center" data-label="Actions">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => startEdit(attendee)}
                              className="modern-button px-3 py-1"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteAttendee(attendee.id)}
                              className="px-3 py-1 bg-red-500/20 border border-red-400/30 rounded-lg text-red-200 hover:bg-red-500/30"
                            >
                              Delete
                            </button>
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
        </div>
        <Footer showDonate={true} />
      </div>
    </div>
  )
}