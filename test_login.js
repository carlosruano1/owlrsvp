const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load .env
const envPaths = [
  path.join(__dirname, '.env.local'),
  path.join(__dirname, '.env')
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testLogin() {
  console.log('🔍 Testing Login Process\n');
  
  // Step 1: List all users
  console.log('1. Fetching all users...');
  const { data: allUsers, error: listError } = await supabase
    .from('admin_users')
    .select('id, username, email, is_active, email_verified, password_hash')
    .limit(10);
  
  if (listError) {
    console.error('❌ Error listing users:', listError);
    return;
  }
  
  if (!allUsers || allUsers.length === 0) {
    console.log('⚠️  No users found in database');
    return;
  }
  
  console.log(`✅ Found ${allUsers.length} user(s):`);
  allUsers.forEach((u, i) => {
    console.log(`   ${i + 1}. ${u.username} (${u.email}) - Active: ${u.is_active}, Verified: ${u.email_verified}`);
  });
  
  // Step 2: Test query with username
  const testUser = allUsers[0];
  console.log(`\n2. Testing query for user: ${testUser.username}`);
  
  const { data: userByUsername, error: usernameError } = await supabase
    .from('admin_users')
    .select('*')
    .or(`username.eq."${testUser.username}",email.eq."${testUser.username}"`)
    .eq('is_active', true)
    .single();
  
  if (usernameError) {
    console.error('❌ Query by username failed:', usernameError);
    console.error('   Code:', usernameError.code);
    console.error('   Message:', usernameError.message);
  } else {
    console.log('✅ Query by username succeeded');
    console.log('   User found:', userByUsername.username, userByUsername.email);
  }
  
  // Step 3: Test query with email
  console.log(`\n3. Testing query for email: ${testUser.email}`);
  
  const { data: userByEmail, error: emailError } = await supabase
    .from('admin_users')
    .select('*')
    .or(`username.eq."${testUser.email}",email.eq."${testUser.email}"`)
    .eq('is_active', true)
    .single();
  
  if (emailError) {
    console.error('❌ Query by email failed:', emailError);
    console.error('   Code:', emailError.code);
    console.error('   Message:', emailError.message);
  } else {
    console.log('✅ Query by email succeeded');
    console.log('   User found:', userByEmail.username, userByEmail.email);
  }
  
  // Step 4: Check password hash
  console.log(`\n4. Checking password hash...`);
  if (testUser.password_hash) {
    console.log('✅ Password hash exists');
    console.log('   Hash length:', testUser.password_hash.length);
    console.log('   Hash starts with:', testUser.password_hash.substring(0, 10) + '...');
    console.log('   Hash format:', testUser.password_hash.startsWith('$2') ? 'bcrypt' : 'unknown');
  } else {
    console.error('❌ No password hash found!');
  }
  
  // Step 5: Test password verification (you'll need to provide a test password)
  console.log(`\n5. To test password verification, run:`);
  console.log(`   node -e "const bcrypt=require('bcryptjs');bcrypt.compare('YOUR_PASSWORD', '${testUser.password_hash?.substring(0, 20)}...').then(console.log)"`);
  
  // Step 6: Test create_admin_session RPC
  console.log(`\n6. Testing create_admin_session RPC...`);
  const { data: sessionToken, error: sessionError } = await supabase
    .rpc('create_admin_session', {
      p_user_id: testUser.id,
      p_ip_address: '127.0.0.1',
      p_user_agent: 'test'
    });
  
  if (sessionError) {
    console.error('❌ create_admin_session failed:', sessionError);
    console.error('   Code:', sessionError.code);
    console.error('   Message:', sessionError.message);
  } else {
    console.log('✅ create_admin_session succeeded');
    console.log('   Session token:', sessionToken ? 'Generated' : 'NULL');
  }
  
  // Step 7: Check RLS policies
  console.log(`\n7. Testing with anon key (simulates what the app does)...`);
  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  const { data: anonUser, error: anonError } = await supabaseAnon
    .from('admin_users')
    .select('id, username, email')
    .or(`username.eq."${testUser.username}",email.eq."${testUser.username}"`)
    .eq('is_active', true)
    .single();
  
  if (anonError) {
    if (anonError.code === '42501') {
      console.error('❌ RLS Policy blocking access!');
      console.error('   The anon role cannot read admin_users');
      console.error('   You need to add an RLS policy or disable RLS on admin_users');
    } else {
      console.error('❌ Anon query failed:', anonError);
    }
  } else {
    console.log('✅ Anon query succeeded (RLS allows access)');
  }
}

testLogin().catch(console.error);
