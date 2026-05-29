'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import supabase from '@/app/lib/supabase'
import { useIsDesktop } from '@/app/hooks/useIsDesktop'

type AuthUser = { id: string; email?: string }
type Item     = { id: number; title: string; images: string[] | null; wanted: string | null; city: string | null; user_id: string }
type Profile  = { id: string; name: string; username: string | null; avatar_url: string | null }
type Offer    = { id: number; from_user_id: string; to_user_id: string; status: string; from_item_id: number | null; to_item_id: number | null }
type Message  = { id: number; sender_id: string; receiver: string; text: string; created_at: string; is_read: boolean; offer_id: number; type?: 'system' | 'text' }

const STEPS: Record<string, { step: number; label: string }> = {
  pending:   { step: 1, label: 'Esperando respuesta' },
  accepted:  { step: 2, label: 'Acordar punto de encuentro' },
  completed: { step: 3, label: 'Intercambio completado' },
}

export default function OfferChatPage() {
  const { userId: offerId } = useParams()
  const router = useRouter()
  const isDesktop = useIsDesktop()

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [offer, setOffer]             = useState<Offer | null>(null)
  const [notFound, setNotFound]       = useState(false)
  const [myItem, setMyItem]           = useState<Item | null>(null)
  const [theirItem, setTheirItem]     = useState<Item | null>(null)
  const [otherUser, setOtherUser]     = useState<Profile | null>(null)
  const [trustScore, setTrustScore]   = useState<number | null>(null)
  const [messages, setMessages]       = useState<Message[]>([])
  const [text, setText]               = useState('')
  const [showMenu, setShowMenu]       = useState(false)
  const [reported, setReported]       = useState(false)
  const [sendError, setSendError]     = useState('')
  const [conversations, setConversations] = useState<any[]>([])

  const bottomRef = useRef<HTMLDivElement | null>(null)
  const currentOfferId = offerId ? Number(offerId) : null

  useEffect(() => {
    if (!offerId) return
    const channel = supabase.channel(`chat-offer-${offerId}`)
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `offer_id=eq.${offerId}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [offerId])

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
  }, [messages])

  const loadConversations = async (myId: string) => {
    const { data: offersData } = await supabase
      .from('offers')
      .select('*')
      .or(`from_user_id.eq.${myId},to_user_id.eq.${myId}`)
      .order('created_at', { ascending: false })
    if (!offersData?.length) return

    const offerIds = offersData.map((o: any) => o.id)
    const otherUserIds = [...new Set(
      offersData.map((o: any) => o.from_user_id === myId ? o.to_user_id : o.from_user_id)
    )] as string[]

    const [{ data: msgs }, { data: profiles }] = await Promise.all([
      supabase.from('messages').select('*').in('offer_id', offerIds).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, name, username, avatar_url').in('id', otherUserIds),
    ])

    const profilesMap: any = {}
    profiles?.forEach((p: any) => (profilesMap[p.id] = p))
    const lastMsgMap: any = {}
    const unreadMap: any = {}
    for (const m of msgs || []) {
      if (!lastMsgMap[m.offer_id]) lastMsgMap[m.offer_id] = m
      if (m.receiver === myId && !m.is_read) {
        unreadMap[m.offer_id] = (unreadMap[m.offer_id] || 0) + 1
      }
    }

    const final = offersData.map((o: any) => {
      const iAmFrom = o.from_user_id === myId
      const otherUserId = iAmFrom ? o.to_user_id : o.from_user_id
      const lastMsg = lastMsgMap[o.id]
      return {
        offerId: o.id,
        otherUser: profilesMap[otherUserId] || { name: null, username: 'Usuario' },
        lastMessage: lastMsg?.text || 'Oferta enviada',
        created_at: lastMsg?.created_at || o.created_at,
        unread: unreadMap[o.id] || 0,
      }
    })
    final.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setConversations(final)
  }

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

    if (!offerData) { setNotFound(true); return }
    setOffer(offerData)

    const iAmFrom    = offerData.from_user_id === user.id
    const myItemId   = iAmFrom ? offerData.from_item_id : offerData.to_item_id
    const theirItemId = iAmFrom ? offerData.to_item_id  : offerData.from_item_id
    const otherUserId = iAmFrom ? offerData.to_user_id  : offerData.from_user_id

    const [
      { data: myItemData },
      { data: theirItemData },
      { data: otherUserData },
      { data: msgs },
      { data: ratingsData },
    ] = await Promise.all([
      supabase.from('items').select('*').eq('id', myItemId).single(),
      supabase.from('items').select('*').eq('id', theirItemId).single(),
      supabase.from('profiles').select('*').eq('id', otherUserId).single(),
      supabase.from('messages').select('*').eq('offer_id', offerId).order('created_at', { ascending: true }),
      supabase.from('ratings').select('score').eq('rated_id', otherUserId),
    ])

    setMyItem(myItemData)
    setTheirItem(theirItemData)
    setOtherUser(otherUserData)
    setMessages(msgs || [])
    if (ratingsData && ratingsData.length > 0) {
      const avg = ratingsData.reduce((sum: number, r: any) => sum + r.score, 0) / ratingsData.length
      setTrustScore(avg)
    } else {
      setTrustScore(null)
    }

    await supabase.from('messages')
      .update({ is_read: true })
      .eq('offer_id', offerId)
      .eq('receiver', user.id)
      .eq('is_read', false)

    await loadConversations(user.id)
  }

  useEffect(() => { init() }, [])

  const sendMessage = async () => {
    if (!text.trim() || !currentUser || !offer) return
    if (text.trim().length > 1000) return
    setSendError('')
    const msgText = text.trim()
    const otherUserId = offer.from_user_id === currentUser.id
      ? offer.to_user_id
      : offer.from_user_id

    const { error } = await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver: otherUserId,
      text: msgText,
      offer_id: offerId,
      is_read: false,
    })
    if (error) {
      setSendError('No se pudo enviar. Intenta de nuevo.')
      setTimeout(() => setSendError(''), 3000)
      return
    }
    setText('')
  }

  const handleReport = async () => {
    setShowMenu(false)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const myId = sessionData.session?.user?.id
      if (!myId) return

      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: myId,
          reported_id: otherUser?.id,
          offer_id: offerId ? Number(offerId) : null,
          reason: 'reported_from_chat',
        })

      if (!error) setReported(true)
    } catch (err) {
      console.error('Error al reportar:', err)
    }
  }

  const isMine = (m: any) => currentUser && m.sender_id === currentUser.id

  const progress = offer ? (STEPS[offer.status] ?? STEPS.pending) : STEPS.pending
  const progressPct = `${(progress.step / 3) * 100}%`

  if (notFound) return <div style={{ padding: 20, background: '#FDF8F3', minHeight: '100vh', color: '#1A2744' }}>Conversación no encontrada</div>
  if (!currentUser || !offer) return null

  const chatPanel = (inColumn: boolean) => (
    <>
      {/* HEADER */}
      <div style={s.header}>
        <button style={s.back} onClick={() => inColumn ? router.push('/mensajes') : router.back()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

        <div style={s.headerCenter} onClick={() => router.push(`/perfil/${otherUser?.id}`)}>
          {otherUser?.avatar_url ? (
            <img src={otherUser.avatar_url} style={s.avatar} />
          ) : (
            <div style={s.avatarFallback}>
              {(otherUser?.name || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <span style={s.headerName}>{otherUser?.name || 'Usuario'}</span>
        </div>

        <div style={s.menuWrapper}>
          <button
            style={s.menuBtn}
            onClick={e => { e.stopPropagation(); setShowMenu(v => !v) }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A2744" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="5"  r="1" fill="#1A2744" />
              <circle cx="12" cy="12" r="1" fill="#1A2744" />
              <circle cx="12" cy="19" r="1" fill="#1A2744" />
            </svg>
          </button>
          {showMenu && (
            <div style={s.menu}>
              <div style={s.menuItem} onClick={handleReport}>Reportar</div>
            </div>
          )}
        </div>
      </div>

      {/* ÁREA SCROLLABLE */}
      <div style={{ ...s.scrollArea, paddingBottom: inColumn ? 16 : undefined }}>

        {/* TARJETA INTERCAMBIO */}
        {myItem && theirItem && (
          <div style={s.contextCard}>
            <div style={s.contextTop}>
              <div style={s.contextIconWrap}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="17 1 21 5 17 9"/>
                  <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                  <polyline points="7 23 3 19 7 15"/>
                  <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
              </div>
              <div style={s.contextContent}>
                <span style={s.contextTitle}>
                  {myItem.title} por {theirItem.title}
                </span>
                <button
                  style={s.detailLink}
                  onClick={() => router.push(`/exchange/${offerId}`)}
                >
                  Ver detalle ›
                </button>
              </div>
            </div>

            <div style={s.progressTrack}>
              <div style={{ ...s.progressBar, width: progressPct }} />
            </div>

            <div style={s.progressLabel}>
              Paso {progress.step} de 3 · {progress.label}
            </div>
          </div>
        )}

        {/* TARJETA SCORE */}
        <div style={s.scoreCard}>
          <div style={s.scoreLeft}>
            <div style={s.scoreIconWrap}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B8A5A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span style={s.scoreLabel}>Score de confianza</span>
          </div>
          <div style={s.scoreBadge}>
            {trustScore !== null ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#2E7D55" style={{ flexShrink: 0 }}>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <span style={s.scoreNum}>{trustScore.toFixed(1)}</span>
              </>
            ) : (
              <span style={s.scoreNum}>Nuevo</span>
            )}
          </div>
        </div>

        {/* AVISO REPORTE */}
        {reported && (
          <div style={s.reportedBanner}>Reportado</div>
        )}

        {/* MENSAJES */}
        {messages.length === 0 && (
          <p style={s.empty}>Inicia la conversación con el otro usuario.</p>
        )}

        {messages.map((m, i) => {
          if (m.type === 'system') {
            return (
              <div key={m.id || i} style={s.systemMsg}>
                {m.text}
              </div>
            )
          }

          const mine = isMine(m)
          return (
            <div
              key={m.id || i}
              style={{ ...s.msg, ...(mine ? s.msgRight : s.msgLeft) }}
            >
              <div>{m.text}</div>
              <div style={s.msgMeta}>
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {mine && <span style={s.check}>{m.is_read ? '✓✓' : '✓'}</span>}
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      {sendError && (
        <div style={inColumn
          ? { background: '#FEE2E2', color: '#991B1B', borderRadius: 10, padding: '8px 16px', fontSize: 13, textAlign: 'center' as const }
          : { position: 'fixed' as const, bottom: 72, left: '50%', transform: 'translateX(-50%)', background: '#FEE2E2', color: '#991B1B', borderRadius: 10, padding: '8px 16px', fontSize: 13, zIndex: 30, whiteSpace: 'nowrap' as const }
        }>
          {sendError}
        </div>
      )}
      <div style={inColumn ? s.inputBarDesktop : s.inputBar}>
        <textarea
          value={text}
          onChange={e => {
            setText(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = e.target.scrollHeight + 'px'
          }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Escribe un mensaje..."
          maxLength={1000}
          rows={1}
          style={{ ...s.inputBox, resize: 'none', overflow: 'hidden', maxHeight: '120px', lineHeight: '1.4' }}
        />
        <button
          style={{ ...s.sendBtn, ...(!text.trim() ? s.sendOff : {}) }}
          onClick={sendMessage}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </>
  )

  if (isDesktop) {
    return (
      <div style={{ display: 'flex', height: '100vh' }} onClick={() => showMenu && setShowMenu(false)}>
        {/* LEFT COLUMN */}
        <div style={{ width: 380, borderRight: '1px solid #F0EAE0', overflowY: 'auto', background: '#FDF8F3', flexShrink: 0 }}>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1A2744', margin: '0 0 8px 0' }}>Mensajes</h2>
            {conversations.map(c => (
              <div
                key={c.offerId}
                onClick={() => router.push(`/mensajes/${c.offerId}`)}
                style={{
                  padding: 14, borderRadius: 16,
                  background: c.offerId === currentOfferId ? '#F0EAE0' : '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  border: `1px solid ${c.offerId === currentOfferId ? '#E0D4C8' : '#F0EAE4'}`,
                  display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                  width: '100%', boxSizing: 'border-box' as const,
                }}
              >
                <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: '#1A2744', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 16 }}>
                  {c.otherUser?.avatar_url
                    ? <img src={c.otherUser.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (c.otherUser?.name || c.otherUser?.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <strong style={{ fontSize: 15, display: 'block' }}>{c.otherUser?.name || c.otherUser?.username || 'Usuario'}</strong>
                  <div style={{ fontSize: 13, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lastMessage}</div>
                </div>
                {c.unread > 0 && (
                  <div style={{ background: '#F97316', color: '#fff', borderRadius: 999, padding: '4px 8px', fontSize: 12, flexShrink: 0 }}>{c.unread}</div>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* RIGHT COLUMN - CHAT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#FDF8F3' }}>
          {chatPanel(true)}
        </div>
      </div>
    )
  }

  return (
    <div style={s.container} onClick={() => showMenu && setShowMenu(false)}>
      {chatPanel(false)}
    </div>
  )
}

const s: any = {
  container: {
    background: '#FDF8F3',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },

  /* HEADER */
  header: {
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    background: '#FDF8F3',
    borderBottom: '1px solid #EDEDED',
    position: 'sticky',
    top: 0,
    zIndex: 20,
    flexShrink: 0,
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

  headerCenter: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    justifyContent: 'center',
    cursor: 'pointer',
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

  headerName: {
    fontWeight: 600,
    fontSize: 15,
  },

  menuWrapper: {
    position: 'relative',
  },

  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#F0EAE0',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  menu: {
    position: 'absolute',
    top: 36,
    right: 0,
    background: '#fff',
    borderRadius: 14,
    boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
    overflow: 'hidden',
    zIndex: 30,
    minWidth: 190,
  },

  menuItem: {
    padding: '14px 18px',
    fontSize: 14,
    cursor: 'pointer',
    color: '#C62828',
  },

  /* SCROLL AREA */
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 16px 100px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },

  /* CONTEXT CARD */
  contextCard: {
    background: '#fff',
    borderRadius: 16,
    padding: '14px 16px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    marginBottom: 2,
  },

  contextTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },

  contextIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    background: '#FFF0E6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  contextContent: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },

  contextTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1A2744',
    lineHeight: 1.4,
  },

  detailLink: {
    border: 'none',
    background: 'none',
    color: '#F97316',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    textAlign: 'left',
  },

  progressTrack: {
    height: 6,
    borderRadius: 99,
    background: '#F0EAE4',
    overflow: 'hidden',
  },

  progressBar: {
    height: '100%',
    borderRadius: 99,
    background: '#F97316',
    transition: 'width 0.4s ease',
  },

  progressLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#6F7A82',
  },

  /* SCORE CARD */
  scoreCard: {
    background: '#fff',
    borderRadius: 16,
    padding: '12px 16px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  scoreLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },

  scoreIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    background: '#E8F5EE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scoreLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1A2744',
  },

  scoreBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: '#E8F5EE',
    borderRadius: 99,
    padding: '6px 12px',
  },

  scoreNum: {
    fontSize: 15,
    fontWeight: 800,
    color: '#2E7D55',
  },

  scoreTag: {
    fontSize: 12,
    fontWeight: 600,
    color: '#3B8A5A',
  },

  /* REPORT */
  reportedBanner: {
    background: '#DCFCE7',
    color: '#166534',
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 13,
    textAlign: 'center',
  },

  /* MESSAGES */
  empty: {
    textAlign: 'center',
    color: '#6F7A82',
    fontSize: 13,
    margin: '30px 0',
  },

  systemMsg: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9AA3AB',
    background: '#EDE7E1',
    borderRadius: 99,
    padding: '4px 14px',
    alignSelf: 'center',
  },

  msg: {
    maxWidth: '75%',
    padding: '10px 14px',
    borderRadius: 18,
    fontSize: 14,
    display: 'flex',
    flexDirection: 'column',
  },

  msgLeft: {
    background: '#EDE5DD',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },

  msgRight: {
    background: '#F97316',
    color: '#fff',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },

  msgMeta: {
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

  /* INPUT - mobile (fixed) */
  inputBar: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 500,
    display: 'flex',
    gap: 10,
    padding: '10px 16px calc(20px + env(safe-area-inset-bottom))',
    background: '#fff',
    borderTop: '1px solid #EDEDED',
    alignItems: 'flex-end',
  },

  /* INPUT - desktop (inline en columna) */
  inputBarDesktop: {
    display: 'flex',
    gap: 10,
    padding: '10px 16px',
    background: '#fff',
    borderTop: '1px solid #EDEDED',
    alignItems: 'flex-end',
    flexShrink: 0,
  },

  inputBox: {
    flex: 1,
    padding: '11px 16px',
    borderRadius: 16,
    border: '1.5px solid #E0DAD5',
    fontSize: 16,
    outline: 'none',
    background: '#FDF8F3',
  },

  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: '50%',
    background: '#F97316',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },

  sendOff: {
    opacity: 0.35,
  },

}
