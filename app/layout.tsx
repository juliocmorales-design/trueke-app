import type { Metadata } from 'next'
import './globals.css'
import ClientLayout from './components/layout/ClientLayout'

export const metadata: Metadata = {
  title: 'Trueke.app — Intercambia objetos en Monterrey',
  description: 'Intercambia objetos que ya no usas por cosas que necesitas. Únete a la comunidad de trueque en Monterrey.',
  keywords: 'trueque, intercambio, objetos, Monterrey, México',
  openGraph: {
    title: 'Trueke.app — Intercambia objetos en Monterrey',
    description: 'Intercambia objetos que ya no usas por cosas que necesitas.',
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
    title: 'Trueke.app — Intercambia objetos en Monterrey',
    description: 'Intercambia objetos que ya no usas por cosas que necesitas.',
    images: ['https://www.trueke.app/images/og-image.png'],
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
