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

      // 🔥 limpiar canal previo (evita duplicados)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }

      const channel = supabase.channel(`messages-list-${user.id}`)

      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => loadConversations(user.id)
      )

      // 🔥 también refrescar cuando se marcan como leídos
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        () => loadConversations(user.id)
      )

      channel.subscribe()

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
    // 🔥 solo columnas necesarias (performance)
    const { data, error } = await supabase
      .from('messages')
      .select('sender_id, receiver, text, created_at, is_read')
      .or(`sender_id.eq.${myId},receiver.eq.${myId}`)
      .order('created_at', { ascending: false })
      .limit(200) // 🔥 evita full scan infinito

    if (error) {
      console.log('❌ error loading', error)
      return
    }

    const map: any = {}

    for (const m of data || []) {
      const otherUser =
        m.sender_id === myId ? m.receiver : m.sender_id

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
    }

    let conversationsArray = Object.values(map)

    conversationsArray.sort(
      (a: any, b: any) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )

    const userIds = [...new Set(conversationsArray.map((c: any) => c.userId))]

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
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

  const openChat = async (otherUserId: string) => {
    if (!currentUser) return

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver', currentUser.id)
      .eq('sender_id', otherUserId)

    await loadConversations(currentUser.id)

    router.push(`/mensajes/${otherUserId}`)
  }

  const formatTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)

    const diff = (now.getTime() - date.getTime()) / 1000

    if (diff < 60) return 'Ahora'

    if (diff < 3600) {
      const mins = Math.floor(diff / 60)
      return `Hace ${mins} min`
    }

    if (diff < 86400) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    if (diff < 172800) return 'Ayer'

    return date.toLocaleDateString()
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Mensajes</h2>

      {conversations.map((c: any) => (
        <div
          key={c.userId}
          style={styles.item}
          onClick={() => openChat(c.userId)}
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
            <div style={styles.topRow}>
              <strong>{c.name}</strong>

              <span style={styles.time}>
                {mounted ? formatTime(c.created_at) : ''}
              </span>
            </div>

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

  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  time: {
    fontSize: 12,
    color: '#999',
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
}