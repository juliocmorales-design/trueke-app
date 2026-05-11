'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Icon from '../icons/Icon'
import useUnreadMessages from '@/app/hooks/useUnreadMessages'

export default function BottomNav() {
  const unread  = useUnreadMessages()
  const pathname = usePathname()
  const router   = useRouter()

  const [visible,    setVisible]    = useState(true)
  const [lastScroll, setLastScroll] = useState(0)

  const isActive = (path: string) => pathname === path

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY
      setVisible(current <= lastScroll || current <= 50)
      setLastScroll(current)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScroll])

  const go = (path: string) => {
    if (navigator.vibrate) navigator.vibrate(10)
    router.push(path)
  }

  return (
    <div
      id="bottom-nav"
      style={{
        ...styles.wrapper,
        transform: visible ? 'translateX(-50%)' : 'translateX(-50%) translateY(100%)',
      }}
    >
      <div style={styles.nav}>

        <NavItem
          label="Inicio"
          active={isActive('/')}
          onClick={() => go('/')}
          icon={<Icon name="home" active={isActive('/')} />}
        />

        <NavItem
          label="Intercambios"
          active={isActive('/intercambios')}
          onClick={() => go('/intercambios')}
          icon={<Icon name="swap" active={isActive('/intercambios')} size={24} />}
        />

        <div style={styles.centerItem} onClick={() => go('/crear')}>
          <div style={styles.centerButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <span style={styles.label}>Publicar</span>
        </div>

        <NavItem
          label="Mensajes"
          active={isActive('/mensajes')}
          onClick={() => go('/mensajes')}
          icon={
            <div style={{ position: 'relative' }}>
              <Icon name="chat" active={isActive('/mensajes')} />
              {unread > 0 && <div style={styles.badge}>{unread}</div>}
            </div>
          }
        />

        <NavItem
          label="Perfil"
          active={isActive('/perfil')}
          onClick={() => go('/perfil')}
          icon={<Icon name="user" active={isActive('/perfil')} />}
        />

      </div>
    </div>
  )
}

function NavItem({ icon, label, active, onClick }: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <div style={styles.item} onClick={onClick}>
      <div style={styles.iconWrap}>{icon}</div>
      <span style={active ? styles.labelActive : styles.label}>{label}</span>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    width: '100%',
    maxWidth: 500,
    zIndex: 100,
    transition: 'transform 0.3s ease',
  },

  nav: {
    width: '100%',
    height: 'calc(68px + env(safe-area-inset-bottom))',
    display: 'flex',
    alignItems: 'center',
    padding: '0 18px',
    paddingBottom: 'env(safe-area-inset-bottom)',
    background: '#FFFFFF',
    boxShadow: '0 -1px 8px rgba(0,0,0,0.08)',
    boxSizing: 'border-box',
  },

  item: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    cursor: 'pointer',
  },

  iconWrap: {
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  centerItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    cursor: 'pointer',
  },

  centerButton: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: '#F97316',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  label: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: 400,
  },

  labelActive: {
    color: '#F97316',
    fontWeight: 600,
    fontSize: 11,
  },

  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    background: '#ef4444',
    color: '#fff',
    borderRadius: 999,
    padding: '2px 6px',
    fontSize: 10,
  },
}
