'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import BottomNav from './BottomNav'
import DesktopSidebar from './DesktopSidebar'
import supabase from '@/app/lib/supabase'
import { useIsDesktop } from '@/app/hooks/useIsDesktop'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const isDesktop = useIsDesktop()

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

  const showNav = !hideNav

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session?.user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setIsLoggedIn(false)
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('trueke_feed_cache')) {
              localStorage.removeItem(key)
            }
          })
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setIsLoggedIn(!!session?.user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {isDesktop === true && isLoggedIn && <DesktopSidebar />}
      <main style={{
        flex: 1,
        width: 0,
        marginLeft: isDesktop === true && isLoggedIn ? 240 : 0,
        minHeight: '100vh',
      }}>
        {isDesktop === true ? (
          children
        ) : (
          <div style={isItemPage ? styles.full : styles.centered}>
            {children}
          </div>
        )}
        {isDesktop === false && showNav && (
          <div style={styles.navWrapper}>
            <BottomNav />
          </div>
        )}
      </main>
    </div>
  )
}

const styles: any = {
  centered: {
    flex: 1,
    padding: 16,
    paddingBottom: 100,
    background: '#FDF8F3',
    minHeight: '100vh',
  },

  full: {
    flex: 1,
    background: '#FDF8F3',
  },

  navWrapper: {
    position: 'sticky',
    bottom: 0,
    zIndex: 10,
    padding: '10px 16px',
    background: 'transparent',
  },
}
