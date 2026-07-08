import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
} from '@react-email/components'
import type { ReactNode } from 'react'
import EmailHeader from './EmailHeader'
import EmailFooter from './EmailFooter'

export default function EmailLayout({
  preview,
  accentColor = '#F97316',
  children,
}: {
  preview: string
  accentColor?: string
  children: ReactNode
}) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={{ ...accentBar, background: accentColor }} />
          <Section style={content}>
            <EmailHeader />
            {children}
          </Section>
          <EmailFooter />
        </Container>
      </Body>
    </Html>
  )
}

const body = {
  margin: 0,
  padding: '32px 16px',
  background: '#FDF8F3',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
}

const container = {
  maxWidth: '480px',
  margin: '0 auto',
  background: '#FFFFFF',
  borderRadius: '16px',
  overflow: 'hidden',
}

const accentBar = {
  height: '6px',
  margin: 0,
}

const content = {
  padding: '32px',
}
