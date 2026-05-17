import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    console.log('Using URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30))
    console.log('Has service key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

    const { id, username, name, city, interests } = await req.json()

    if (!id || !username) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: existing } = await adminClient()
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'USERNAME_TAKEN' }, { status: 409 })
    }

    const { error } = await adminClient()
      .from('profiles')
      .upsert({ id, username, name, city, interests })

    if (error) {
      console.error('Upsert error:', JSON.stringify(error))
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
