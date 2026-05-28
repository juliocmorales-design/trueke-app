'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/app/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isDesktop
}

type AuthUser    = { id: string; email?: string }
type Item        = { id: number; title: string; images: string[] | null; wanted: string | null; city: string | null; user_id: string }
type Profile     = { id: string; name: string; username: string | null; avatar_url: string | null }
type Conversation = { offerId: number; otherUser: Profile; myItem: Item | null; theirItem: Item | null; lastMessage: string; created_at: string; unread: number }

export default function MessagesPage() {
  const router = useRouter()
  const isDesktop = useIsDesktop()

  const [currentUser, setCurrentUser]     = useState<AuthUser | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [mounted, setMounted]             = useState(false)
  const [loading, setLoading]             = useState(true)

  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => { setMounted(true) }, [])

  const loadConversations = async (myId: string) => {
    const { data: offersData } = await supabase
      .from('offers')
      .select('*')
      .or(`from_user_id.eq.${myId},to_user_id.eq.${myId}`)
      .order('created_at', { ascending: false })

    if (!offersData?.length) {
      setConversations([])
      setLoading(false)
      return
    }

    const offerIds = offersData.map(o => o.id)
    const otherUserIds = [
      ...new Set(
        offersData.map(o => o.from_user_id === myId ? o.to_user_id : o.from_user_id)
      ),
    ]
    const allItemIds = [
      ...new Set(offersData.flatMap(o => [o.from_item_id, o.to_item_id]).filter(Boolean)),
    ]

    if (offerIds.length === 0) {
      setConversations([])
      setLoading(false)
      return
    }

    const [{ data: msgs }, { data: profiles }, { data: items }] = await Promise.all([
      supabase.from('messages').select('*').in('offer_id', offerIds).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, name, username, avatar_url').in('id', otherUserIds),
      allItemIds.length > 0
        ? supabase.from('items').select('id, title').in('id', allItemIds)
        : { data: [] },
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
        otherUser: profilesMap[otherUserId] || { name: null, username: 'Usuario' },
        myItem: itemsMap[myItemId],
        theirItem: itemsMap[theirItemId],
        lastMessage: lastMsg?.text || 'Oferta enviada',
        created_at: lastMsg?.created_at || o.created_at,
        unread: unreadMap[o.id] || 0,
      }
    })

    final.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setConversations(final)
    setLoading(false)
  }

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
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver=eq.${user.id}`,
        }, () => loadConversations(user.id))
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

  const formatTime = (dateString: string) => {
    if (!dateString) return ''
    const now = new Date()
    const date = new Date(dateString)
    const diff = (now.getTime() - date.getTime()) / 1000

    if (diff < 60) return 'Ahora'
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`
    if (diff < 86400) return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    if (diff < 172800) return 'Ayer'
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  }

  const shimmerStyle: any = {
    background: 'linear-gradient(90deg,#eee 25%,#ddd 37%,#eee 63%)',
    backgroundSize: '400% 100%',
    animation: 'shimmer 1.4s ease infinite',
    borderRadius: 8,
  }

  const conversationList = (
    <div style={styles.container}>
      <h2 style={styles.title}>Mensajes</h2>

      {loading ? (
        <>
          <style>{`@keyframes shimmer{0%{background-position:100% 50%}100%{background-position:0 50%}}`}</style>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ ...styles.item, alignItems: 'center' }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, ...shimmerStyle }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ height: 14, width: '55%', ...shimmerStyle }} />
                <div style={{ height: 11, width: '80%', ...shimmerStyle }} />
              </div>
            </div>
          ))}
        </>
      ) : conversations.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '64px 32px', gap: 12, textAlign: 'center',
        }}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none"
            stroke="#C4BAB1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1A2744' }}>
            No tienes mensajes aún
          </p>
          <p style={{ margin: 0, fontSize: 14, color: '#9CA3AF' }}>
            Cuando hagas una oferta podrás chatear aquí
          </p>
        </div>
      ) : null}

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
                {(c.otherUser?.name || c.otherUser?.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div style={styles.textContainer}>
            <div style={styles.topRow}>
              <strong style={styles.name}>{c.otherUser?.name || c.otherUser?.username || 'Usuario'}</strong>
              <span style={styles.time}>
                {mounted ? formatTime(c.created_at) : ''}
              </span>
            </div>

            {c.myItem && c.theirItem && (
              <div style={styles.offerContext}>
                {c.myItem.title}{' '}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ display: 'inline', verticalAlign: 'middle' }}>
                  <path d="M7 7h10M17 7l-3-3M17 7l-3 3"/>
                  <path d="M17 17H7M7 17l3-3M7 17l3 3"/>
                </svg>
                {' '}{c.theirItem.title}
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

  if (isDesktop) {
    return (
      <div style={{ display: 'flex', height: '100vh' }}>
        <div style={{ width: 320, borderRight: '1px solid #F0EAE0', overflowY: 'auto' }}>
          {conversationList}
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF3ED' }}>
          <p style={{ color: '#9CA3AF', fontSize: 15 }}>
            Selecciona una conversación
          </p>
        </div>
      </div>
    )
  }

  return conversationList
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
    color: '#F97316',
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
