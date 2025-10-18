import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  // Only allow in development or with admin token
  const isProduction = process.env.NODE_ENV === 'production';
  const authHeader = request.headers.get('authorization');
  const adminToken = authHeader?.replace('Bearer ', '');
  
  if (isProduction && adminToken !== process.env.ADMIN_DIAGNOSTICS_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 })
    }
    
    // Try to fetch a simple query
    const { data, error } = await supabase
      .from('events')
      .select('id')
      .limit(1)
    
    if (error) {
      return NextResponse.json({ 
        error: `Supabase query failed: ${error.message}`,
        details: error
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Supabase connection successful',
      data
    })
  } catch (error) {
    console.error('Error in test-supabase route:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
