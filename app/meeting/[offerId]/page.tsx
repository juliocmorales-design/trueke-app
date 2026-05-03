import { createClient } from '@supabase/supabase-js'
import { redirect, notFound } from 'next/navigation'
import MeetingClient from './MeetingClient'
import type { MeetingData } from './MeetingClient'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { persistSession: false } })
}

export default async function MeetingPage({ params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params
  const supabase = getAdminClient()

  const { data: offer, error } = await supabase
    .from('offers')
    .select('id, from_user_id, to_user_id, from_item_id, to_item_id, status')
    .eq('id', offerId)
    .single()

  if (!offer || error) notFound()
  if (offer.status !== 'accepted') redirect('/intercambios')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, username, avatar_url')
    .in('id', [offer.from_user_id, offer.to_user_id])

  const fromProfile = (profiles as any[])?.find(p => p.id === offer.from_user_id) ?? null
  const toProfile   = (profiles as any[])?.find(p => p.id === offer.to_user_id)   ?? null

  const data: MeetingData = { offer, fromProfile, toProfile }

  return <MeetingClient offerId={offerId} data={data} />
}
