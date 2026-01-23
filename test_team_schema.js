// Test script to verify team management schema
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

console.log('🧪 Testing Team Management Schema\n');

// Load environment variables
const envPaths = [
  './.env.local',
  './.env'
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
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
    break;
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

async function testSchema() {
  console.log('Testing team management tables...');

  const tables = [
    'team_members',
    'event_permissions',
    'team_invitations'
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error) {
        console.log(`❌ Table ${table} not found or error:`, error.message);
      } else {
        console.log(`✅ Table ${table} exists`);
      }
    } catch (err) {
      console.log(`❌ Error testing ${table}:`, err.message);
    }
  }

  console.log('\nTesting RPC functions...');

  const functions = [
    'invite_team_member',
    'accept_team_invitation',
    'can_access_event',
    'grant_event_permissions',
    'get_user_events'
  ];

  for (const func of functions) {
    try {
      // Just test if the function exists by calling it with invalid params
      const { error } = await supabase.rpc(func);
      if (error && !error.message.includes('does not exist')) {
        console.log(`✅ Function ${func} exists`);
      } else if (error && error.message.includes('does not exist')) {
        console.log(`❌ Function ${func} does not exist`);
      } else {
        console.log(`✅ Function ${func} exists`);
      }
    } catch (err) {
      console.log(`❌ Error testing ${func}:`, err.message);
    }
  }

  console.log('\n🎉 Schema test complete!');
  console.log('\nTo apply the schema, run the SQL in team_management_schema.sql in your Supabase SQL editor.');
}

testSchema().catch(console.error);