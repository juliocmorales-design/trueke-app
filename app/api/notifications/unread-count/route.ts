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
  try {
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    const { data: { user } } = await adminClient().auth.getUser(token)
    const userId = user?.id

    console.log('[notif-count] userId:', userId)
    if (!userId) return NextResponse.json({ count: 0 })

    const { count, error } = await adminClient()
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    console.log('[notif-count] count:', count)
    console.log('[notif-count] error:', error)

    return NextResponse.json({ count: count ?? 0 })
  } catch (err) {
    console.error('[notifications/unread-count]', err)
    return NextResponse.json({ count: 0 })
  }
}
