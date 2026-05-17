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
    if (!email) return NextResponse.json({ exists: false })

    const { data, error } = await adminClient()
      .rpc('check_email_exists', { email_to_check: email.trim().toLowerCase() })

    if (error) {
      const { data: users } = await adminClient().auth.admin.listUsers()
      const exists = users?.users?.some(
        u => u.email?.toLowerCase() === email.trim().toLowerCase()
      ) ?? false
      return NextResponse.json({ exists })
    }

    return NextResponse.json({ exists: !!data })
  } catch {
    return NextResponse.json({ exists: false })
  }
}
