'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/app/lib/supabase'
import Icon from '@/app/components/icons/Icon'

export default function NotifBadge() {
  const router = useRouter()
  const [count, setCount] = useState(0)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const token = session?.access_token

      console.log('[notif-badge] fetching...')
      const res = await fetch('/api/notifications/unread-count', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const json = await res.json()
      console.log('[notif-badge] result:', json)
      setCount(json.count ?? 0)
    }

    load()
  }, [])

  return (
    <div style={styles.wrapper} onClick={() => router.push('/notificaciones')}>
      <Icon name="notifications" />
      {count > 0 && (
        <div style={styles.badge}>
          {count > 99 ? '99+' : count}
        </div>
      )}
    </div>
  )
}

const styles: any = {
  wrapper: {
    position: 'relative',
    cursor: 'pointer',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    background: '#F97316',
    color: '#fff',
    borderRadius: 999,
    padding: '2px 6px',
    fontSize: 10,
    fontWeight: 600,
    minWidth: 16,
    textAlign: 'center',
    lineHeight: '14px',
  },
}
