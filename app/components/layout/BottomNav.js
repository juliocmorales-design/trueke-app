'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import supabase from '@/app/lib/supabase'
import Icon from '../icons/Icon'

export default function BottomNav() {
  const [unread, setUnread] = useState(0)

  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const { data } = await supabase.auth.getSession()
    const user = data.session?.user

    if (!user) return

    cargar(user.id)
  }

  async function cargar(userId) {
    const { data } = await supabase
      .from('messages')
      .select('*')

    if (!data) return

    const count = data.filter(
      (m) => m.sender !== userId && !m.is_read
    ).length

    setUnread(count)
  }

  const isActive = (path) => pathname === path

  return (
    <div style={styles.wrapper}>
      
      <div style={styles.nav}>

        <div style={styles.item} onClick={() => router.push('/')}>
          <Icon name="home" active={isActive('/')} />
          <span style={isActive('/') ? styles.labelActive : styles.label}>
            Inicio
          </span>
        </div>

        <div style={styles.item} onClick={() => router.push('/intercambios')}>
          <Icon name="swap" active={isActive('/intercambios')} />
          <span style={isActive('/intercambios') ? styles.labelActive : styles.label}>
            Intercambios
          </span>
        </div>

        <div style={{ width: 50 }} />

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

        <div style={styles.item} onClick={() => router.push('/perfil')}>
          <Icon name="user" active={isActive('/perfil')} />
          <span style={isActive('/perfil') ? styles.labelActive : styles.label}>
            Perfil
          </span>
        </div>

      </div>

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
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 500,
    zIndex: 100,
  },

  nav: {
    height: 70,
    background: '#fff',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTop: '1px solid #eee',
    boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
  },

  item: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: 11,
    cursor: 'pointer',
  },

  label: {
    color: '#777',
    marginTop: 4,
  },

  labelActive: {
    color: '#F5A623',
    marginTop: 4,
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
    top: -26,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 58,
    height: 58,
    borderRadius: '50%',
    background: '#F5A623',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
    cursor: 'pointer',
  },
}