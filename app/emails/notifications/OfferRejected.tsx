import { Heading, Text } from '@react-email/components'
import EmailLayout from '../EmailLayout'
import EmailButton from '../EmailButton'
import { heading, text } from '../textStyles'
import type { NotificationEmailProps } from './shared'

const ACCENT = '#DC2626'

export default function OfferRejected({ title, body, ctaUrl }: NotificationEmailProps) {
  return (
    <EmailLayout preview={body} accentColor={ACCENT}>
      <Heading style={heading}>{title}</Heading>
      <Text style={text}>{body}</Text>
      <EmailButton href={ctaUrl}>Ver mis intercambios</EmailButton>
    </EmailLayout>
  )
}

OfferRejected.PreviewProps = {
  title: 'Tu oferta fue rechazada',
  body: 'El usuario decidió no continuar con este intercambio',
  ctaUrl: 'https://www.trueke.app/intercambios',
} satisfies NotificationEmailProps
