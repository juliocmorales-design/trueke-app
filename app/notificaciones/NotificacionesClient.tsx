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

const TYPE_ICON: Record<string, string> = {
  new_offer:       '📦',
  offer_accepted:  '✅',
  offer_rejected:  '❌',
  offer_completed: '🎉',
  new_rating:      '⭐',
}

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

  useEffect(() => { load() }, [])

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

  const handlePress = (n: Notif) => {
    if (n.offer_id) router.push(`/exchange/${n.offer_id}`)
  }

  return (
    <div className={s.page}>

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
        <div className={s.loading}>Cargando…</div>

      ) : notifs.length === 0 ? (
        <div className={s.emptyWrap}>
          <div className={s.emptyIcon}>🔔</div>
          <p className={s.emptyTitle}>Todo tranquilo por aquí</p>
          <p className={s.emptySub}>
            Cuando alguien te envíe una oferta o acepte la tuya, lo verás aquí
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
              <div className={s.iconWrap}>
                {TYPE_ICON[n.type] ?? '🔔'}
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
