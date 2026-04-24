'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import supabase from '@/app/lib/supabase'

export default function ChatPage() {
  const { userId } = useParams()
  const router = useRouter()

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [otherUser, setOtherUser] = useState<any>(null)

  const bottomRef = useRef<any>(null)

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    if (!currentUser) return

    const channel = supabase.channel(`chat-${currentUser.id}-${userId}`)

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser])

  useEffect(() => {
    scrollToBottom()
    markAsRead()
  }, [messages])

  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const init = async () => {
    const { data } = await supabase.auth.getSession()
    const user = data.session?.user
    if (!user) return

    setCurrentUser(user)

    await loadMessages(user.id)
    await loadProfile()
  }

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    setOtherUser(data)
  }

  const loadMessages = async (myId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${myId},receiver.eq.${userId}),and(sender_id.eq.${userId},receiver.eq.${myId})`
      )
      .order('created_at', { ascending: true })

    setMessages(data || [])
  }

  const markAsRead = async () => {
    if (!currentUser) return

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver', currentUser.id)
      .eq('sender_id', userId)
      .eq('is_read', false)
  }

  const sendMessage = async () => {
    if (!text.trim()) return

    await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver: userId,
      text,
      is_read: false,
    })

    setText('')
  }

  const handleKey = (e: any) => {
    if (e.key === 'Enter') sendMessage()
  }

  const isMine = (m: any) => {
    if (!currentUser) return false
    return m.sender_id === currentUser.id
  }

  if (!currentUser) return null

  return (
    <div style={styles.container}>
      
      {/* HEADER */}
      <div style={styles.header}>
        <button onClick={() => router.back()} style={styles.back}>
          ←
        </button>

        <div style={styles.user}>
          <img
            src={otherUser?.avatar_url || '/avatar.png'}
            style={styles.avatar}
          />
          <div>
            <strong>{otherUser?.name || 'Usuario'}</strong>
            <div style={styles.status}>● Viendo ahora</div>
          </div>
        </div>

        <div>⋯</div>
      </div>

      {/* CHAT */}
      <div style={styles.chat}>
        {messages.map((m, i) => {
          const mine = isMine(m)

          return (
            <div
              key={i}
              style={{
                ...styles.msg,
                ...(mine ? styles.right : styles.left),
              }}
            >
              <div>{m.text}</div>

              <div style={styles.meta}>
                {new Date(m.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}

                {mine && (
                  <span style={styles.check}>
                    {m.is_read ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={styles.input}>
        <div style={styles.circle}>＋</div>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escribe un mensaje..."
          style={styles.inputBox}
        />

        <div style={styles.send} onClick={sendMessage}>
          ➤
        </div>
      </div>
    </div>
  )
}

const styles: any = {
  container: {
    background: '#F6F3F0',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },

  header: {
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    background: '#fff',
    borderBottom: '1px solid #eee',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },

  chat: {
    flex: 1,
    padding: 12,
    paddingBottom: 140, // 🔥 espacio para input + FAB
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    overflowY: 'auto',
  },

  input: {
    position: 'fixed',
    bottom: 80, // 🔥 debajo del FAB
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 500,
    display: 'flex',
    gap: 10,
    padding: 10,
    background: '#fff',
    borderTop: '1px solid #eee',
    alignItems: 'center',
  },

  back: {
    border: 'none',
    background: 'none',
    fontSize: 18,
  },

  user: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
  },

  status: {
    fontSize: 12,
    color: 'green',
  },

  msg: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    fontSize: 14,
    display: 'flex',
    flexDirection: 'column',
  },

  left: {
    background: '#EDE5DD',
    alignSelf: 'flex-start',
  },

  right: {
    background: '#F97316',
    color: '#fff',
    alignSelf: 'flex-end',
  },

  meta: {
    marginTop: 6,
    fontSize: 11,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
    opacity: 0.8,
  },

  check: {
    fontSize: 12,
  },

  inputBox: {
    flex: 1,
    padding: 10,
    borderRadius: 25,
    border: '1px solid #ddd',
  },

  circle: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#eee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  send: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#F97316',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}