'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  admin_token: string
  created_at: string
}

export default function ListEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/list-events')
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch events')
        }
        
        setEvents(data.events || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }
    
    fetchEvents()
  }, [])

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(`${type}-${text}`)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen p-8 bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">All Events</h1>
        
        {loading ? (
          <div className="text-center py-12">Loading events...</div>
        ) : error ? (
          <div className="p-4 bg-red-900/50 border border-red-500 rounded">
            {error}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No events found</div>
        ) : (
          <>
            <p className="mb-6 text-gray-300">
              Click on an event ID or admin token to copy it to clipboard. Use these IDs with the direct RSVP form.
            </p>
            
            <div className="mb-6">
              <Link 
                href="/direct-rsvp" 
                className="inline-block py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded font-medium"
              >
                Go to Direct RSVP Form
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="p-3 text-left">Title</th>
                    <th className="p-3 text-left">Event ID</th>
                    <th className="p-3 text-left">Admin Token</th>
                    <th className="p-3 text-left">Created At</th>
                    <th className="p-3 text-left">Links</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-t border-gray-700 hover:bg-gray-800">
                      <td className="p-3">{event.title}</td>
                      <td className="p-3">
                        <button 
                          onClick={() => copyToClipboard(event.id, 'id')}
                          className="text-blue-400 hover:text-blue-300 underline"
                          title="Click to copy"
                        >
                          {copied === `id-${event.id}` ? 'Copied!' : event.id}
                        </button>
                      </td>
                      <td className="p-3">
                        <button 
                          onClick={() => copyToClipboard(event.admin_token, 'token')}
                          className="text-blue-400 hover:text-blue-300 underline"
                          title="Click to copy"
                        >
                          {copied === `token-${event.admin_token}` ? 'Copied!' : event.admin_token}
                        </button>
                      </td>
                      <td className="p-3">
                        {new Date(event.created_at).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="flex space-x-2">
                          <a 
                            href={`/e/${event.id}`} 
                            target="_blank"
                            className="text-green-400 hover:text-green-300 underline"
                          >
                            RSVP
                          </a>
                          <a 
                            href={`/a/${event.admin_token}`} 
                            target="_blank"
                            className="text-yellow-400 hover:text-yellow-300 underline"
                          >
                            Admin
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
