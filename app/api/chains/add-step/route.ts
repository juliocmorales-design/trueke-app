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
  try {
    const { chainId, newItemId } = await req.json()

    if (!chainId || !newItemId) {
      return NextResponse.json({ error: 'chainId y newItemId son requeridos' }, { status: 400 })
    }

    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    )
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const supabase = adminClient()

    /* Find last step_number for this chain */
    const { data: steps, error: stepsError } = await supabase
      .from('chain_steps')
      .select('step_number')
      .eq('chain_id', chainId)
      .order('step_number', { ascending: false })
      .limit(1)

    if (stepsError) {
      return NextResponse.json({ error: stepsError.message }, { status: 500 })
    }

    const lastStep = steps?.[0]?.step_number ?? 0

    /* Insert new step */
    const { error: stepError } = await supabase
      .from('chain_steps')
      .insert({
        chain_id:     chainId,
        step_number:  lastStep + 1,
        item_id:      newItemId,
        from_user_id: user.id,
      })

    if (stepError) {
      return NextResponse.json({ error: stepError.message }, { status: 500 })
    }

    /* Increment steps_count on the chain */
    const { error: updateError } = await supabase
      .from('chains')
      .update({ steps_count: lastStep + 1 })
      .eq('id', chainId)

    if (updateError) {
      console.error('[chains/add-step] steps_count update error:', updateError)
    }

    return NextResponse.json({ ok: true, chainId })

  } catch (err) {
    console.error('[chains/add-step] CRASH:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
