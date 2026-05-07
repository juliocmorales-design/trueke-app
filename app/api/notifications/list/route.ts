import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

export async function GET(req: NextRequest) {
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  const { data: { user }, error: authError } = await adminClient().auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await adminClient()
    .from('notifications')
    .select('id, type, title, body, offer_id, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  const { data: { user }, error: authError } = await adminClient().auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ids } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ ok: true })

  await adminClient()
    .from('notifications')
    .update({ is_read: true })
    .in('id', ids)
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
