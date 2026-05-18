import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

export async function POST(req: NextRequest) {
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  )
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { userId, type, title, body, offerId } = await req.json()

  const VALID_TYPES = [
    'offer_received', 'offer_accepted', 'offer_rejected',
    'offer_completed', 'rating_received',
  ]

  if (!userId || !type || !title || !body) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }
  if (title.length > 100 || body.length > 300) {
    return NextResponse.json({ error: 'Content too long' }, { status: 400 })
  }

  const { error } = await adminClient()
    .from('notifications')
    .insert({
      user_id:  userId,
      type,
      title,
      body,
      offer_id: offerId ?? null,
      is_read:  false,
    })

  if (error) {
    console.error('[notifications/create]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
