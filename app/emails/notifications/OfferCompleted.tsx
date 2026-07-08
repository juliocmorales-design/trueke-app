import { Heading, Text } from '@react-email/components'
import EmailLayout from '../EmailLayout'
import EmailButton from '../EmailButton'
import { heading, text } from '../textStyles'
import type { NotificationEmailProps } from './shared'

const ACCENT = '#2563EB'

export default function OfferCompleted({ title, body, ctaUrl }: NotificationEmailProps) {
  return (
    <EmailLayout preview={body} accentColor={ACCENT}>
      <Heading style={heading}>{title}</Heading>
      <Text style={text}>{body}</Text>
      <EmailButton href={ctaUrl}>Ver intercambio</EmailButton>
    </EmailLayout>
  )
}

OfferCompleted.PreviewProps = {
  title: 'Intercambio completado 🎉',
  body: 'Tu intercambio se completó con éxito. ¡No olvides calificar!',
  ctaUrl: 'https://www.trueke.app/mensajes/123',
} satisfies NotificationEmailProps
