'use client'

import { usePathname, useRouter } from 'next/navigation'
import Icon from '../icons/Icon'
import useUnreadMessages from '@/app/hooks/useUnreadMessages'

export default function BottomNav() {
  const unread = useUnreadMessages()

  const pathname = usePathname()
  const router = useRouter()

  const isActive = (path) => pathname === path

  return (
    <div style={styles.wrapper}>
      
      <div style={styles.nav}>

        {/* INICIO */}
        <div style={styles.item} onClick={() => router.push('/')}>
          <Icon name="home" active={isActive('/')} />
          <span style={isActive('/') ? styles.labelActive : styles.label}>
            Inicio
          </span>
        </div>

        {/* INTERCAMBIOS */}
        <div style={styles.item} onClick={() => router.push('/intercambios')}>
          <Icon name="swap" active={isActive('/intercambios')} />
          <span style={isActive('/intercambios') ? styles.labelActive : styles.label}>
            Intercambios
          </span>
        </div>

        {/* ESPACIO FAB */}
        <div style={{ width: 60 }} />

        {/* MENSAJES */}
        <div style={styles.item} onClick={() => router.push('/mensajes')}>
          <div style={{ position: 'relative' }}>
            <Icon name="chat" active={isActive('/mensajes')} />

            {unread > 0 && (
              <div style={styles.badge}>
                {unread}
              </div>
            )}
          </div>

          <span style={isActive('/mensajes') ? styles.labelActive : styles.label}>
            Mensajes
          </span>
        </div>

        {/* PERFIL */}
        <div style={styles.item} onClick={() => router.push('/perfil')}>
          <Icon name="user" active={isActive('/perfil')} />
          <span style={isActive('/perfil') ? styles.labelActive : styles.label}>
            Perfil
          </span>
        </div>

      </div>

      {/* FAB */}
      <div
        style={styles.fab}
        onClick={() => router.push('/crear')}
      >
        <Icon name="add" active size={28} />
      </div>

    </div>
  )
}

const styles = {
  wrapper: {
    position: 'fixed',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 420,
    zIndex: 100,
  },

  nav: {
    height: 72,
    background: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 18px',
    borderRadius: 28,
    boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
  },

  item: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: 11,
    cursor: 'pointer',
    gap: 2,
  },

  label: {
    color: '#6F7A82',
    marginTop: 2,
  },

  labelActive: {
    color: '#F97316',
    marginTop: 2,
    fontWeight: 600,
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
    fontWeight: 'bold',
  },

  fab: {
    position: 'absolute',
    top: -30,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 60,
    height: 60,
    borderRadius: '50%',
    background: '#F97316',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
    cursor: 'pointer',
  },
}