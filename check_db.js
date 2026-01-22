const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually load .env file if it exists (check .env.local first, then .env)
const envPaths = [
  path.join(__dirname, '.env.local'),
  path.join(__dirname, '.env')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`Loading environment variables from ${path.basename(envPath)}`);
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

// Validate required env vars
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL not found in environment variables');
  console.error('   Make sure you have a .env.local or .env file with this variable');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_ANON_KEY not found in environment variables');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTable(tableName) {
  console.log(`\n=== Checking table: ${tableName} ===`);
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);
  
  if (error) {
    console.error(`❌ Table ${tableName} ERROR:`, error.message);
    console.error('   Code:', error.code);
    return false;
  } else {
    console.log(`✅ Table ${tableName} exists and is accessible`);
    return true;
  }
}

async function checkRPC(functionName, params = {}) {
  console.log(`\n=== Checking RPC function: ${functionName} ===`);
  try {
    const { data, error } = await supabase.rpc(functionName, params);
    
    if (error) {
      if (error.code === '42883' || error.message.includes('does not exist')) {
        console.error(`❌ RPC function ${functionName} does NOT exist`);
        return false;
      } else {
        console.log(`✅ RPC function ${functionName} exists (test call failed as expected: ${error.message})`);
        return true;
      }
    } else {
      console.log(`✅ RPC function ${functionName} exists and works`);
      return true;
    }
  } catch (err) {
    console.error(`❌ RPC function ${functionName} ERROR:`, err.message);
    return false;
  }
}

async function testLoginFlow() {
  console.log(`\n=== Testing Login Flow (Detailed) ===`);
  
  // Step 1: Test basic query
  console.log('\n1. Testing basic admin_users query...');
  const { data: users, error: userError } = await supabaseAnon
    .from('admin_users')
    .select('id, username, email, is_active')
    .limit(1);
  
  if (userError) {
    console.error('❌ Cannot query admin_users:', userError.message);
    console.error('   Error code:', userError.code);
    return;
  }
  
  if (!users || users.length === 0) {
    console.log('⚠️  No users found in admin_users table');
    return;
  }
  
  console.log(`✅ Found ${users.length} user(s)`);
  const testUser = users[0];
  console.log(`   Testing with user: ${testUser.username || testUser.email} (ID: ${testUser.id})`);
  
  // Step 2: Test the .or() query used in actual login
  console.log('\n2. Testing .or() query (username or email) - this is what login uses...');
  const { data: userByEmail, error: emailError } = await supabaseAnon
    .from('admin_users')
    .select('*')
    .or(`username.eq.${testUser.email},email.eq.${testUser.email}`)
    .eq('is_active', true)
    .single();
  
  if (emailError) {
    console.error('❌ .or() query failed:', emailError.message);
    console.error('   This is likely why login is failing!');
    console.error('   Error code:', emailError.code);
    console.error('   Full error:', JSON.stringify(emailError, null, 2));
  } else {
    console.log('✅ .or() query works');
  }
  
  // Step 3: Test UPDATE permission (for last_login)
  console.log('\n3. Testing UPDATE permission on admin_users (for last_login update)...');
  const { error: updateError } = await supabaseAnon
    .from('admin_users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', testUser.id);
  
  if (updateError) {
    if (updateError.code === '42501') {
      console.error('❌ UPDATE permission denied - RLS policy blocking updates');
      console.error('   This will cause login to fail when updating last_login');
    } else {
      console.error('❌ UPDATE failed:', updateError.message);
      console.error('   Error code:', updateError.code);
    }
  } else {
    console.log('✅ UPDATE permission works');
  }
  
  // Step 4: Test create_admin_session RPC
  console.log('\n4. Testing create_admin_session RPC...');
  const { data: sessionToken, error: sessionError } = await supabaseAnon
    .rpc('create_admin_session', {
      p_user_id: testUser.id,
      p_ip_address: '127.0.0.1',
      p_user_agent: 'test'
    });
  
  if (sessionError) {
    if (sessionError.code === '42883') {
      console.error('❌ create_admin_session function does NOT exist');
    } else if (sessionError.code === '42501') {
      console.error('❌ create_admin_session RPC permission denied');
      console.error('   The RPC function might not have SECURITY DEFINER or RLS is blocking it');
    } else {
      console.error('❌ create_admin_session failed:', sessionError.message);
      console.error('   Error code:', sessionError.code);
      console.error('   Full error:', JSON.stringify(sessionError, null, 2));
    }
  } else {
    console.log('✅ create_admin_session works!');
    console.log(`   Session token: ${sessionToken ? 'Generated' : 'NULL'}`);
    
    // Step 5: Test session validation
    if (sessionToken) {
      console.log('\n5. Testing validate_admin_session RPC...');
      const { data: sessionData, error: validateError } = await supabaseAnon
        .rpc('validate_admin_session', { p_token: sessionToken });
      
      if (validateError) {
        console.error('❌ validate_admin_session failed:', validateError.message);
      } else {
        console.log('✅ validate_admin_session works!');
      }
    }
  }
  
  // Step 6: Check admin_sessions table RLS
  console.log('\n6. Testing admin_sessions table access...');
  const { data: sessions, error: sessionsError } = await supabaseAnon
    .from('admin_sessions')
    .select('*')
    .limit(1);
  
  if (sessionsError) {
    if (sessionsError.code === '42501') {
      console.log('⚠️  admin_sessions table has RLS enabled (this is normal)');
    } else {
      console.error('❌ Cannot access admin_sessions:', sessionsError.message);
    }
  } else {
    console.log('✅ Can access admin_sessions table');
  }
}

async function checkRLSPolicies() {
  console.log(`\n=== Checking RLS Policies ===`);
  
  const { data, error } = await supabaseAnon
    .from('admin_users')
    .select('id')
    .limit(1);
  
  if (error) {
    if (error.code === '42501') {
      console.error('❌ RLS Policy Issue: Permission denied');
      console.error('   The anon role cannot read admin_users table');
      console.error('   You need to add an RLS policy that allows SELECT on admin_users');
    } else {
      console.error('❌ Error:', error.message);
    }
  } else {
    console.log('✅ RLS policies allow reading admin_users');
  }
}

async function main() {
  console.log('🔍 Login Diagnostic Tool\n');
  console.log('Checking required components for login...\n');
  
  const tables = ['admin_users', 'admin_sessions'];
  const tableResults = {};
  
  for (const table of tables) {
    tableResults[table] = await checkTable(table);
  }
  
  const functions = [
    { name: 'create_admin_session', params: { p_user_id: '00000000-0000-0000-0000-000000000000', p_ip_address: null, p_user_agent: null } },
    { name: 'validate_admin_session', params: { p_token: 'test-token' } }
  ];
  
  const functionResults = {};
  for (const func of functions) {
    functionResults[func.name] = await checkRPC(func.name, func.params);
  }
  
  await checkRLSPolicies();
  await testLoginFlow();
  
  console.log('\n\n=== SUMMARY ===');
  console.log('\nRequired Tables:');
  Object.entries(tableResults).forEach(([table, exists]) => {
    console.log(`  ${exists ? '✅' : '❌'} ${table}`);
  });
  
  console.log('\nRequired RPC Functions:');
  Object.entries(functionResults).forEach(([func, exists]) => {
    console.log(`  ${exists ? '✅' : '❌'} ${func}`);
  });
  
  console.log('\n🔧 FIXES NEEDED:');
  if (!tableResults['admin_users']) {
    console.log('  - Create admin_users table');
  }
  if (!tableResults['admin_sessions']) {
    console.log('  - Create admin_sessions table');
  }
  if (!functionResults['create_admin_session']) {
    console.log('  - Create create_admin_session RPC function');
  }
  if (!functionResults['validate_admin_session']) {
    console.log('  - Create validate_admin_session RPC function');
  }
}

main().catch(console.error);