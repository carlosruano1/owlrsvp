import { NextPage } from 'next'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface TicketVerifyPageProps {
  params: Promise<{ ticket_code: string }>
}

export default async function TicketVerifyPage({ params }: TicketVerifyPageProps) {
  const { ticket_code } = await params

  if (!ticket_code || !supabase) {
    notFound()
  }

  try {
    // Look up attendee by ticket code
    const { data: attendee, error: attendeeError } = await supabase
      .from('attendees')
      .select(`
        id,
        first_name,
        last_name,
        checked_in_at,
        event_id,
        events (
          title,
          user_id,
          admin_users (
            subscription_tier
          )
        )
      `)
      .eq('ticket_code', ticket_code)
      .single()

    if (attendeeError || !attendee) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center max-w-md">
            <div className="text-red-400 text-xl mb-2">Invalid Ticket</div>
            <div className="text-white/70">This ticket code is not valid or has expired.</div>
          </div>
        </div>
      )
    }

    // Check if event exists and has a creator
    const event = attendee.events as any
    if (!event?.user_id) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center max-w-md">
            <div className="text-red-400 text-xl mb-2">Ticketing Not Available</div>
            <div className="text-white/70">This event does not support ticketing.</div>
          </div>
        </div>
      )
    }

    // Check if creator has Pro tier for ticketing
    const creatorTier = event.admin_users?.subscription_tier || 'free'
    const hasTicketing = ['pro', 'enterprise', 'team'].includes(creatorTier)
    if (!hasTicketing) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center max-w-md">
            <div className="text-red-400 text-xl mb-2">Ticketing Not Available</div>
            <div className="text-white/70">This feature requires a Pro or Enterprise plan.</div>
          </div>
        </div>
      )
    }

    // Check if already checked in
    if (attendee.checked_in_at) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-6 text-center max-w-md">
            <div className="text-green-400 text-xl mb-2">Already Checked In</div>
            <div className="text-white/90 font-medium mb-1">
              {attendee.first_name} {attendee.last_name}
            </div>
            <div className="text-white/70 text-sm">
              Checked in at {new Date(attendee.checked_in_at).toLocaleString()}
            </div>
          </div>
        </div>
      )
    }

    // Mark as checked in
    const { error: updateError } = await supabase
      .from('attendees')
      .update({
        checked_in_at: new Date().toISOString(),
        checked_in_by: null // No session for public check-in
      })
      .eq('id', attendee.id)

    if (updateError) {
      console.error('Failed to check in attendee:', updateError)
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center max-w-md">
            <div className="text-red-400 text-xl mb-2">Check-in Failed</div>
            <div className="text-white/70">Unable to check in this ticket. Please try again.</div>
          </div>
        </div>
      )
    }

    // Success
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-6 text-center max-w-md">
          <div className="text-green-400 text-2xl mb-3">✓</div>
          <div className="text-green-400 text-xl mb-2">Checked In!</div>
          <div className="text-white/90 font-medium mb-1">
            {attendee.first_name} {attendee.last_name}
          </div>
          <div className="text-white/70 text-sm">
            {event.title}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Ticket verification error:', error)
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center max-w-md">
          <div className="text-red-400 text-xl mb-2">Verification Error</div>
          <div className="text-white/70">An error occurred while verifying this ticket.</div>
        </div>
      </div>
    )
  }
}