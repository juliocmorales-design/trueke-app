import type { Metadata } from 'next'
import './globals.css'
import ClientLayout from './components/layout/ClientLayout'

const TITLE = 'De lo que tienes a lo que quieres — Trueke'
const DESCRIPTION = 'Publica lo que tienes e intercambia con personas cerca de ti. Consigue lo que quieres sin gastar dinero. Trueque en México.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: 'trueque, intercambio, objetos, Monterrey, México',
  alternates: {
    canonical: 'https://www.trueke.app',
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://www.trueke.app',
    siteName: 'Trueke.app',
    images: [
      {
        url: 'https://www.trueke.app/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Trueke.app',
      },
    ],
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['https://www.trueke.app/images/og-image.png'],
  },
  icons: {
    apple: '/images/logo.png',
  },
  metadataBase: new URL('https://www.trueke.app'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/images/logo.png" type="image/png" />
      </head>
      <body style={{ margin: 0, background: '#FDF8F3', display: 'flex', justifyContent: 'center' }}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
