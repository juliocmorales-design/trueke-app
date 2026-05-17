'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import BottomNav from './BottomNav'
import supabase from '@/app/lib/supabase'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isItemPage =
    pathname.startsWith('/item') ||
    pathname.startsWith('/offer') ||
    pathname.startsWith('/mensajes/') ||
    pathname.startsWith('/exchange/') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/login')

  const hideNav =
    pathname.startsWith('/terminos') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/perfil/setup') ||
    isItemPage

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

  }, [])

  return (
    <div style={styles.app}>
      <div style={isItemPage ? styles.full : styles.centered}>
        {children}
      </div>
      {!hideNav && (
        <div style={styles.navWrapper}>
          <BottomNav />
        </div>
      )}
    </div>
  )
}

const styles: any = {
  app: {
    width: '100%',
    maxWidth: 500,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#FDF8F3',
  },

  centered: {
    flex: 1,
    padding: 16,
    paddingBottom: 100,
  },

  full: {
    flex: 1,
    background: '#FDF8F3',
  },

  navWrapper: {
    position: 'sticky',
    bottom: 0,
    padding: '10px 16px',
    background: 'transparent',
  },
}
