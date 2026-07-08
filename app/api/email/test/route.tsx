import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/app/lib/apiAuth'
import { sendEmail } from '@/app/lib/email'
import { NOTIFICATION_EMAILS, isNotificationEmailType } from '@/app/emails/registry'
import TestEmail from '@/app/emails/notifications/TestEmail'

function buildTestPayload(type: string) {
  if (isNotificationEmailType(type)) {
    const { Component } = NOTIFICATION_EMAILS[type]
    return {
      subject: `[Prueba] ${Component.PreviewProps.title}`,
      react: <Component {...Component.PreviewProps} />,
    }
  }
  return {
    subject: '[Prueba] Correo de prueba de Trueke',
    react: <TestEmail {...TestEmail.PreviewProps} />,
  }
}

/**
 * Envía un correo de prueba al propio usuario autenticado.
 * ?type=offer_received|offer_accepted|offer_rejected|offer_completed|rating_received
 * Sin `type` (o con un valor desconocido) envía el correo genérico de conectividad.
 *
 * Restringido a la propia cuenta para evitar que se use como relay de spam.
 * Cada llamada es una acción deliberada del usuario, no un reintento de la misma
 * operación — por eso usa una idempotencyKey aleatoria en vez de la derivada automáticamente.
 */
export async function POST(req: NextRequest) {
  const user = await requireUser(req)
  if (!user?.email) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const type = req.nextUrl.searchParams.get('type') ?? 'generic'
  const { subject, react } = buildTestPayload(type)

  const result = await sendEmail({
    to: user.email,
    subject,
    react,
    type: `test:${type}`,
    idempotencyKey: randomUUID(),
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? 'send_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, messageId: result.messageId })
}
