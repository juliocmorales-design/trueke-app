'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import supabase from '@/app/lib/supabase'

export default function ChatPage() {
  const { userId } = useParams()

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any>({})
  const [text, setText] = useState('')

  const bottomRef = useRef<HTMLDivElement | null>(null)
  const channelRef = useRef<any>(null) // 🔥 evita duplicación

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user

      if (!user) return

      setCurrentUser(user)

      await loadAll(user.id)

      // 🔥 SI YA EXISTE, NO CREAR OTRO
      if (channelRef.current) return

      const channel = supabase.channel('chat-room')

      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => loadAll(user.id)
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

  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }, [messages])

  const loadAll = async (myId: string) => {
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender.eq.${myId},receiver.eq.${userId}),and(sender.eq.${userId},receiver.eq.${myId})`
      )
      .order('created_at', { ascending: true })

    setMessages(msgs || [])

    const ids = [
      ...new Set(
        (msgs || []).flatMap((m) => [m.sender, m.receiver])
      ),
    ]

    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('*')
        .in('id', ids)

      const map: any = {}
      profs?.forEach((p) => {
        map[p.id] = p
      })

      setProfiles(map)
    }

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver', myId)
      .eq('sender', userId)
  }

  const sendMessage = async () => {
    if (!text.trim() || !currentUser) return

    const { error } = await supabase.from('messages').insert({
      sender: currentUser.id,
      receiver: userId,
      text,
      is_read: false,
    })

    if (error) {
      console.log('❌ error enviando', error)
      alert('Error al enviar')
      return
    }

    setText('')
  }

  return (
    <div style={styles.container}>
      
      <div style={styles.messages}>
        {messages.map((m) => {
          const isMe = m.sender === currentUser?.id
          const otherId = isMe ? m.receiver : m.sender
          const profile = profiles[otherId]

          return (
            <div
              key={m.id}
              style={{
                ...styles.row,
                justifyContent: isMe ? 'flex-end' : 'flex-start',
              }}
            >
              {!isMe && (
                <img
                  src={profile?.avatar_url || '/avatar.png'}
                  style={styles.avatar}
                />
              )}

              <div
                style={{
                  ...styles.bubble,
                  background: isMe ? '#F97316' : '#eee',
                  color: isMe ? '#fff' : '#000',
                }}
              >
                {!isMe && (
                  <div style={styles.name}>
                    {profile?.name || 'Usuario'}
                  </div>
                )}
                {m.text}
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      <div style={styles.inputRow}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={styles.input}
          placeholder="Escribe mensaje..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              sendMessage()
            }
          }}
        />

        <button onClick={sendMessage} style={styles.send}>
          Enviar
        </button>
      </div>
    </div>
  )
}

const styles: any = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#fff',
    paddingBottom: 90,
  },

  messages: {
    flex: 1,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    overflowY: 'auto',
  },

  row: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    objectFit: 'cover',
  },

  name: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  bubble: {
    padding: 10,
    borderRadius: 12,
    maxWidth: '70%',
  },

  inputRow: {
    position: 'fixed',
    bottom: 70,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 500,
    display: 'flex',
    padding: 10,
    background: '#fff',
    borderTop: '1px solid #eee',
  },

  input: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    border: '1px solid #ddd',
  },

  send: {
    marginLeft: 10,
    padding: '10px 16px',
    borderRadius: 10,
    background: '#F97316',
    color: '#fff',
    border: 'none',
  },
}