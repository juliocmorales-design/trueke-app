'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import supabase from '@/app/lib/supabase'

function NavIcon({ name, color }: { name: string; color: string }) {
  const props = {
    width: 20, height: 20, viewBox: '0 0 24 24',
    fill: 'none', stroke: color, strokeWidth: 2,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  }
  switch (name) {
    case 'home':
      return <svg {...props}><path d="M3 10.5L12 3l9 7.5" /><path d="M5 10v10h5v-6h4v6h5V10" /></svg>
    case 'swap':
      return <svg {...props}><path d="M7 7h10M17 7l-3-3M17 7l-3 3" /><path d="M17 17H7M7 17l3-3M7 17l3 3" /></svg>
    case 'chat':
      return <svg {...props}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /></svg>
    case 'chain':
      return <svg {...props}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
    case 'bell':
      return <svg {...props}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
    default:
      return null
  }
}

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
    { href: '/', iconName: 'home', label: 'Inicio' },
    { href: '/intercambios', iconName: 'swap', label: 'Intercambios' },
    { href: '/mensajes', iconName: 'chat', label: 'Mensajes', badge: unread },
    { href: '/cadenas', iconName: 'chain', label: 'Cadenas' },
    { href: '/notificaciones', iconName: 'bell', label: 'Notificaciones' },
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
        <img
          src="/svg/Logo_Trueke_bco.svg"
          alt="Trueke.app"
          style={{
            width: 140,
            height: 'auto',
            display: 'block',
            objectFit: 'contain',
          }}
        />
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
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
            stroke="rgba(255,255,255,0.4)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" />
          </svg>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
            Buscar objetos...
          </span>
        </div>
      </div>

      <nav style={{ padding: '0 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(item => {
          const isActive = pathname === item.href
          const iconColor = isActive ? '#F97316' : 'rgba(255,255,255,0.7)'
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
              <NavIcon name={item.iconName} color={iconColor} />
              <span style={{
                color: iconColor,
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
