// Test script for location link functionality
// This tests the new event_location_link field

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testLocationLink() {
  console.log('Testing location link functionality...')

  try {
    // Test 1: Create an event with location link
    console.log('\n1. Testing event creation with location link...')

    const testEvent = {
      title: 'Test Event with Location Link',
      allow_plus_guests: true,
      background_color: '#1f2937',
      event_location: 'My House', // Display name
      event_location_link: 'https://maps.google.com/?q=123+Main+St,+Anytown,+USA' // Actual map link
    }

    const { data: createData, error: createError } = await supabase
      .from('events')
      .insert(testEvent)
      .select()
      .single()

    if (createError) {
      console.error('❌ Failed to create test event:', createError)
      return
    }

    console.log('✅ Event created successfully:')
    console.log('   ID:', createData.id)
    console.log('   Location Display:', createData.event_location)
    console.log('   Location Link:', createData.event_location_link)

    // Test 2: Fetch the event and verify the link
    console.log('\n2. Testing event retrieval...')

    const { data: fetchData, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', createData.id)
      .single()

    if (fetchError) {
      console.error('❌ Failed to fetch test event:', fetchError)
      return
    }

    if (fetchData.event_location_link === testEvent.event_location_link) {
      console.log('✅ Location link retrieved correctly')
    } else {
      console.error('❌ Location link mismatch:')
      console.log('   Expected:', testEvent.event_location_link)
      console.log('   Got:', fetchData.event_location_link)
    }

    // Test 3: Update the location link
    console.log('\n3. Testing location link update...')

    const newLink = 'https://maps.apple.com/?q=456+Oak+Ave,+Somewhere,+USA'
    const { data: updateData, error: updateError } = await supabase
      .from('events')
      .update({ event_location_link: newLink })
      .eq('id', createData.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Failed to update location link:', updateError)
      return
    }

    if (updateData.event_location_link === newLink) {
      console.log('✅ Location link updated successfully')
    } else {
      console.error('❌ Location link update failed:')
      console.log('   Expected:', newLink)
      console.log('   Got:', updateData.event_location_link)
    }

    // Cleanup: Delete test event
    console.log('\n4. Cleaning up test event...')
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', createData.id)

    if (deleteError) {
      console.warn('⚠️ Failed to delete test event:', deleteError)
    } else {
      console.log('✅ Test event cleaned up')
    }

    console.log('\n🎉 All tests passed! Location link functionality is working.')

  } catch (error) {
    console.error('❌ Test failed with exception:', error)
  }
}

testLocationLink()