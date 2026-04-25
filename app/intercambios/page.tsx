'use client'

import { useEffect, useState } from 'react'
import supabase from '../lib/supabase'

export default function IntercambiosPage() {
  const [offers, setOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    // 1. OFFERS
    const { data: offersData } = await supabase
      .from('offers')
      .select('*')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (!offersData) return

    // 2. OFFER ITEMS
    const { data: itemsData } = await supabase
      .from('offer_items')
      .select('*, items(*)')
      .in('offer_id', offersData.map(o => o.id))

    const itemsMap: any = {}

    itemsData?.forEach(i => {
      if (!itemsMap[i.offer_id]) itemsMap[i.offer_id] = []
      itemsMap[i.offer_id].push(i)
    })

    // 🔥 3. USER IDS LIMPIOS
    const userIds = [
      ...new Set(
        offersData
          .flatMap(o => [o.from_user_id, o.to_user_id])
          .filter(Boolean)
      ),
    ]

    // 4. PROFILES
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds)

    const profileMap: any = {}
    profiles?.forEach(p => (profileMap[p.id] = p))

    // 5. FINAL
    const final = offersData.map(o => {
      const items = itemsMap[o.id] || []

      const requested = items.find((i: any) => i.type === 'requested')?.items
      const offered = items.find((i: any) => i.type === 'offered')?.items

      const isMeSender = o.from_user_id === user.id
      const otherUserId = isMeSender ? o.to_user_id : o.from_user_id
      const otherUser = profileMap[otherUserId]

      return {
        ...o,
        requested,
        offered,
        user: otherUser,
      }
    })

    setOffers(final)
    setLoading(false)
  }

  if (loading) return <div style={styles.loading}>Cargando...</div>

  return (
    <div style={styles.screen}>
      <div style={styles.wrapper}>
        <h2 style={styles.title}>Intercambios</h2>

        {offers.map(o => {
          const img =
            o.requested?.images?.[0] ||
            o.offered?.images?.[0] ||
            '/images/placeholder.jpg'

          return (
            <div
              key={o.id}
              style={styles.row}
              onClick={() => (window.location.href = `/chat/${o.id}`)}
            >
              <img
                src={o.user?.avatar_url || '/images/avatar.png'}
                style={styles.avatar}
              />

              <div style={styles.info}>
                <div style={styles.name}>
                  {o.user?.name || 'Usuario'}
                </div>

                <div style={styles.subtitle}>
                  {o.requested?.title || 'Item'} 🔁{' '}
                  {o.offered?.title || 'Item'}
                </div>

                <div style={styles.status}>
                  {o.status === 'pending' && 'Pendiente'}
                  {o.status === 'accepted' && 'Aceptado'}
                  {o.status === 'rejected' && 'Rechazado'}
                </div>
              </div>

              <img src={img} style={styles.thumb} />

              <div style={styles.arrow}>›</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const styles: any = {
  screen: {
    background: '#F6F3F0',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
  },

  wrapper: {
    width: '100%',
    maxWidth: 500,
    padding: 16,
  },

  title: {
    marginBottom: 16,
  },

  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    background: '#fff',
    marginBottom: 10,
    cursor: 'pointer',
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    objectFit: 'cover',
  },

  info: {
    flex: 1,
  },

  name: {
    fontWeight: 600,
    fontSize: 14,
  },

  subtitle: {
    fontSize: 13,
    color: '#6F7A82',
    marginTop: 2,
  },

  status: {
    fontSize: 12,
    marginTop: 4,
    color: '#999',
  },

  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    objectFit: 'cover',
  },

  arrow: {
    fontSize: 18,
    opacity: 0.3,
  },

  loading: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}