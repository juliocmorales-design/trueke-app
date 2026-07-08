import { NextRequest, NextResponse } from 'next/server'
import { adminClient, requireUser } from '@/app/lib/apiAuth'
import { sendNotificationEmail } from '@/app/lib/notificationEmail'

const VALID_TYPES = [
  'offer_received', 'offer_accepted', 'offer_rejected',
  'offer_completed', 'rating_received',
]

/** El caller y el destinatario deben ser ambas partes de la oferta — evita notificar/emailear a un tercero. */
async function isOfferParticipant(offerId: number, userIds: string[]): Promise<boolean> {
  const { data: offer } = await adminClient()
    .from('offers')
    .select('from_user_id, to_user_id')
    .eq('id', offerId)
    .maybeSingle()

  if (!offer) return false
  const participants = new Set([offer.from_user_id, offer.to_user_id])
  return userIds.every((id) => participants.has(id))
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req)
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { userId, type, title, body, offerId } = await req.json()

  if (!userId || !type || !title || !body) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }
  if (title.length > 100 || body.length > 300) {
    return NextResponse.json({ error: 'Content too long' }, { status: 400 })
  }
  if (!offerId || !(await isOfferParticipant(offerId, [user.id, userId]))) {
    return NextResponse.json({ error: 'No autorizado para esta oferta' }, { status: 403 })
  }

  const { error } = await adminClient()
    .from('notifications')
    .insert({
      user_id:  userId,
      type,
      title,
      body,
      offer_id: offerId ?? null,
      is_read:  false,
    })

  if (error) {
    console.error('[notifications/create]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Envío de correo — best-effort, no bloquea la respuesta si falla
  try {
    await sendNotificationEmail({ userId, type, title, body, offerId })
  } catch (emailError) {
    console.error('[notifications/create] email error:', emailError instanceof Error ? emailError.message : emailError)
  }

  return NextResponse.json({ ok: true })
}
