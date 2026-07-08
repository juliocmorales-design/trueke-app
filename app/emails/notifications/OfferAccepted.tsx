import { Heading, Text } from '@react-email/components'
import EmailLayout from '../EmailLayout'
import EmailButton from '../EmailButton'
import { heading, text } from '../textStyles'
import type { NotificationEmailProps } from './shared'

const ACCENT = '#16A34A'

export default function OfferAccepted({ title, body, ctaUrl }: NotificationEmailProps) {
  return (
    <EmailLayout preview={body} accentColor={ACCENT}>
      <Heading style={heading}>{title}</Heading>
      <Text style={text}>{body}</Text>
      <EmailButton href={ctaUrl}>Ver intercambio</EmailButton>
    </EmailLayout>
  )
}

OfferAccepted.PreviewProps = {
  title: 'Tu oferta fue aceptada 🎉',
  body: 'Cámara Sony está lista para el intercambio',
  ctaUrl: 'https://www.trueke.app/mensajes/123',
} satisfies NotificationEmailProps
