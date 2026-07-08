import { sendEmail } from './email'
import { adminClient } from './apiAuth'
import { NOTIFICATION_EMAILS, buildNotificationCtaUrl, isNotificationEmailType } from '@/app/emails/registry'

/**
 * Envía el correo asociado a una notificación in-app, si el tipo tiene plantilla
 * y el destinatario tiene un email verificado. Best-effort: no lanza si el envío falla,
 * el caller decide si loguear o ignorar (ver /api/notifications/create).
 */
export async function sendNotificationEmail({
  userId,
  type,
  title,
  body,
  offerId,
}: {
  userId: string
  type: string
  title: string
  body: string
  offerId?: number | null
}): Promise<void> {
  if (!isNotificationEmailType(type)) return

  const { data: recipient } = await adminClient().auth.admin.getUserById(userId)
  const to = recipient?.user?.email
  if (!to) return

  const { Component } = NOTIFICATION_EMAILS[type]
  const ctaUrl = buildNotificationCtaUrl(type, offerId)

  await sendEmail({
    to,
    subject: title,
    type,
    react: <Component title={title} body={body} ctaUrl={ctaUrl} />,
  })
}
