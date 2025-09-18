import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { CreateEventData } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Database not configured. Please set up your Supabase environment variables.' 
      }, { status: 500 })
    }

    const body: CreateEventData = await request.json()

    // Basic validation for logo URL if provided
    const allowedLogoExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg']
    if (body.company_logo_url) {
      const url = body.company_logo_url.trim()
      const isHttp = url.startsWith('http://') || url.startsWith('https://')
      const hasAllowedExt = allowedLogoExtensions.some(ext => url.toLowerCase().includes(ext))
      if (!isHttp || !hasAllowedExt) {
        return NextResponse.json({ error: 'Invalid logo URL. Use a direct link to png, jpg, jpeg, webp, or svg.' }, { status: 400 })
      }
    }
    
    // Generate random admin token
    const adminToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15)
    
    const { data, error } = await supabase
      .from('events')
      .insert({
        title: body.title,
        allow_plus_guests: body.allow_plus_guests,
        background_color: body.background_color || '#1f2937',
        admin_token: adminToken,
        company_name: body.company_name ?? null,
        company_logo_url: body.company_logo_url ?? null,
        open_invite: body.open_invite ?? true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating event:', error)
      // Surface the underlying error for easier debugging during setup
      return NextResponse.json({ error: error.message || 'Failed to create event' }, { status: 500 })
    }

    return NextResponse.json({ 
      event: data,
      guest_link: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/e/${data.id}`,
      admin_link: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/a/${adminToken}`
    })
  } catch (error) {
    console.error('Error in POST /api/events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
