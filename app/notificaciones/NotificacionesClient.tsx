'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/app/lib/supabase'
import s from './notificaciones.module.css'

type Notif = {
  id: number
  type: string
  title: string
  body: string
  offer_id: number | null
  is_read: boolean
  created_at: string
}

const TYPE_BG: Record<string, string> = {
  offer_received:  '#FFF0E6',
  offer_accepted:  '#DCFCE7',
  offer_rejected:  '#FEE2E2',
  offer_completed: '#DBEAFE',
  rating_received: '#FEF3C7',
}
const DEFAULT_BG = '#F0EAE0'

const TYPE_SVG: Record<string, React.ReactElement> = {
  offer_received: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/>
      <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <polyline points="7 23 3 19 7 15"/>
      <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>
  ),
  offer_accepted: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="9 12 12 15 16 9"/>
    </svg>
  ),
  offer_rejected: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M15 9l-6 6M9 9l6 6"/>
    </svg>
  ),
  offer_completed: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 17v4M17 3H7l-2 9h14L17 3zM5 12h14"/>
    </svg>
  ),
  rating_received: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#F59E0B" stroke="none">
      <polygon points="12,2 15,9 22,9 17,14 19,21 12,16 5,21 7,14 2,9 9,9"/>
    </svg>
  ),
}

const FALLBACK_SVG = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6F7A82" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)

const TYPE_DEST: Record<string, string> = {
  offer_received:  '/mensajes/',
  offer_accepted:  '/mensajes/',
  offer_rejected:  '/intercambios',
  offer_completed: '/mensajes/',
  rating_received: '/perfil/resenas',
}
const DEFAULT_DEST = '/intercambios'

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days}d`
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

export default function NotificacionesClient() {
  const router = useRouter()
  const [notifs, setNotifs]   = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.replace('/login'); return }

    const res = await fetch('/api/notifications/list', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const json = await res.json()
    const list: Notif[] = json.data ?? []
    setNotifs(list)
    setLoading(false)

    const unreadIds = list.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length > 0) {
      fetch('/api/notifications/list', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: unreadIds }),
      })
    }
  }

  useEffect(() => { load() }, [])

  const handlePress = (n: Notif) => {
    const dest = TYPE_DEST[n.type] ?? DEFAULT_DEST
    if (dest.endsWith('/')) {
      router.push(n.offer_id ? `${dest}${n.offer_id}` : '/intercambios')
    } else {
      router.push(dest)
    }
  }

  return (
    <div className={s.page} style={isDesktop ? { maxWidth: 680, margin: '0 auto', padding: '32px 24px' } : undefined}>

      <div className={s.header}>
        <button className={s.backBtn} onClick={() => router.back()} aria-label="Volver">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className={s.headerTitle}>Notificaciones</span>
        <div style={{ width: 40 }} />
      </div>

      {loading ? (
        <div className={s.skeletonList}>
          {[1, 2, 3].map(i => (
            <div key={i} className={s.skeletonRow}>
              <div className={s.skeletonCircle} />
              <div style={{ flex: 1 }}>
                <div className={s.skeletonLine} style={{ width: '65%' }} />
                <div className={s.skeletonLineShort} style={{ width: '40%' }} />
              </div>
            </div>
          ))}
        </div>

      ) : notifs.length === 0 ? (
        <div className={s.emptyWrap}>
          <div className={s.emptyIcon}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#C4BAB1" strokeWidth="1.5" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <p className={s.emptyTitle}>Todo tranquilo por aquí</p>
          <p className={s.emptySub}>
            Cuando alguien te envíe una oferta o acepte la tuya,<br/>lo verás aquí
          </p>
        </div>

      ) : (
        <div className={s.list}>
          {notifs.map(n => (
            <div
              key={n.id}
              className={`${s.row} ${!n.is_read ? s.rowUnread : ''}`}
              onClick={() => handlePress(n)}
            >
              <div
                className={s.iconWrap}
                style={{ background: TYPE_BG[n.type] ?? DEFAULT_BG }}
              >
                {TYPE_SVG[n.type] ?? FALLBACK_SVG}
              </div>

              <div className={s.textBlock}>
                <div className={s.notifTitle}>{n.title}</div>
                {n.body ? <div className={s.notifBody}>{n.body}</div> : null}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <span className={s.time}>{relativeTime(n.created_at)}</span>
                {!n.is_read && <div className={s.unreadDot} />}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
