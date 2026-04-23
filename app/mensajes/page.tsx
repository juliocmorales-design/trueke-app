'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/app/lib/supabase'

export default function MessagesPage() {
  const router = useRouter()

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])

  const channelRef = useRef<any>(null) // 🔥 CLAVE

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user

      if (!user) return

      setCurrentUser(user)

      await loadConversations(user.id)

      // 🔥 EVITA DOBLE SUBSCRIPCIÓN
      if (channelRef.current) return

      const channel = supabase.channel(`messages-list-${user.id}`)

      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadConversations(user.id)
        }
      )

      channel.subscribe()

      channelRef.current = channel // 🔥 guardar referencia
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
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender.eq.${myId},receiver.eq.${myId}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.log('❌ error loading', error)
      return
    }

    const map: any = {}

    data.forEach((m: any) => {
      const otherUser =
        m.sender === myId ? m.receiver : m.sender

      if (!map[otherUser]) {
        map[otherUser] = {
          userId: otherUser,
          lastMessage: m.text,
          created_at: m.created_at,
          unread: 0,
        }
      }

      if (m.receiver === myId && !m.is_read) {
        map[otherUser].unread++
      }
    })

    const conversationsArray = Object.values(map)

    const userIds = conversationsArray.map((c: any) => c.userId)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds)

    const profilesMap: any = {}
    profiles?.forEach((p: any) => {
      profilesMap[p.id] = p
    })

    const final = conversationsArray.map((c: any) => ({
      ...c,
      name: profilesMap[c.userId]?.name || 'Usuario',
      avatar: profilesMap[c.userId]?.avatar_url || null,
    }))

    setConversations(final)
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Mensajes</h2>

      {conversations.map((c: any) => (
        <div
          key={c.userId}
          style={styles.item}
          onClick={() => router.push(`/mensajes/${c.userId}`)}
        >
          <div style={styles.avatarWrapper}>
            {c.avatar ? (
              <img src={c.avatar} style={styles.avatar} />
            ) : (
              <div style={styles.avatarPlaceholder}>
                {c.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div style={styles.textContainer}>
            <strong>{c.name}</strong>
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
    background: '#fff',
    minHeight: '100vh',
  },

  title: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 16,
  },

  item: {
    padding: 14,
    borderBottom: '1px solid #eee',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer',
  },

  avatarWrapper: {
    width: 45,
    height: 45,
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
    background: '#F97316',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },

  textContainer: {
    flex: 1,
  },

  preview: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },

  badge: {
    background: '#F97316',
    color: '#fff',
    borderRadius: 999,
    padding: '4px 8px',
    fontSize: 12,
  },
}git init