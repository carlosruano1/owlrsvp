'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Tab } from '@headlessui/react'
import Footer from '@/components/Footer'
import ResponseOverTime from '@/components/charts/ResponseOverTime'
import ResponseStatus from '@/components/charts/ResponseStatus'
import ResponseTimeHeatmap from '@/components/charts/ResponseTimeHeatmap'
import GuestInsights from '@/components/charts/GuestInsights'

interface EventAnalytics {
  eventId: string;
  eventTitle: string;
  eventDate: string | null;
  adminToken: string;
  analytics: {
    totalInvited: number;
    totalAttending: number;
    totalDeclined: number;
    totalGuests: number;
    responseRate: string;
    plusOnes: number;
    plusOnesAverage: number | string;
    responsesByDay: Record<string, number>;
    responseHours: Record<number, number>;
    mostActiveHour: number;
    locations: Record<string, number>;
    predictedAttendance: number;
    averageResponseTime: number | null;
  };
  insights: Array<{
    type: 'success' | 'warning' | 'info' | 'urgent';
    message: string;
  }>;
}

export default function EventAnalyticsPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null)
  
  const eventId = params.id as string

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/events/analytics?eventId=${eventId}`)
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/admin/login')
            return
          }
          if (response.status === 403) {
            // Check if it's an upgrade requirement
            const errorData = await response.json().catch(() => ({}))
            if (errorData.requiresUpgrade) {
              router.push(errorData.upgradeUrl || '/?upgrade=true&reason=analytics#pricing')
              return
            }
            router.push('/admin/login')
            return
          }
          throw new Error(`Error ${response.status}: ${await response.text()}`)
        }
        const data = await response.json()
        setAnalytics(data)
      } catch (err) {
        console.error('Failed to fetch analytics:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchAnalytics()
    }
  }, [eventId, router])

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="animated-bg" />
        <div className="spotlight" />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="text-white/80 text-xl">Loading analytics data...</div>
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="animated-bg" />
        <div className="spotlight" />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
          <div className="text-red-400 text-xl mb-4">Failed to load analytics</div>
          <div className="text-white/70 mb-8">{error || 'Event not found'}</div>
          <Link 
            href="/admin/events"
            className="px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all"
          >
            Back to Events
          </Link>
        </div>
      </div>
    )
  }

  // Calculate the total pending
  const totalPending = analytics.analytics.totalInvited - 
                     (analytics.analytics.totalAttending + analytics.analytics.totalDeclined);

  // Format event date
  const eventDate = analytics.eventDate 
    ? new Date(analytics.eventDate).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'Date not set';

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="animated-bg" />
      <div className="spotlight" />
      <div className="relative z-10 min-h-screen p-4 sm:p-8 pb-24">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <Link 
                href="/admin/events"
                className="text-white/60 hover:text-white flex items-center gap-2 mb-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Events
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">{analytics.eventTitle}</h1>
              <p className="text-white/70">{eventDate}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link 
                href={`/admin/events/${eventId}`}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/15 transition-all text-white text-sm"
              >
                Edit Event
              </Link>
              <Link 
                href={`/a/${analytics.adminToken}`}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/15 transition-all text-white text-sm"
                target="_blank"
              >
                View RSVP Page
              </Link>
            </div>
          </div>

          {/* Dashboard Tabs */}
          <Tab.Group>
            <Tab.List className="flex space-x-1 rounded-xl bg-white/5 p-1">
              <Tab 
                className={({ selected }) =>
                  `w-full rounded-lg py-3 px-4 text-sm font-medium leading-5 transition-colors
                  ${selected 
                    ? 'bg-white/10 text-white shadow' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                Overview
              </Tab>
              <Tab 
                className={({ selected }) =>
                  `w-full rounded-lg py-3 px-4 text-sm font-medium leading-5 transition-colors
                  ${selected 
                    ? 'bg-white/10 text-white shadow' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                Response Analysis
              </Tab>
              <Tab 
                className={({ selected }) =>
                  `w-full rounded-lg py-3 px-4 text-sm font-medium leading-5 transition-colors
                  ${selected 
                    ? 'bg-white/10 text-white shadow' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                Guest Insights
              </Tab>
            </Tab.List>
            <Tab.Panels className="mt-6">
              {/* Overview Tab */}
              <Tab.Panel className="rounded-xl glass-card p-4 md:p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Event Overview</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Response Status Chart */}
                  <div className="glass-card rounded-xl p-4 md:p-6">
                    <h3 className="text-lg font-medium text-white mb-4">Response Status</h3>
                    <ResponseStatus 
                      totalAttending={analytics.analytics.totalAttending} 
                      totalDeclined={analytics.analytics.totalDeclined}
                      totalPending={totalPending}
                    />
                  </div>
                  
                  {/* Response Over Time Chart */}
                  <div className="glass-card rounded-xl p-4 md:p-6">
                    <h3 className="text-lg font-medium text-white mb-4">Responses Over Time</h3>
                    <ResponseOverTime responsesByDay={analytics.analytics.responsesByDay} />
                  </div>
                  
                  {/* Key Stats */}
                  <div className="glass-card rounded-xl p-4 md:p-6">
                    <h3 className="text-lg font-medium text-white mb-4">Key Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-white/60 mb-1">Total Invited</div>
                        <div className="text-2xl font-bold text-blue-400">
                          {analytics.analytics.totalInvited}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-white/60 mb-1">Total Attending</div>
                        <div className="text-2xl font-bold text-green-400">
                          {analytics.analytics.totalAttending}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-white/60 mb-1">Response Rate</div>
                        <div className="text-2xl font-bold text-purple-400">
                          {analytics.analytics.responseRate}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-white/60 mb-1">Additional Guests</div>
                        <div className="text-2xl font-bold text-yellow-400">
                          {analytics.analytics.totalGuests - analytics.analytics.totalAttending}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Time of Day Chart */}
                  <div className="glass-card rounded-xl p-4 md:p-6">
                    <h3 className="text-lg font-medium text-white mb-4">Response Time Analysis</h3>
                    <ResponseTimeHeatmap responseHours={analytics.analytics.responseHours} />
                  </div>
                </div>
              </Tab.Panel>
              
              {/* Response Analysis Tab */}
              <Tab.Panel className="rounded-xl glass-card p-4 md:p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Response Analysis</h2>
                
                <div className="grid grid-cols-1 gap-6">
                  {/* Response Time Details */}
                  <div className="glass-card rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4">Response Time Analysis</h3>
                    <ResponseTimeHeatmap responseHours={analytics.analytics.responseHours} />
                    <div className="mt-6 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                        <div>
                          <div className="text-sm text-white/60 mb-1">Most Active Hour</div>
                          <div className="font-medium text-white">
                            {analytics.analytics.mostActiveHour > 12 ? 
                              analytics.analytics.mostActiveHour - 12 : 
                              analytics.analytics.mostActiveHour} 
                            {analytics.analytics.mostActiveHour >= 12 ? 'PM' : 'AM'}
                          </div>
                        </div>
                        <div className="bg-green-500/20 px-4 py-2 rounded-lg">
                          <div className="text-sm text-green-400 font-medium">
                            Recommended reminder time
                          </div>
                        </div>
                      </div>

                      {analytics.analytics.averageResponseTime !== null && (
                        <div>
                          <div className="text-sm text-white/60 mb-1">Average Response Time Before Event</div>
                          <div className="font-medium text-white">
                            {analytics.analytics.averageResponseTime} days before the event
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Response Trend */}
                  <div className="glass-card rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4">Response Trend</h3>
                    <ResponseOverTime responsesByDay={analytics.analytics.responsesByDay} />
                    <div className="mt-4">
                      <div className="text-sm text-white/60 mb-1">Response Rate</div>
                      <div className="font-medium text-white flex items-center gap-2">
                        {analytics.analytics.responseRate}% of invited guests have responded
                        {parseInt(analytics.analytics.responseRate) > 75 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                            Excellent
                          </span>
                        ) : parseInt(analytics.analytics.responseRate) > 50 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                            Good
                          </span>
                        ) : parseInt(analytics.analytics.responseRate) > 25 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                            Fair
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                            Poor
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Tab.Panel>
              
              {/* Guest Insights Tab */}
              <Tab.Panel className="rounded-xl glass-card p-4 md:p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Guest Insights</h2>
                
                <GuestInsights 
                  totalAttending={analytics.analytics.totalAttending}
                  totalGuests={analytics.analytics.totalGuests}
                  responseRate={analytics.analytics.responseRate}
                  plusOnes={analytics.analytics.plusOnes}
                  plusOnesAverage={analytics.analytics.plusOnesAverage}
                  predictedAttendance={analytics.analytics.predictedAttendance}
                  insights={analytics.insights}
                />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
      <Footer showDonate={false} />
    </div>
  );
}

