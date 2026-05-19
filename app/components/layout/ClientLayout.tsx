'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import BottomNav from './BottomNav'
import supabase from '@/app/lib/supabase'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const isItemPage =
    pathname.startsWith('/item') ||
    pathname.startsWith('/offer') ||
    pathname.startsWith('/mensajes/') ||
    pathname.startsWith('/exchange/') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/login')

  const hideNav =
    !isLoggedIn ||
    pathname.startsWith('/terminos') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/perfil/setup') ||
    pathname.startsWith('/auth/reset-password') ||
    isItemPage

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session?.user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user)
    })

    return () => subscription.unsubscribe()
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
