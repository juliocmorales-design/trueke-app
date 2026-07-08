import type { ComponentType } from 'react'
import OfferReceived from './notifications/OfferReceived'
import OfferAccepted from './notifications/OfferAccepted'
import OfferRejected from './notifications/OfferRejected'
import OfferCompleted from './notifications/OfferCompleted'
import RatingReceived from './notifications/RatingReceived'
import type { NotificationEmailProps } from './notifications/shared'

export type NotificationEmailType =
  | 'offer_received'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'offer_completed'
  | 'rating_received'

type NotificationEmailComponent = ComponentType<NotificationEmailProps> & {
  PreviewProps: NotificationEmailProps
}

interface NotificationEmailConfig {
  Component: NotificationEmailComponent
  /** Ruta a la que apunta el CTA. Si termina en "/", se le concatena el offerId. */
  path: string
}

export const NOTIFICATION_EMAILS: Record<NotificationEmailType, NotificationEmailConfig> = {
  offer_received:  { Component: OfferReceived,  path: '/mensajes/' },
  offer_accepted:  { Component: OfferAccepted,  path: '/mensajes/' },
  offer_rejected:  { Component: OfferRejected,  path: '/intercambios' },
  offer_completed: { Component: OfferCompleted, path: '/mensajes/' },
  rating_received: { Component: RatingReceived, path: '/perfil/resenas' },
}

export function isNotificationEmailType(type: string): type is NotificationEmailType {
  return Object.prototype.hasOwnProperty.call(NOTIFICATION_EMAILS, type)
}

const SITE_URL = 'https://www.trueke.app'

export function buildNotificationCtaUrl(type: NotificationEmailType, offerId?: number | null) {
  const { path } = NOTIFICATION_EMAILS[type]
  return `${SITE_URL}${path}${path.endsWith('/') && offerId ? offerId : ''}`
}
