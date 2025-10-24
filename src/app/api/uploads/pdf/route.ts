import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/uploads/pdf
// Accepts multipart/form-data with field "file" and optional "eventId"
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Storage not configured. Missing Supabase env.' }, { status: 500 })
    }

    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const eventId = formData.get('eventId') as string | null
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Basic validations
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }
    
    const maxBytes = 5 * 1024 * 1024 // 5MB
    if (file.size > maxBytes) {
      return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 })
    }

    // Create unique path
    const fileName = `${crypto.randomUUID()}.pdf`
    // If eventId is provided, store it in a folder with that ID
    const path = eventId 
      ? `pdfs/${eventId}/${fileName}`
      : `pdfs/${fileName}`

    // Upload
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabaseAdmin.storage.from('assets').upload(path, new Uint8Array(arrayBuffer), {
      contentType: 'application/pdf',
      upsert: false
    })
    
    if (uploadError) {
      console.error('Upload error', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload file',
        details: uploadError.message || uploadError.name || 'Unknown storage error'
      }, { status: 500 })
    }

    // Make public URL
    const { data: publicData } = supabaseAdmin.storage.from('assets').getPublicUrl(path)
    if (!publicData?.publicUrl) {
      return NextResponse.json({ error: 'Failed to get public URL', details: 'getPublicUrl returned empty' }, { status: 500 })
    }

    // If eventId is provided, store the PDF URL in the events table
    if (eventId) {
      const { error: updateError } = await supabaseAdmin
        .from('events')
        .update({ info_pdf_url: publicData.publicUrl })
        .eq('id', eventId)
      
      if (updateError) {
        console.error('Error updating event with PDF URL', updateError)
        // We'll still return success since the file was uploaded
      }
    }

    return NextResponse.json({ url: publicData.publicUrl })
  } catch (err) {
    console.error('Error in PDF upload', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
