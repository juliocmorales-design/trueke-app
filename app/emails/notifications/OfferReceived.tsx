import { Heading, Text } from '@react-email/components'
import EmailLayout from '../EmailLayout'
import EmailButton from '../EmailButton'
import { heading, text } from '../textStyles'
import type { NotificationEmailProps } from './shared'

const ACCENT = '#F97316'

export default function OfferReceived({ title, body, ctaUrl }: NotificationEmailProps) {
  return (
    <EmailLayout preview={body} accentColor={ACCENT}>
      <Heading style={heading}>{title}</Heading>
      <Text style={text}>{body}</Text>
      <EmailButton href={ctaUrl}>Ver oferta</EmailButton>
    </EmailLayout>
  )
}

OfferReceived.PreviewProps = {
  title: 'Nueva oferta de intercambio',
  body: 'Alguien quiere intercambiar algo contigo',
  ctaUrl: 'https://www.trueke.app/mensajes/123',
} satisfies NotificationEmailProps
