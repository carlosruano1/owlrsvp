import { createClient } from '@supabase/supabase-js'

// Hard-coded fallbacks in case environment variables are not available
const FALLBACK_URL = 'https://nbdsqxuknvzbyxwasukt.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZHNxeHVrbnZ6Ynl4d2FzdWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MzM3NTcsImV4cCI6MjA3MzMwOTc1N30.SOZQBY5Zl3DFSrBHRFhboS7vzz4hO9H65IOnUP5CqXM';
const FALLBACK_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZHNxeHVrbnZ6Ynl4d2FzdWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzczMzc1NywiZXhwIjoyMDczMzA5NzU3fQ.nIcKGQ-JDddVR6ppNATpC8_QJMDVNzSWX7y0_lIotlc';

// Try to use environment variables first, fall back to hardcoded values if needed
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_KEY;

console.log('Initializing Supabase client with URL:', supabaseUrl);

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false // Don't persist auth state
  },
  db: {
    schema: 'public'
  }
});

// For server-side operations that need elevated permissions
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
