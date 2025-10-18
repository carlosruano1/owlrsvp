'use client'

import { useState } from 'react'

export default function DirectRSVP() {
  const [formData, setFormData] = useState({
    event_id: '',
    first_name: '',
    last_name: '',
    email: '',
    guest_count: 0,
    attending: true
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked
        : type === 'number' 
          ? parseInt(value) 
          : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    setResult(null)
    
    try {
      console.log('Submitting RSVP:', formData)
      
      const response = await fetch('/api/direct-rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      setResult(data)
      
      if (!response.ok) {
        setError(data.error || 'Failed to submit RSVP')
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-900 text-white">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-6">Direct RSVP Form</h1>
        <p className="mb-4 text-gray-300">Use this form to directly submit an RSVP to any event.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Event ID (required)</label>
            <input
              type="text"
              name="event_id"
              value={formData.event_id}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              placeholder="Enter exact event ID from database"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full p-2 rounded bg-gray-800 border border-gray-700"
                required
              />
            </div>
            
            <div>
              <label className="block mb-1 font-medium">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full p-2 rounded bg-gray-800 border border-gray-700"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            />
          </div>
          
          <div>
            <label className="block mb-1 font-medium">Number of Guests</label>
            <input
              type="number"
              name="guest_count"
              value={formData.guest_count}
              onChange={handleChange}
              min="0"
              max="10"
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              name="attending"
              checked={formData.attending}
              onChange={handleChange}
              className="mr-2"
              id="attending"
            />
            <label htmlFor="attending" className="font-medium">Attending</label>
          </div>
          
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-500 rounded text-red-200">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 bg-green-900/50 border border-green-500 rounded text-green-200">
              RSVP submitted successfully!
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded font-medium disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit RSVP'}
          </button>
        </form>
        
        {result && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-2">API Response:</h2>
            <pre className="p-4 bg-gray-800 rounded overflow-auto max-h-60">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
