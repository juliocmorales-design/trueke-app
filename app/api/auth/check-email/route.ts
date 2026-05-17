import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

    const { data, error } = await adminClient().auth.admin.getUserByEmail(email.trim())

    if (error || !data?.user) {
      return NextResponse.json({ exists: false })
    }

    return NextResponse.json({ exists: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
