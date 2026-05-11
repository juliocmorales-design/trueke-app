import type { Metadata } from 'next'
import './globals.css'
import ClientLayout from './components/layout/ClientLayout'

export const metadata: Metadata = {
  title: 'Trueke.app',
  description: 'Intercambia objetos y crea tu historia',
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
