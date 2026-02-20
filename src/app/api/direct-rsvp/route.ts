import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'
import { generateRSVPConfirmationEmail, generateOrganizerNotificationEmail, generateCalendarICS, generateTicketEmail } from '@/lib/email'
import { nanoid } from 'nanoid'
import QRCode from 'qrcode'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Direct RSVP API received request with body:', JSON.stringify(body, null, 2))
    
    // Basic validation
    if (!body.event_id || !body.first_name || !body.last_name) {
      return NextResponse.json({ 
        error: 'Missing required fields: event_id, first_name, last_name' 
      }, { status: 400 })
    }
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }
    
    // First, fetch the event to check access mode and promo code (try by id, then by admin_token)
    let event: { id: string; auth_mode?: string; open_invite?: boolean; promo_code?: string } | null = null
    let eventIdForDb = body.event_id

    const { data: eventById, error: eventError } = await supabase
      .from('events')
      .select('id, auth_mode, open_invite, promo_code')
      .eq('id', eventIdForDb)
      .single()

    if (!eventError && eventById) {
      event = eventById
      eventIdForDb = event.id
    } else {
      const { data: eventByToken, error: tokenError } = await supabase
        .from('events')
        .select('id, auth_mode, open_invite, promo_code')
        .eq('admin_token', body.event_id)
        .single()

      if (tokenError || !eventByToken) {
        console.error('Direct RSVP: Event not found. ID:', body.event_id, 'Error:', eventError?.message, tokenError?.message)
        return NextResponse.json({
          error: 'Event not found or invalid event ID',
          details: eventError?.message || tokenError?.message || 'Unknown error'
        }, { status: 404 })
      }
      event = eventByToken
      eventIdForDb = event.id
    }

    if (!event) {
      return NextResponse.json({ error: 'Event not found or invalid event ID' }, { status: 404 })
    }

    // Determine auth mode (fallback to open_invite for backward compatibility)
    const authMode = event.auth_mode || (event.open_invite ? 'open' : 'guest_list')
    
    // If promo code is required, validate it
    if (authMode === 'code') {
      const providedCode = body.promo_code || ''
      const eventCode = event.promo_code || ''
      
      console.log(`Validating promo code: provided "${providedCode}", expected "${eventCode}"`)
      
      if (!providedCode || providedCode.toLowerCase().trim() !== eventCode.toLowerCase().trim()) {
        return NextResponse.json({ 
          error: 'Invalid promo code. Please check and try again.',
          provided: providedCode,
          expected: eventCode
        }, { status: 403 })
      }
      
      console.log('Promo code validation passed')
    }
    
    // If guest list is required, check if the attendee is in the list
    if (authMode === 'guest_list') {
      const { data: existingAttendee, error: attendeeError } = await supabase
        .from('attendees')
        .select('id')
        .eq('event_id', eventIdForDb)
        .eq('first_name', body.first_name)
        .eq('last_name', body.last_name)
        .single()
        
      if (attendeeError || !existingAttendee) {
        return NextResponse.json({ 
          error: 'You are not on the guest list for this event. Please contact the event organizer.',
          details: 'Guest list access required'
        }, { status: 403 })
      }
      
      console.log('Guest list validation passed')
    }
    // Check if a guest with the same email already exists for this event
    let existingAttendeeId = null
    
    if (body.email) {
      const { data: existingAttendee } = await supabase
        .from('attendees')
        .select('id')
        .eq('event_id', eventIdForDb)
        .eq('email', body.email)
        .single()
        
      if (existingAttendee) {
        console.log('Found existing attendee with same email:', existingAttendee.id)
        existingAttendeeId = existingAttendee.id
      }
    }
    
    // If we found an existing attendee with the same email, update it
    if (existingAttendeeId) {
      const { data: updateData, error: updateError } = await supabase
        .from('attendees')
        .update({
          first_name: body.first_name,
          last_name: body.last_name,
          phone: body.phone || null,
          address: body.address || null,
          guest_count: body.guest_count || 0,
          attending: body.attending === undefined ? true : body.attending,
          ticket_code: nanoid(16) // Generate new ticket code on update (for re-RSVP)
        })
        .eq('id', existingAttendeeId)
        .select()
        .single()
        
      if (updateError) {
        console.error('Error updating existing RSVP:', updateError)
        return NextResponse.json({ 
          error: 'Failed to update existing RSVP',
          details: updateError.message
        }, { status: 500 })
      }
      
      const response = NextResponse.json({ 
        success: true, 
        message: 'RSVP updated successfully',
        attendee: updateData,
        updated: true
      })

      // Send emails for updated RSVP too (same logic as new RSVP)
      setTimeout(async () => {
        try {
          const { data: fullEvent } = await supabase
            .from('events')
            .select('title, contact_email, contact_name, event_date, event_end_time, event_location, user_id, admin_token')
            .eq('id', eventIdForDb)
            .single()

          if (!fullEvent) return

          // Get creator tier for ad display
          let creatorTier = 'free'
          if (fullEvent.user_id) {
            const { data: creatorData } = await supabase
              .from('admin_users')
              .select('subscription_tier')
              .eq('id', fullEvent.user_id)
              .single()
            creatorTier = creatorData?.subscription_tier || 'free'
          }

          const attendee = updateData
          const attendeeName = `${attendee.first_name} ${attendee.last_name}`
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          const adminUrl = `${baseUrl}/a/${fullEvent.admin_token}`

          if (attendee.email) {
            const calendarIcs = fullEvent.event_date 
              ? generateCalendarICS(
                  fullEvent.title,
                  fullEvent.event_date,
                  fullEvent.event_end_time || undefined,
                  fullEvent.event_location || undefined,
                  `RSVP confirmation for ${fullEvent.title}`
                )
              : undefined

            const confirmationEmail = generateRSVPConfirmationEmail(
              attendeeName,
              fullEvent.title,
              fullEvent.event_date || undefined,
              fullEvent.event_end_time || undefined,
              fullEvent.event_location || undefined,
              calendarIcs,
              creatorTier
            )

            await sendEmail({
              to: attendee.email,
              subject: confirmationEmail.subject,
              html: confirmationEmail.html,
              text: confirmationEmail.text
            }).catch(err => console.error('Failed to send RSVP confirmation email:', err))
          }
        } catch (error) {
          console.error('Error sending RSVP update emails:', error)
        }
      }, 0)

      return response
    }

    // Otherwise, insert a new record
    const { data, error } = await supabase
      .from('attendees')
      .insert({
        event_id: eventIdForDb,
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        guest_count: body.guest_count || 0,
        attending: body.attending === undefined ? true : body.attending,
        ticket_code: nanoid(16) // Generate unique ticket code for QR scanning
      })
      .select()
      
    if (error) {
      console.error('Error inserting RSVP:', error)
      
      // If it's a foreign key error, the event doesn't exist
      if (error.code === '23503') {
        return NextResponse.json({ 
          error: 'Event not found. Please check the event_id.',
          details: error.message
        }, { status: 404 })
      }
      
      // If it's a unique constraint error, the person already RSVP'd
      if (error.code === '23505') {
        // Try to update instead - this is a fallback for cases where email matching didn't work
        const { data: updateData, error: updateError } = await supabase
          .from('attendees')
          .update({
            email: body.email || null,
            phone: body.phone || null,
            address: body.address || null,
            guest_count: body.guest_count || 0,
            attending: body.attending === undefined ? true : body.attending,
            ticket_code: nanoid(16) // Generate new ticket code on update
          })
          .eq('event_id', eventIdForDb)
          .eq('first_name', body.first_name)
          .eq('last_name', body.last_name)
          .select()
          
        if (updateError) {
          return NextResponse.json({ 
            error: 'Failed to update existing RSVP',
            details: updateError.message
          }, { status: 500 })
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'RSVP updated successfully',
          attendee: updateData?.[0],
          updated: true
        })
      }
      
      return NextResponse.json({ 
        error: 'Failed to submit RSVP',
        details: error.message
      }, { status: 500 })
    }
    
    const response = NextResponse.json({ 
      success: true, 
      message: 'RSVP submitted successfully',
      attendee: data?.[0]
    })

    // Send emails asynchronously (don't block the response)
    // Use setTimeout to ensure response is sent first
    setTimeout(async () => {
      try {
        // Fetch full event details for email
        const { data: fullEvent } = await supabase
          .from('events')
          .select('title, contact_email, contact_name, event_date, event_end_time, event_location, user_id, admin_token, payment_required, ticket_price')
          .eq('id', eventIdForDb)
          .single()

        if (!fullEvent) return

        // Get creator tier for ad display and ticketing
        let creatorTier = 'free'
        if (fullEvent.user_id) {
          const { data: creatorData } = await supabase
            .from('admin_users')
            .select('subscription_tier')
            .eq('id', fullEvent.user_id)
            .single()
          creatorTier = creatorData?.subscription_tier || 'free'
        }

        const attendee = data?.[0]
        const attendeeName = `${attendee.first_name} ${attendee.last_name}`
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const adminUrl = `${baseUrl}/a/${fullEvent.admin_token}`
        const ticketUrl = attendee.ticket_code ? `${baseUrl}/v/${attendee.ticket_code}` : ''

        // 1. Send confirmation email to attendee (if email provided)
        if (attendee.email) {
          // Check if this is a paid ticket (has payment_required and Pro creator)
          const isPaidTicket = fullEvent.payment_required && fullEvent.ticket_price && ['pro', 'enterprise', 'team'].includes(creatorTier)

          if (isPaidTicket && attendee.ticket_code && ticketUrl) {
            // Send ticket email with QR code
            try {
              const qrCodeDataUrl = await QRCode.toDataURL(ticketUrl, {
                width: 256,
                margin: 2,
                color: {
                  dark: '#000000',
                  light: '#FFFFFF'
                }
              })

              // Use a generic Stripe receipt URL (users can find receipts in their customer portal)
              const stripeReceiptUrl = 'https://billing.stripe.com/p/login' // Generic receipt access URL

              const ticketEmail = generateTicketEmail(
                attendeeName,
                fullEvent.title,
                qrCodeDataUrl,
                ticketUrl,
                stripeReceiptUrl,
                fullEvent.event_date || undefined,
                fullEvent.event_location || undefined,
                creatorTier
              )

              await sendEmail({
                to: attendee.email,
                subject: ticketEmail.subject,
                html: ticketEmail.html,
                text: ticketEmail.text
              }).catch(err => {
                console.error('Failed to send ticket email:', err)
              })
            } catch (qrError) {
              console.error('Failed to generate QR code for ticket:', qrError)
              // Fallback to regular confirmation email
            }
          } else {
            // Send regular confirmation email
            const calendarIcs = fullEvent.event_date
              ? generateCalendarICS(
                  fullEvent.title,
                  fullEvent.event_date,
                  fullEvent.event_end_time || undefined,
                  fullEvent.event_location || undefined,
                  `RSVP confirmation for ${fullEvent.title}`
                )
              : undefined

            const confirmationEmail = generateRSVPConfirmationEmail(
              attendeeName,
              fullEvent.title,
              fullEvent.event_date || undefined,
              fullEvent.event_end_time || undefined,
              fullEvent.event_location || undefined,
              calendarIcs,
              creatorTier
            )

            await sendEmail({
              to: attendee.email,
              subject: confirmationEmail.subject,
              html: confirmationEmail.html,
              text: confirmationEmail.text
            }).catch(err => {
              console.error('Failed to send RSVP confirmation email:', err)
            })
          }
        }

        // 2. Send notification to organizer (Pro feature - check tier)
        if (fullEvent.contact_email && fullEvent.user_id) {
          // Check if user has Pro tier and email notifications enabled
          const { data: userData } = await supabase
            .from('admin_users')
            .select('subscription_tier, email_notifications_enabled')
            .eq('id', fullEvent.user_id)
            .single()

          const isProOrHigher = userData?.subscription_tier === 'pro' || userData?.subscription_tier === 'enterprise'
          const notificationsEnabled = userData?.email_notifications_enabled !== false // Default to true if not set

          if (isProOrHigher && notificationsEnabled) {
            const notificationEmail = generateOrganizerNotificationEmail(
              fullEvent.contact_name || 'Event Organizer',
              fullEvent.title,
              attendeeName,
              attendee.email || null,
              attendee.phone || null,
              attendee.guest_count || 0,
              adminUrl
            )

            await sendEmail({
              to: fullEvent.contact_email,
              subject: notificationEmail.subject,
              html: notificationEmail.html,
              text: notificationEmail.text
            }).catch(err => {
              console.error('Failed to send organizer notification email:', err)
            })
          }
        }
      } catch (error) {
        console.error('Error sending RSVP emails:', error)
        // Don't throw - email failures shouldn't break RSVP submission
      }
    }, 0)

    return response
  } catch (error) {
    console.error('Unexpected error in direct-rsvp API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
