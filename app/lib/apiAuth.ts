import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'

/** Cliente con SERVICE_ROLE_KEY — bypasea RLS. Solo para uso en rutas API. */
export function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

/** Resuelve el usuario autenticado a partir del Bearer token, o `null` si no es válido. */
export async function requireUser(req: NextRequest): Promise<User | null> {
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  if (!token) return null

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  )
  const { data: { user }, error } = await anonClient.auth.getUser(token)
  return error ? null : user
}
