import { createClient } from '@supabase/supabase-js'
import { redirect, notFound } from 'next/navigation'
import RatingClient from './RatingClient'
import type { RatingData } from './RatingClient'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { persistSession: false } })
}

export default async function RatingPage({ params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params
  const supabase = getAdminClient()

  /* 1 — Offer */
  const { data: offer, error } = await supabase
    .from('offers')
    .select('id, from_user_id, to_user_id, from_item_id, to_item_id, status')
    .eq('id', offerId)
    .single()

  if (!offer || error) notFound()
  if (offer.status !== 'completed') redirect('/intercambios')

  /* 2 — Items: direct columns first, fallback via offer_items */
  let fromItem: RatingData['fromItem'] = null
  let toItem:   RatingData['toItem']   = null

  if (offer.from_item_id && offer.to_item_id) {
    const [{ data: fi }, { data: ti }] = await Promise.all([
      supabase.from('items').select('id, title, images').eq('id', offer.from_item_id).single(),
      supabase.from('items').select('id, title, images').eq('id', offer.to_item_id).single(),
    ])
    fromItem = fi ?? null
    toItem   = ti ?? null
  }

  if (!fromItem || !toItem) {
    const { data: rows } = await supabase
      .from('offer_items')
      .select('type, item_id, items(id, title, images)')
      .eq('offer_id', offerId)
    rows?.forEach((r: any) => {
      if (r.type === 'offered')   fromItem = r.items ?? null
      if (r.type === 'requested') toItem   = r.items ?? null
    })
  }

  /* 3 — Profiles */
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, username, avatar_url')
    .in('id', [offer.from_user_id, offer.to_user_id])

  const fromProfile = (profiles as any[])?.find(p => p.id === offer.from_user_id) ?? null
  const toProfile   = (profiles as any[])?.find(p => p.id === offer.to_user_id)   ?? null

  const data: RatingData = { offer, fromItem, toItem, fromProfile, toProfile }

  return <RatingClient offerId={offerId} data={data} />
}
