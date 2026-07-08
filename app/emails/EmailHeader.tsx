import { Img, Section } from '@react-email/components'

const SITE_URL = 'https://www.trueke.app'

export default function EmailHeader() {
  return (
    <Section style={wrap}>
      <Img
        src={`${SITE_URL}/images/logo.png`}
        alt="Trueke"
        width="110"
        style={logo}
      />
    </Section>
  )
}

const wrap = {
  textAlign: 'center' as const,
  marginBottom: '16px',
}

const logo = {
  margin: '0 auto',
}
