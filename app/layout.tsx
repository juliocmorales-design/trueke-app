'use client'

import './globals.css'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import BottomNav from './components/layout/BottomNav'
import supabase from './lib/supabase'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isItemPage =
    pathname.startsWith('/item') ||
    pathname.startsWith('/offer') ||
    pathname.startsWith('/mensajes/') ||
    pathname.startsWith('/exchange/')

  const hideNav =
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/perfil/setup') ||
    isItemPage ||
    pathname.startsWith('/offer') ||
    pathname.startsWith('/mensajes/')

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()

      if (data.session?.user) {
        const user = data.session.user

        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!existing) {
          await supabase
            .from('profiles')
            .insert({
              id: user.id,
              name: 'Usuario',
              username: `user_${Math.floor(Math.random() * 10000)}`,
            })
            .select()
        }
      }
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {})

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <html lang="es">
      <body style={styles.body}>

        {/* 🔥 CONTENEDOR GLOBAL CENTRADO */}
        <div style={styles.app}>

          {/* 🔥 CONTENIDO */}
          <div style={isItemPage ? styles.full : styles.centered}>
            {children}
          </div>

          {/* 🔥 NAVBAR DENTRO DEL MISMO CONTENEDOR */}
          {!hideNav && (
            <div style={styles.navWrapper}>
              <BottomNav />
            </div>
          )}

        </div>

      </body>
    </html>
  )
}

const styles: any = {
  body: {
    margin: 0,
    background: '#FDF8F3',
    display: 'flex',
    justifyContent: 'center',
  },

  // 🔥 CONTENEDOR PRINCIPAL (ESTILO APP)
  app: {
    width: '100%',
    maxWidth: 500,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#FDF8F3',
  },

  // 🔥 CONTENIDO NORMAL
  centered: {
    flex: 1,
    padding: 16,
    paddingBottom: 100, // espacio para navbar
  },

  // 🔥 PANTALLA ITEM FULL
  full: {
    flex: 1,
    background: '#FDF8F3',
  },

  // 🔥 NAVBAR FIJO ABAJO PERO DENTRO DEL WIDTH
  navWrapper: {
    position: 'sticky',
    bottom: 0,
    padding: '10px 16px',
    background: 'transparent',
  },
}