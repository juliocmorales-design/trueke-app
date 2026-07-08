import { Heading, Text } from '@react-email/components'
import EmailLayout from '../EmailLayout'
import { heading, text } from '../textStyles'

export interface TestEmailProps {
  title: string
  body: string
}

export default function TestEmail({ title, body }: TestEmailProps) {
  return (
    <EmailLayout preview={body} accentColor="#F97316">
      <Heading style={heading}>{title}</Heading>
      <Text style={text}>{body}</Text>
    </EmailLayout>
  )
}

TestEmail.PreviewProps = {
  title: '¡Resend está funcionando! 🎉',
  body: 'Este es un correo de prueba enviado desde trueke.app para verificar la integración con Resend.',
} satisfies TestEmailProps
