import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

export async function POST(req: NextRequest) {
  console.log('[chains/create] *** ROUTE HIT ***')
  try {
    const { offerId, receivedItemId } = await req.json()
    console.log('[chains/create] body:', { offerId, receivedItemId })

    if (!offerId || !receivedItemId) {
      return NextResponse.json({ error: 'offerId y receivedItemId son requeridos' }, { status: 400 })
    }

    /* Authenticate caller via the anon client cookie/header */
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    )
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    console.log('[chains/create] token:', token?.substring(0, 20) ?? 'null')

    const { data: { user }, error: authError } = await anonClient.auth.getUser(token)
    console.log('[chains/create] auth userId:', user?.id ?? 'null', 'authError:', authError ?? 'null')

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const supabase = adminClient()

    /* 1 — Offer */
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('id, from_user_id, to_user_id, from_item_id, to_item_id')
      .eq('id', offerId)
      .single()
    console.log('[chains/create] offer result:', offer ?? offerError)

    if (offerError || !offer) {
      return NextResponse.json({ error: offerError?.message || 'Oferta no encontrada' }, { status: 404 })
    }

    /* 2 — Determine from/to for this step from the perspective of the caller */
    const iAmFrom  = user.id === offer.from_user_id
    const fromUser = iAmFrom ? offer.from_user_id : offer.to_user_id
    const toUser   = iAmFrom ? offer.to_user_id   : offer.from_user_id

    /* 3 — INSERT chain */
    const chainPayload = {
      creator_id:       user.id,
      initial_item_id:  receivedItemId,
      goal_description: '',
      status:           'active',
      steps_count:      1,
      show_name:        false,
    }
    console.log('[chains/create] inserting chain:', chainPayload)

    const { data: chain, error: chainError } = await supabase
      .from('chains')
      .insert(chainPayload)
      .select('id')
      .single()
    console.log('[chains/create] chain result:', chain ?? chainError)

    if (chainError || !chain) {
      return NextResponse.json({ error: chainError?.message || 'No se pudo crear la cadena' }, { status: 500 })
    }

    /* 4 — INSERT first chain_step */
    const { error: stepError } = await supabase
      .from('chain_steps')
      .insert({
        chain_id:     chain.id,
        step_number:  1,
        item_id:      receivedItemId,
        from_user_id: fromUser,
        to_user_id:   toUser,
        offer_id:     offerId,
      })

    if (stepError) {
      console.error('[chains/create] chain_step insert error:', stepError)
      await supabase.from('chains').delete().eq('id', chain.id)
      return NextResponse.json({ error: stepError.message }, { status: 500 })
    }

    const chainId = chain.id
    return NextResponse.json({ chainId })

  } catch (err) {
    console.error('[chains/create] CRASH:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
