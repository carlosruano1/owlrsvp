import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  // Only allow in development or with admin token
  const isProduction = process.env.NODE_ENV === 'production';
  const authHeader = request.headers.get('authorization');
  const adminToken = authHeader?.replace('Bearer ', '');
  
  if (isProduction && adminToken !== process.env.ADMIN_DIAGNOSTICS_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    supabaseConfigured: !!supabase,
    supabaseAdminConfigured: !!supabaseAdmin,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing',
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'not configured',
    tests: {
      supabaseConnection: null as any,
      supabaseAdminEvents: null as any,
      tablesExist: null as any
    },
    recommendations: [] as string[]
  }

  // Test Supabase connection
  if (supabase) {
    try {
      const start = Date.now()
      const { data, error } = await supabase.from('events').select('count').limit(1)
      const duration = Date.now() - start
      
      diagnostics.tests.supabaseConnection = {
        success: !error,
        duration: `${duration}ms`,
        error: error ? error.message : null
      }
      
      if (error) {
        diagnostics.recommendations.push(
          'Supabase (anon) connection failed. Check your network connection and Supabase service status.'
        )
      } else if (duration > 2000) {
        diagnostics.recommendations.push(
          'Supabase connection is slow. This might cause timeouts during event creation.'
        )
      }
    } catch (err) {
      diagnostics.tests.supabaseConnection = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
      diagnostics.recommendations.push(
        'Exception occurred while testing Supabase (anon) connection. Check your network and Supabase configuration.'
      )
    }
  } else {
    diagnostics.recommendations.push(
      'Supabase client is not initialized. Check your environment variables.'
    )
  }

  // Test admin client can read events (used by GET /api/events/[id] and checkout)
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('events')
        .select('id')
        .limit(1)
        .maybeSingle()
      diagnostics.tests.supabaseAdminEvents = {
        success: !error,
        error: error ? `${error.code}: ${error.message}` : null,
        canRead: !error
      }
      if (error) {
        diagnostics.recommendations.push(
          `Service role cannot read events table: ${error.message}. Check RLS or table name.`
        )
      }
    } catch (err) {
      diagnostics.tests.supabaseAdminEvents = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        canRead: false
      }
      diagnostics.recommendations.push(
        'Exception while testing service-role read on events. Events API may return "Event not found".'
      )
    }
  }

  if (supabase) {
    try {
      // Check if tables exist
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
      
      const expectedTables = ['events', 'attendees', 'users']
      const foundTables = tables?.map(t => t.table_name) || []
      const missingTables = expectedTables.filter(t => !foundTables.includes(t))
      
      diagnostics.tests.tablesExist = {
        success: !tablesError && missingTables.length === 0,
        foundTables,
        missingTables,
        error: tablesError ? tablesError.message : null
      }
      
      if (missingTables.length > 0) {
        diagnostics.recommendations.push(
          `Missing required tables: ${missingTables.join(', ')}. Run the database setup script.`
        )
      }
    } catch (err) {
      diagnostics.tests.tablesExist = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
      diagnostics.recommendations.push(
        'Exception while checking tables. Check your network and Supabase configuration.'
      )
    }
  }

  // Add general recommendations
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    diagnostics.recommendations.push(
      'Missing required Supabase environment variables. Check your .env.local file.'
    )
  }
  
  return NextResponse.json(diagnostics)
}
