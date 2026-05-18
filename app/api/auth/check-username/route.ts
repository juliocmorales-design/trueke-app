import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json()
    if (!username) return NextResponse.json({ taken: false })

    const { data } = await adminClient()
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .maybeSingle()

    return NextResponse.json({ taken: !!data })
  } catch {
    return NextResponse.json({ taken: false })
  }
}
