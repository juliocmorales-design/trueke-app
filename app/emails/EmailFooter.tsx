import { Hr, Link, Section, Text } from '@react-email/components'

const SITE_URL = 'https://www.trueke.app'
const YEAR = new Date().getFullYear()

export default function EmailFooter() {
  return (
    <Section style={wrap}>
      <Hr style={hr} />
      <Text style={text}>
        Trueke &middot;{' '}
        <Link href={SITE_URL} style={link}>
          trueke.app
        </Link>
      </Text>
      <Text style={text}>&copy; {YEAR} Trueke. Todos los derechos reservados.</Text>
    </Section>
  )
}

const wrap = {
  padding: '0 32px 32px',
  textAlign: 'center' as const,
}

const hr = {
  borderColor: '#F0EAE0',
  margin: '8px 0 20px',
}

const text = {
  margin: '0 0 4px',
  color: '#9CA3AF',
  fontSize: '12px',
}

const link = {
  color: '#9CA3AF',
  textDecoration: 'underline',
}
