import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import ExchangeClient from './ExchangeClient'
import type { ExchangeData } from './ExchangeClient'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { persistSession: false } })
}

export default async function ExchangeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id: offerId } = await params
  const supabase = getAdminClient()

  /* 1 — Offer */
  const { data: offer, error: offerErr } = await supabase
    .from('offers')
    .select('id, from_user_id, to_user_id, from_item_id, to_item_id, status, created_at, meeting_point')
    .eq('id', offerId)
    .single()

  console.log('[exchange] offer:', JSON.stringify(offer), 'err:', offerErr?.message)

  if (!offer || (offerErr as any)?.code === 'PGRST116') notFound()
  if (offerErr) {
    return (
      <ExchangeClient
        offerId={offerId}
        data={null}
        errorMsg={(offerErr as any).message ?? 'Error al cargar'}
      />
    )
  }

  /* 2 — Items: from_item_id / to_item_id first, fallback via offer_items */
  let offeredItem: ExchangeData['offeredItem'] = null
  let requestedItem: ExchangeData['requestedItem'] = null

  if (offer.from_item_id && offer.to_item_id) {
    const [{ data: fi }, { data: ti }] = await Promise.all([
      supabase.from('items').select('id, title, images, user_id').eq('id', offer.from_item_id).single(),
      supabase.from('items').select('id, title, images, user_id').eq('id', offer.to_item_id).single(),
    ])
    console.log('[exchange] fromItem:', JSON.stringify(fi), 'toItem:', JSON.stringify(ti))
    offeredItem   = fi ?? null
    requestedItem = ti ?? null
  }

  if (!offeredItem || !requestedItem) {
    const { data: rows } = await supabase
      .from('offer_items')
      .select('type, item_id')
      .eq('offer_id', offerId)
    console.log('[exchange] offer_items fallback:', JSON.stringify(rows))

    if (rows?.length) {
      const offRow = rows.find((r: any) => r.type === 'offered')
      const reqRow = rows.find((r: any) => r.type === 'requested')
      const [a, b] = await Promise.all([
        offRow ? supabase.from('items').select('id, title, images, user_id').eq('id', offRow.item_id).single() : Promise.resolve({ data: null }),
        reqRow ? supabase.from('items').select('id, title, images, user_id').eq('id', reqRow.item_id).single() : Promise.resolve({ data: null }),
      ])
      if (!offeredItem)   offeredItem   = a.data ?? null
      if (!requestedItem) requestedItem = b.data ?? null
    }
  }

  /* 3 — Profiles */
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, username, avatar_url')
    .in('id', [offer.from_user_id, offer.to_user_id])

  const fromProfile = (profiles as any[])?.find(p => p.id === offer.from_user_id) ?? null
  const toProfile   = (profiles as any[])?.find(p => p.id === offer.to_user_id)   ?? null

  /* 4 — Trust scores */
  const [{ count: fc }, { count: tc }] = await Promise.all([
    supabase.from('items').select('id', { count: 'exact', head: true }).eq('user_id', offer.from_user_id),
    supabase.from('items').select('id', { count: 'exact', head: true }).eq('user_id', offer.to_user_id),
  ])

  /* 5 — Chain step (if this offer is part of a chain) */
  const { data: chainStep } = await supabase
    .from('chain_steps')
    .select('chain_id')
    .eq('offer_id', offerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const data: ExchangeData = {
    offer,
    offeredItem,
    requestedItem,
    fromProfile,
    toProfile,
    fromScore: Math.min(100, (fc ?? 0) * 4 + 60),
    toScore:   Math.min(100, (tc ?? 0) * 4 + 60),
  }

  return (
    <ExchangeClient
      offerId={offerId}
      data={data}
      isChain={!!chainStep}
      chainId={chainStep?.chain_id ?? null}
    />
  )
}