import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/uploads/logo
// Accepts multipart/form-data with field "file"
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
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Basic validations
    const allowedMime = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
    if (!allowedMime.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type. Use png, jpg, jpeg, webp, or svg.' }, { status: 400 })
    }
    const maxBytes = 2 * 1024 * 1024 // 2MB
    if (file.size > maxBytes) {
      return NextResponse.json({ error: 'File too large. Max 2MB.' }, { status: 400 })
    }

    // Create unique path
    const ext = file.type === 'image/png' ? 'png'
      : file.type === 'image/jpeg' ? 'jpg'
      : file.type === 'image/webp' ? 'webp'
      : 'svg'
    const fileName = `${crypto.randomUUID()}.${ext}`
    const path = `logos/${fileName}`

    // Upload
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabaseAdmin.storage.from('assets').upload(path, new Uint8Array(arrayBuffer), {
      contentType: file.type,
      upsert: false
    })
    if (uploadError) {
      console.error('Upload error', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Make public URL
    const { data: publicData } = supabaseAdmin.storage.from('assets').getPublicUrl(path)
    if (!publicData?.publicUrl) {
      return NextResponse.json({ error: 'Failed to get public URL' }, { status: 500 })
    }

    return NextResponse.json({ url: publicData.publicUrl })
  } catch (err) {
    console.error('Error in logo upload', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


