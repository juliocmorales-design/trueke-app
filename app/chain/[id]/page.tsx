import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import ChainClient from './ChainClient'
import type { ChainData } from './ChainClient'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { persistSession: false } })
}

export default async function ChainPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getAdminClient()

  /* 1 — Chain */
  const { data: chain, error } = await supabase
    .from('chains')
    .select('id, creator_id, initial_item_id, status, steps_count, created_at')
    .eq('id', id)
    .single()

  if (!chain || error) notFound()

  /* 2 — Steps ordered */
  const { data: steps } = await supabase
    .from('chain_steps')
    .select('id, chain_id, step_number, item_id, from_user_id, to_user_id, offer_id, created_at')
    .eq('chain_id', id)
    .order('step_number', { ascending: true })

  const stepsData = steps ?? []

  /* 3 — Items for each step + initial item */
  const itemIds = Array.from(
    new Set(
      [chain.initial_item_id, ...stepsData.map((s: any) => s.item_id)].filter(Boolean)
    )
  ) as number[]

  const { data: itemRows } = await supabase
    .from('items')
    .select('id, title, images')
    .in('id', itemIds)

  const itemMap: Record<number, { id: number; title: string; images: string[] | null }> = {}
  itemRows?.forEach((item: any) => { itemMap[item.id] = item })

  const data: ChainData = { chain, steps: stepsData, itemMap }

  return <ChainClient data={data} />
}
