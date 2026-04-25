'use client'

import { usePathname, useRouter } from 'next/navigation'
import Icon from '../icons/Icon'
import useUnreadMessages from '@/app/hooks/useUnreadMessages'

export default function BottomNav() {
  const unread = useUnreadMessages()

  const pathname = usePathname()
  const router = useRouter()

  const isActive = (path) => pathname === path

  const isCreate = isActive('/crear')

  return (
    <div style={styles.wrapper}>
      <div style={styles.nav}>

        <NavItem
          label="Inicio"
          active={isActive('/')}
          onClick={() => router.push('/')}
          icon={<Icon name="home" active={isActive('/')} />}
        />

        <NavItem
          label="Intercambios"
          active={isActive('/intercambios')}
          onClick={() => router.push('/intercambios')}
          icon={<Icon name="swap" active={isActive('/intercambios')} />}
        />

        {/* ✅ BOTÓN CENTRAL CORREGIDO */}
        <div style={styles.centerItem} onClick={() => router.push('/crear')}>
          <div
            style={{
              ...styles.centerButton,
              ...(isCreate ? styles.centerButtonActive : {}),
            }}
          >
            <Icon name="add" active={isCreate} size={20} />
          </div>

          <span style={isCreate ? styles.labelActive : styles.label}>
            Publicar
          </span>
        </div>

        <NavItem
          label="Mensajes"
          active={isActive('/mensajes')}
          onClick={() => router.push('/mensajes')}
          icon={
            <div style={{ position: 'relative' }}>
              <Icon name="chat" active={isActive('/mensajes')} />
              {unread > 0 && (
                <div style={styles.badge}>{unread}</div>
              )}
            </div>
          }
        />

        <NavItem
          label="Perfil"
          active={isActive('/perfil')}
          onClick={() => router.push('/perfil')}
          icon={<Icon name="user" active={isActive('/perfil')} />}
        />

      </div>
    </div>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <div style={styles.item} onClick={onClick}>
      {icon}
      <span style={active ? styles.labelActive : styles.label}>
        {label}
      </span>
    </div>
  )
}

const styles = {
  wrapper: {
    position: 'fixed',
    bottom: 12,
    left: 0,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    zIndex: 100,
  },

  nav: {
    width: '100%',
    maxWidth: 500,
    height: 70,
    background: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
    borderRadius: 30,
    boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
  },

  item: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: 11,
    cursor: 'pointer',
    gap: 2,
    flex: 1,
  },

  /* 🔥 BOTÓN CENTRAL AJUSTADO */
  centerItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    flex: 1,
  },

  centerButton: {
    width: 36,            // ⬅️ antes 44 (muy grande)
    height: 36,
    borderRadius: '50%',
    background: 'transparent', // ⬅️ sin fondo por default
    border: '2px solid #111',  // ⬅️ estilo mockup
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },

  centerButtonActive: {
    background: '#F97316',
    border: 'none',
  },

  label: {
    color: '#6F7A82',
    fontSize: 11,
  },

  labelActive: {
    color: '#F97316',
    fontSize: 11,
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
}