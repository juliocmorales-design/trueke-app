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

  // 🔥 OCULTAR NAV EN FLUJOS BLOQUEADOS
  const hideNav =
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/perfil/setup') ||
    pathname.startsWith('/item') // 👈 🔥 ESTE ES EL FIX

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()

      if (data.session?.user) {
        const user = data.session.user

        // 🔥 CREAR PERFIL SI NO EXISTE
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!existing) {
          console.log('⚡ creando perfil...')

          await supabase
            .from('profiles')
            .insert({
              id: user.id,
              name: 'Usuario',
              username: `user_${Math.floor(Math.random() * 10000)}`,
            })
            .select()

          console.log('✅ perfil creado')
        }
      }
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        console.log('AUTH CHANGE:', session.user.id)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <html lang="es">
      <body style={styles.body}>
        <div style={styles.app}>
          <div style={styles.content}>{children}</div>

          {/* 🔥 SOLO SI NO ESTÁ BLOQUEADO */}
          {!hideNav && <BottomNav />}
        </div>
      </body>
    </html>
  )
}

const styles: any = {
  body: {
    margin: 0,
    background: '#cfc7bb',
    display: 'flex',
    justifyContent: 'center',
  },

  app: {
    width: '100%',
    maxWidth: 500,
    background: '#fff',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },

  content: {
    flex: 1,
    paddingBottom: 80,
  },
}