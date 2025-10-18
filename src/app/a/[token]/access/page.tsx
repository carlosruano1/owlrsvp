'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Event } from '@/lib/types'
import Footer from '@/components/Footer'

interface AccessUser {
  id: string
  email: string
  access_code: string
  expires_at: string
  created_at: string
}

interface AccessData {
  event: Event
  access_users: AccessUser[]
}

export default function EventAccessManagement() {
  const params = useParams()
  const adminToken = params.token as string

  const [data, setData] = useState<AccessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

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

  const fetchData = async () => {
    try {
      // This would be a real API endpoint in production
      const response = await fetch(`/api/admin/${adminToken}/access`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Invalid admin token')
      }

      setData(result)
      
      // Sync animated background colors
      if (result.event.background_color) {
        const color = result.event.background_color
        const alpha = `${color}33`
        if (typeof window !== 'undefined') {
          document.documentElement.style.setProperty('--company-color', color)
          document.documentElement.style.setProperty('--company-color-alpha', alpha)
        }
      }
      
      setError('')
    } catch (err) {
      console.error('Error fetching access data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load access data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    
    setSubmitting(true)
    setError('')
    setSuccessMessage('')
    
    try {
      const response = await fetch('/api/events/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          event_id: data?.event.id,
          email: email.trim()
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send access code')
      }
      
      setSuccessMessage(`Access code sent to ${email}`)
      setEmail('')
      
      // Refresh data
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const revokeAccess = async (id: string) => {
    if (!confirm('Are you sure you want to revoke access for this user?')) return
    
    try {
      const response = await fetch(`/api/admin/${adminToken}/access`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_id: id })
      })
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to revoke access')
      }
      
      // Update local data
      setData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          access_users: prev.access_users.filter(user => user.id !== id)
        }
      })
      
      setSuccessMessage('Access successfully revoked')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke access')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="animated-bg" />
        <div className="spotlight" />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="text-white/80 text-xl">Loading access management...</div>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="animated-bg" />
        <div className="spotlight" />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-4">Access Denied</div>
            <div className="text-white/70">{error}</div>
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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-8 text-white text-glow">
            <h1 className="text-4xl font-bold mb-2">{data?.event.title}</h1>
            <p className="text-white/80 text-lg">Access Management</p>
          </div>

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
                  <div className="text-white/60 text-sm">Access Management</div>
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="logo-anim text-xl font-bold">owl<span className="logo-word-rsvp">rsvp</span></span>
              </div>
            </div>
          </div>

          {/* Add Team Member */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">Add Team Member</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter team member's email"
                  className="modern-input flex-1 px-4 py-3"
                  required
                />
                <button
                  type="submit"
                  disabled={submitting || !email.trim()}
                  className="modern-button px-6 py-3 whitespace-nowrap"
                >
                  {submitting ? 'Sending...' : 'Send Access Code'}
                </button>
              </div>
              
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-100 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              
              {successMessage && (
                <div className="bg-green-500/20 border border-green-500/30 text-green-100 px-4 py-3 rounded-xl text-sm">
                  {successMessage}
                </div>
              )}
              
              <div className="text-white/60 text-sm">
                <p>An email with a 6-digit access code will be sent to the team member.</p>
                <p>The access code will be valid for 7 days.</p>
              </div>
            </form>
          </div>

          {/* Team Members List */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">Team Members</h2>
            
            {data?.access_users && data.access_users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-white admin-table">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-3 px-4 font-medium text-white/80">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-white/80">Access Code</th>
                      <th className="text-left py-3 px-4 font-medium text-white/80">Expires</th>
                      <th className="text-center py-3 px-4 font-medium text-white/80">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.access_users.map((user) => (
                      <tr key={user.id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="py-3 px-4" data-label="Email">
                          {user.email}
                        </td>
                        <td className="py-3 px-4 font-mono" data-label="Access Code">
                          {user.access_code}
                        </td>
                        <td className="py-3 px-4 text-white/70" data-label="Expires">
                          {new Date(user.expires_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-center" data-label="Actions">
                          <button
                            onClick={() => revokeAccess(user.id)}
                            className="px-3 py-1 bg-red-500/20 text-red-300 border border-red-400/30 rounded-lg hover:bg-red-500/30"
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-white/50">
                No team members added yet. Add team members to share access to this event.
              </div>
            )}
          </div>
          
          {/* Instructions */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">How It Works</h2>
            
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <span className="text-white/80 font-medium">1</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">Add Team Member</h3>
                  <p className="text-white/70">Enter your team member's email address and send them an access code.</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <span className="text-white/80 font-medium">2</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">Team Member Receives Email</h3>
                  <p className="text-white/70">They'll get an email with a 6-digit access code and a link to the event dashboard.</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <span className="text-white/80 font-medium">3</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">Access Granted</h3>
                  <p className="text-white/70">Once they enter the code, they'll have full access to manage the event.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer showDonate={true} />
      </div>
    </div>
  );
}
