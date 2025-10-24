import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

/**
 * This is a fallback API route for event creation when the main API route fails.
 * It doesn't actually save data to the database but returns a mock successful response
 * to allow development and testing to continue when there are issues with the database.
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'This endpoint is only available in development' }, { status: 404 });
  }

  try {
    // Log the request for debugging
    console.log('Fallback API called with request:', request.url)
    
    // Parse the request body
    const body = await request.json()
    console.log('Fallback API request body:', body)
    
    // Generate random IDs for the mock event
    const eventId = `mock-${Date.now()}`
    const adminToken = `mock-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`
    
    // Check if user is authenticated
    const sessionCookie = request.cookies.get('admin_session')?.value;
    let userId = null;
    
    if (sessionCookie) {
      // In fallback mode, we just log this but don't actually validate
      console.log('Fallback API: User appears to be logged in with session cookie');
      // Mock a user ID for testing
      userId = `mock-user-${Math.random().toString(36).substring(2, 15)}`;
    }
    
    // Create a mock event response
    const mockEvent = {
      id: eventId,
      title: body.title || 'Mock Event',
      allow_plus_guests: body.allow_plus_guests || false,
      background_color: body.background_color || '#1f2937',
      page_background_color: body.page_background_color || '#000000',
      spotlight_color: body.spotlight_color || '#1f2937',
      font_color: body.font_color || '#FFFFFF',
      admin_token: adminToken,
      company_name: body.company_name || null,
      company_logo_url: body.company_logo_url || null,
      open_invite: body.open_invite ?? true,
      auth_mode: body.auth_mode || 'open',
      promo_code: body.promo_code || null,
      event_date: body.event_date || null,
      event_location: body.event_location || null,
      created_by_admin_id: userId, // Associate with mock user if logged in
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Return a successful response with the mock event
    return NextResponse.json({ 
      event: mockEvent,
      guest_link: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/e/${eventId}`,
      admin_link: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/a/${adminToken}`,
      _note: 'This is a mock response from the fallback API. No data was actually saved to the database.'
    })
  } catch (error) {
    console.error('Error in fallback events API:', error)
    return NextResponse.json({ error: 'Internal server error in fallback API' }, { status: 500 })
  }
}
