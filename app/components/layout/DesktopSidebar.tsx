'use client'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import supabase from '@/app/lib/supabase'

export default function DesktopSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<any>(null)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      const { data } = await supabase
        .from('profiles')
        .select('username, city, avatar_url')
        .eq('id', session.user.id)
        .single()
      setProfile(data)
    }
    loadProfile()
  }, [])

  const navItems = [
    { href: '/', icon: '🏠', label: 'Inicio' },
    { href: '/intercambios', icon: '⇄', label: 'Intercambios' },
    { href: '/mensajes', icon: '💬', label: 'Mensajes', badge: unread },
    { href: '/cadenas', icon: '🔗', label: 'Cadenas' },
    { href: '/notificaciones', icon: '🔔', label: 'Notificaciones' },
  ]

  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      background: '#1A2744',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 0',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 40,
    }}>
      <div style={{ padding: '0 20px 24px' }}>
        <Image src="/images/logo.png" width={130} height={44} alt="Trueke.app"
          style={{ objectFit: 'contain' }} />
      </div>

      <div style={{ padding: '0 12px', marginBottom: 16 }}>
        <div style={{
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 10,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
        }} onClick={() => router.push('/buscar')}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>🔍</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
            Buscar objetos...
          </span>
        </div>
      </div>

      <nav style={{ padding: '0 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(item => {
          const isActive = pathname === item.href
          return (
            <div
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 10,
                background: isActive ? 'rgba(249,115,22,0.15)' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{
                color: isActive ? '#F97316' : 'rgba(255,255,255,0.7)',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                flex: 1,
              }}>
                {item.label}
              </span>
              {item.badge ? (
                <span style={{
                  background: '#F97316',
                  color: 'white',
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 99,
                  padding: '2px 7px',
                }}>
                  {item.badge}
                </span>
              ) : null}
            </div>
          )
        })}
      </nav>

      <div style={{ padding: '0 12px 8px' }}>
        <button
          onClick={() => router.push('/crear')}
          style={{
            width: '100%',
            background: '#F97316',
            border: 'none',
            borderRadius: 10,
            padding: '12px',
            color: 'white',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            marginBottom: 12,
          }}
        >
          + Publicar objeto
        </button>

        {profile && (
          <div
            onClick={() => router.push('/perfil')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 10,
              cursor: 'pointer',
            }}
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              overflow: 'hidden',
              background: '#F97316',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              color: 'white',
            }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                (profile.username || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>
                @{profile.username}
              </div>
              {profile.city && (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                  {profile.city}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
