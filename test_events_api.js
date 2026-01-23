// Test script to check events API
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

console.log('🧪 Testing Events API\n');

// Load environment variables
const envPaths = ['./.env.local', './.env'];
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.trim()) return;

      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
    break; // Only load the first file found
  }
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testEvents() {
  console.log('Testing get_user_events RPC...');

  // Get a real user ID
  const { data: users, error: userError } = await supabase
    .from('admin_users')
    .select('id, email, subscription_tier')
    .limit(1);

  if (userError || !users || users.length === 0) {
    console.log('❌ No users found');
    return;
  }

  const user = users[0];
  console.log(`Testing with user: ${user.email} (${user.subscription_tier})`);

  const { data: events, error } = await supabase
    .rpc('get_user_events', { p_user_id: user.id });

  console.log('RPC result:', {
    eventsCount: events?.length || 0,
    error: error?.message,
    sampleEvent: events?.[0] ? {
      id: events[0].id,
      title: events[0].title,
      archived: events[0].archived,
      permissions: events[0].permissions
    } : null
  });

  // Also test direct event query
  console.log('\nTesting direct events query...');
  const { data: directEvents, error: directError } = await supabase
    .from('events')
    .select('id, title, archived, created_by_admin_id')
    .eq('created_by_admin_id', user.id)
    .limit(5);

  console.log('Direct query result:', {
    eventsCount: directEvents?.length || 0,
    error: directError?.message,
    sampleEvents: directEvents?.map(e => ({ id: e.id, title: e.title, archived: e.archived }))
  });
}

testEvents().catch(console.error);