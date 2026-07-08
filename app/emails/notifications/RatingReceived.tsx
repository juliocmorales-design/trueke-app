import { Heading, Text } from '@react-email/components'
import EmailLayout from '../EmailLayout'
import EmailButton from '../EmailButton'
import { heading, text } from '../textStyles'
import type { NotificationEmailProps } from './shared'

const ACCENT = '#F59E0B'

export default function RatingReceived({ title, body, ctaUrl }: NotificationEmailProps) {
  return (
    <EmailLayout preview={body} accentColor={ACCENT}>
      <Heading style={heading}>{title}</Heading>
      <Text style={text}>{body}</Text>
      <EmailButton href={ctaUrl}>Ver mi reseña</EmailButton>
    </EmailLayout>
  )
}

RatingReceived.PreviewProps = {
  title: '¡Tienes una nueva valoración! ⭐',
  body: 'Recibiste 5 estrellas en tu último intercambio',
  ctaUrl: 'https://www.trueke.app/perfil/resenas',
} satisfies NotificationEmailProps
