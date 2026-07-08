import { Button } from '@react-email/components'
import type { ReactNode } from 'react'

export default function EmailButton({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <Button href={href} style={button}>
      {children}
    </Button>
  )
}

const button = {
  display: 'inline-block',
  marginTop: '24px',
  padding: '14px 28px',
  background: '#F97316',
  color: '#FFFFFF',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '15px',
  borderRadius: '12px',
}
