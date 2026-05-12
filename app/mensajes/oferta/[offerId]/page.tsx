'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import supabase from '@/app/lib/supabase'

export default function OfferChatPage() {
  const { offerId } = useParams()
  const router = useRouter()

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [offer, setOffer] = useState<any>(null)
  const [myItem, setMyItem] = useState<any>(null)
  const [theirItem, setTheirItem] = useState<any>(null)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [reported, setReported] = useState(false)

  const bottomRef = useRef<any>(null)

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    if (!offerId) return

    const channel = supabase.channel(`offer-chat-${offerId}`)
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `offer_id=eq.${offerId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [offerId])

  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 80)
  }, [messages])

  const init = async () => {
    const { data } = await supabase.auth.getSession()
    const user = data.session?.user
    if (!user) return
    setCurrentUser(user)

    const { data: offerData } = await supabase
      .from('offers')
      .select('*')
      .eq('id', offerId)
      .single()

    if (!offerData) return
    setOffer(offerData)

    const iAmFrom = offerData.from_user_id === user.id
    const myItemId    = iAmFrom ? offerData.from_item_id : offerData.to_item_id
    const theirItemId = iAmFrom ? offerData.to_item_id   : offerData.from_item_id
    const otherUserId = iAmFrom ? offerData.to_user_id   : offerData.from_user_id

    const [
      { data: myItemData },
      { data: theirItemData },
      { data: otherUserData },
      { data: msgs },
    ] = await Promise.all([
      supabase.from('items').select('*').eq('id', myItemId).single(),
      supabase.from('items').select('*').eq('id', theirItemId).single(),
      supabase.from('profiles').select('*').eq('id', otherUserId).single(),
      supabase.from('messages').select('*').eq('offer_id', offerId).order('created_at', { ascending: true }),
    ])

    setMyItem(myItemData)
    setTheirItem(theirItemData)
    setOtherUser(otherUserData)
    setMessages(msgs || [])

    supabase.from('messages')
      .update({ is_read: true })
      .eq('offer_id', offerId)
      .eq('receiver', user.id)
      .eq('is_read', false)
  }

  const sendMessage = async () => {
    if (!text.trim() || !currentUser || !offer) return
    const otherUserId = offer.from_user_id === currentUser.id
      ? offer.to_user_id
      : offer.from_user_id

    await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver: otherUserId,
      text: text.trim(),
      offer_id: offerId,
      is_read: false,
    })
    setText('')
  }

  const handleReport = () => {
    setShowMenu(false)
    setReported(true)
  }

  const isMine = (m: any) => currentUser && m.sender_id === currentUser.id

  if (!currentUser || !offer) return null

  return (
    <div style={styles.container} onClick={() => showMenu && setShowMenu(false)}>

      {/* HEADER */}
      <div style={styles.header}>
        <button onClick={() => router.back()} style={styles.back}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>

        <div style={styles.userInfo}>
          {otherUser?.avatar_url ? (
            <img src={otherUser.avatar_url} style={styles.avatar} />
          ) : (
            <div style={styles.avatarFallback}>
              {(otherUser?.name || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <strong style={styles.userName}>{otherUser?.name || 'Usuario'}</strong>
        </div>

        <div style={styles.menuWrapper}>
          <button
            style={styles.menuBtn}
            onClick={(e) => { e.stopPropagation(); setShowMenu(v => !v) }}
          >
            ⋯
          </button>

          {showMenu && (
            <div style={styles.menu}>
              <div style={styles.menuItem} onClick={handleReport}>
                Reportar
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BANNER OFERTA */}
      {myItem && theirItem && (
        <div style={styles.banner}>
          <div style={styles.bannerItems}>
            <span style={styles.bannerChip}>{myItem.title}</span>
            <span style={styles.bannerArrow}>↔</span>
            <span style={styles.bannerChip}>{theirItem.title}</span>
          </div>
          <button
            style={styles.verDetalle}
            onClick={() => router.push(`/item/${theirItem.id}`)}
          >
            Ver detalle
          </button>
        </div>
      )}

      {/* BANNER REPORTE */}
      {reported && (
        <div style={styles.reportBanner}>
          Reportado
        </div>
      )}

      {/* MENSAJES */}
      <div style={styles.chat}>
        {messages.length === 0 && (
          <p style={styles.empty}>Envía el primer mensaje para iniciar la conversación.</p>
        )}

        {messages.map((m, i) => {
          const mine = isMine(m)
          return (
            <div
              key={m.id || i}
              style={{ ...styles.msg, ...(mine ? styles.right : styles.left) }}
            >
              <div>{m.text}</div>
              <div style={styles.meta}>
                {new Date(m.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {mine && (
                  <span style={styles.check}>{m.is_read ? '✓✓' : '✓'}</span>
                )}
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={styles.inputBar}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Escribe un mensaje..."
          style={styles.inputBox}
        />
        <div
          style={{ ...styles.sendBtn, ...(!text.trim() ? styles.sendDisabled : {}) }}
          onClick={sendMessage}
        >
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
    zIndex: 20,
  },

  back: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#F0EAE0',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    justifyContent: 'center',
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    objectFit: 'cover',
  },

  avatarFallback: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: '#F97316',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 14,
  },

  userName: {
    fontSize: 15,
  },

  menuWrapper: {
    position: 'relative',
  },

  menuBtn: {
    border: 'none',
    background: 'none',
    fontSize: 22,
    cursor: 'pointer',
    padding: '0 8px',
    letterSpacing: 1,
  },

  menu: {
    position: 'absolute',
    top: 36,
    right: 0,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
    overflow: 'hidden',
    zIndex: 30,
    minWidth: 180,
  },

  menuItem: {
    padding: '14px 16px',
    fontSize: 14,
    cursor: 'pointer',
    color: '#D32F2F',
  },

  banner: {
    background: '#FFF7F2',
    borderBottom: '1px solid #F0E0D6',
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  bannerItems: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    overflow: 'hidden',
  },

  bannerChip: {
    fontSize: 12,
    fontWeight: 600,
    color: '#3D3D3D',
    background: '#F0E8E2',
    padding: '4px 8px',
    borderRadius: 8,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 120,
  },

  bannerArrow: {
    fontSize: 14,
    color: '#F97316',
    fontWeight: 700,
    flexShrink: 0,
  },

  verDetalle: {
    border: 'none',
    background: '#F97316',
    color: '#fff',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
  },

  reportBanner: {
    background: '#DCFCE7',
    color: '#166534',
    padding: '10px 16px',
    fontSize: 13,
    textAlign: 'center',
  },

  chat: {
    flex: 1,
    padding: '12px 16px',
    paddingBottom: 80,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    overflowY: 'auto',
  },

  empty: {
    textAlign: 'center',
    color: '#6F7A82',
    fontSize: 13,
    marginTop: 40,
  },

  msg: {
    maxWidth: '75%',
    padding: '10px 14px',
    borderRadius: 18,
    fontSize: 14,
    display: 'flex',
    flexDirection: 'column',
  },

  left: {
    background: '#EDE5DD',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },

  right: {
    background: '#F97316',
    color: '#fff',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },

  meta: {
    marginTop: 4,
    fontSize: 11,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
    opacity: 0.7,
  },

  check: {
    fontSize: 11,
  },

  inputBar: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 500,
    display: 'flex',
    gap: 10,
    padding: '10px 16px',
    background: '#fff',
    borderTop: '1px solid #eee',
    alignItems: 'center',
  },

  inputBox: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: 16,
    border: '1px solid #ddd',
    fontSize: 14,
    outline: 'none',
  },

  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#F97316',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },

  sendDisabled: {
    opacity: 0.4,
  },
}
