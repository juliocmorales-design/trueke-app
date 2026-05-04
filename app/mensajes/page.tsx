'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/app/lib/supabase'

export default function MessagesPage() {
  const router = useRouter()

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)

  const channelRef = useRef<any>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user
      if (!user) return

      setCurrentUser(user)
      await loadConversations(user.id)

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }

      const channel = supabase.channel(`messages-list-${user.id}`)
      channel
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
          () => loadConversations(user.id))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' },
          () => loadConversations(user.id))
        .subscribe()

      channelRef.current = channel
    }

    init()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [])

  const loadConversations = async (myId: string) => {
    const { data: offersData } = await supabase
      .from('offers')
      .select('*')
      .or(`from_user_id.eq.${myId},to_user_id.eq.${myId}`)
      .order('created_at', { ascending: false })

    if (!offersData?.length) {
      setConversations([])
      return
    }

    const offerIds = offersData.map(o => o.id)
    const otherUserIds = [
      ...new Set(
        offersData.map(o => o.from_user_id === myId ? o.to_user_id : o.from_user_id)
      ),
    ]
    const allItemIds = [
      ...new Set(offersData.flatMap(o => [o.from_item_id, o.to_item_id])),
    ]

    const [{ data: msgs }, { data: profiles }, { data: items }] = await Promise.all([
      supabase.from('messages').select('*').in('offer_id', offerIds).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, name, avatar_url').in('id', otherUserIds),
      supabase.from('items').select('id, title').in('id', allItemIds),
    ])

    const profilesMap: any = {}
    profiles?.forEach(p => (profilesMap[p.id] = p))
    const itemsMap: any = {}
    items?.forEach(i => (itemsMap[i.id] = i))

    const lastMsgMap: any = {}
    const unreadMap: any = {}
    for (const m of msgs || []) {
      if (!lastMsgMap[m.offer_id]) lastMsgMap[m.offer_id] = m
      if (m.receiver === myId && !m.is_read) {
        unreadMap[m.offer_id] = (unreadMap[m.offer_id] || 0) + 1
      }
    }

    const final = offersData.map(o => {
      const iAmFrom = o.from_user_id === myId
      const otherUserId  = iAmFrom ? o.to_user_id   : o.from_user_id
      const myItemId     = iAmFrom ? o.from_item_id  : o.to_item_id
      const theirItemId  = iAmFrom ? o.to_item_id    : o.from_item_id
      const lastMsg = lastMsgMap[o.id]

      return {
        offerId: o.id,
        otherUser: profilesMap[otherUserId] || { name: 'Usuario' },
        myItem: itemsMap[myItemId],
        theirItem: itemsMap[theirItemId],
        lastMessage: lastMsg?.text || 'Oferta enviada',
        created_at: lastMsg?.created_at || o.created_at,
        unread: unreadMap[o.id] || 0,
      }
    })

    final.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setConversations(final)
  }

  const formatTime = (dateString: string) => {
    if (!dateString) return ''
    const now = new Date()
    const date = new Date(dateString)
    const diff = (now.getTime() - date.getTime()) / 1000

    if (diff < 60) return 'Ahora'
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`
    if (diff < 86400) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (diff < 172800) return 'Ayer'
    return date.toLocaleDateString()
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Mensajes</h2>

      {conversations.length === 0 && (
        <p style={styles.empty}>
          Aún no tienes conversaciones.<br/>Envía una oferta desde la ficha de un item.
        </p>
      )}

      {conversations.map(c => (
        <div
          key={c.offerId}
          style={styles.item}
          onClick={() => router.push(`/mensajes/${c.offerId}`)}
        >
          <div style={styles.avatarWrapper}>
            {c.otherUser?.avatar_url ? (
              <img src={c.otherUser.avatar_url} style={styles.avatar} />
            ) : (
              <div style={styles.avatarPlaceholder}>
                {(c.otherUser?.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div style={styles.textContainer}>
            <div style={styles.topRow}>
              <strong style={styles.name}>{c.otherUser?.name || 'Usuario'}</strong>
              <span style={styles.time}>
                {mounted ? formatTime(c.created_at) : ''}
              </span>
            </div>

            {c.myItem && c.theirItem && (
              <div style={styles.offerContext}>
                {c.myItem.title} ⇄ {c.theirItem.title}
              </div>
            )}

            <div style={styles.preview}>{c.lastMessage}</div>
          </div>

          {c.unread > 0 && (
            <div style={styles.badge}>{c.unread}</div>
          )}
        </div>
      ))}
    </div>
  )
}

const styles: any = {
  container: {
    padding: 16,
    paddingBottom: 100,
    background: '#FDF8F3',
    minHeight: '100vh',
  },

  title: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 16,
    color: '#1A2744',
  },

  empty: {
    color: '#1A2744',
    fontSize: 15,
    fontWeight: 500,
    textAlign: 'center',
    marginTop: 60,
    lineHeight: 1.8,
  },

  item: {
    padding: 14,
    borderRadius: 16,
    background: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    border: '1px solid #F0EAE4',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer',
  },

  avatarWrapper: {
    width: 46,
    height: 46,
    flexShrink: 0,
  },

  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
  },

  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: '#1A2744',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },

  textContainer: {
    flex: 1,
    overflow: 'hidden',
  },

  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  name: {
    fontSize: 15,
  },

  time: {
    fontSize: 12,
    color: '#999',
    flexShrink: 0,
  },

  offerContext: {
    fontSize: 12,
    color: '#E8642C',
    fontWeight: 600,
    marginTop: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  preview: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  badge: {
    background: '#F97316',
    color: '#fff',
    borderRadius: 999,
    padding: '4px 8px',
    fontSize: 12,
    flexShrink: 0,
  },
}
