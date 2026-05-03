import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

export async function createNotification({
  user_id,
  type,
  title,
  body,
  offer_id = null,
}: {
  user_id: string
  type: string
  title: string
  body: string
  offer_id?: number | null
}) {
  const supabase = adminClient()
  const { error } = await supabase.from('notifications').insert({
    user_id,
    type,
    title,
    body,
    offer_id,
    is_read: false,
  })
  if (error) console.error('[createNotification] error:', error)
  return error
}
