import { NextRequest, NextResponse } from 'next/server'
import { adminClient, requireUser } from '@/app/lib/apiAuth'

export async function POST(req: NextRequest) {
  try {
    const { offerId, receivedItemId } = await req.json()

    if (!receivedItemId) {
      return NextResponse.json({ error: 'receivedItemId es requerido' }, { status: 400 })
    }

    const user = await requireUser(req)
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const supabase = adminClient()

    /* 1 — Offer (optional) */
    let fromUser = user.id
    let toUser: string | null = null

    if (offerId) {
      const { data: offer, error: offerError } = await supabase
        .from('offers')
        .select('id, from_user_id, to_user_id')
        .eq('id', offerId)
        .single()

      if (offerError || !offer) {
        return NextResponse.json({ error: offerError?.message || 'Oferta no encontrada' }, { status: 404 })
      }

      const iAmFrom = user.id === offer.from_user_id
      const iAmTo   = user.id === offer.to_user_id

      if (!iAmFrom && !iAmTo) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }

      fromUser = iAmFrom ? offer.from_user_id : offer.to_user_id
      toUser   = iAmFrom ? offer.to_user_id   : offer.from_user_id
    }

    /* 2 — INSERT chain */
    const chainPayload = {
      creator_id:       user.id,
      initial_item_id:  receivedItemId,
      goal_description: '',
      status:           'active',
      steps_count:      1,
      show_name:        false,
    }
    const { data: chain, error: chainError } = await supabase
      .from('chains')
      .insert(chainPayload)
      .select('id')
      .single()

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
        ...(toUser   ? { to_user_id: toUser }   : {}),
        ...(offerId  ? { offer_id:   offerId }   : {}),
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
