const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsers() {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, username, email, subscription_tier, events_created_count')
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Users:', JSON.stringify(data, null, 2));
}

checkUsers();
