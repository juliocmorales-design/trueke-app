'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import supabase from '@/app/lib/supabase'

export default function OfferNewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const itemId = searchParams.get('itemId')

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [targetItem, setTargetItem] = useState<any>(null)
  const [targetOwner, setTargetOwner] = useState<any>(null)
  const [myItems, setMyItems] = useState<any[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user
    if (!user) return
    setCurrentUser(user)

    const [{ data: target }, { data: mine }] = await Promise.all([
      supabase.from('items').select('*').eq('id', itemId).single(),
      supabase.from('items').select('*').eq('user_id', user.id),
    ])

    setTargetItem(target)
    setMyItems(mine || [])

    if (target?.user_id) {
      const { data: owner } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url')
        .eq('id', target.user_id)
        .single()
      setTargetOwner(owner)
    }

    setLoading(false)
  }

  const handleSend = async () => {
    if (!selected || !currentUser || !targetItem || sending) return
    setSending(true)

    const { data: offer, error } = await supabase
      .from('offers')
      .insert({
        from_user_id: currentUser.id,
        to_user_id: targetItem.user_id,
        from_item_id: selected,
        to_item_id: itemId,
        status: 'pending',
      })
      .select()
      .single()

    if (error || !offer) {
      setSending(false)
      return
    }

    await supabase.from('offer_items').insert([
      { offer_id: offer.id, item_id: selected, type: 'offered' },
      { offer_id: offer.id, item_id: itemId, type: 'requested' },
    ])

    router.push(`/mensajes/${offer.id}`)
  }

  const targetImage = targetItem?.images?.[0] || targetItem?.image || null
  const ownerHandle = targetOwner?.username
    ? `@${targetOwner.username}`
    : targetOwner?.name || 'Usuario'

  return (
    <div style={s.screen}>

      {/* HEADER */}
      <div style={s.header}>
        <button style={s.back} onClick={() => router.back()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <h1 style={s.title}>¿Qué ofreces a cambio?</h1>
      </div>

      <div style={s.body}>
        <p style={s.subtitle}>
          Selecciona el objeto que propones para este intercambio
        </p>

        {/* TARJETA CONTEXTO */}
        {targetItem && (
          <div style={s.contextCard}>
            <div style={s.contextLeft}>
              {targetImage ? (
                <img src={targetImage} style={s.contextImg} />
              ) : (
                <div style={s.contextImgFallback}>📦</div>
              )}
              <div style={s.contextText}>
                <span style={s.contextLabel}>Quieres:</span>
                <span style={s.contextItemTitle}>{targetItem.title}</span>
                <span style={s.contextOwner}>{ownerHandle}</span>
              </div>
            </div>
            <div style={s.exchangeIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9"/>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                <polyline points="7 23 3 19 7 15"/>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
              </svg>
            </div>
          </div>
        )}

        {/* SECCIÓN MIS ITEMS */}
        <div style={s.sectionRow}>
          <span style={s.sectionTitle}>Tus objetos publicados</span>
          {!loading && (
            <span style={s.counter}>{myItems.length} items</span>
          )}
        </div>

        {/* LISTA */}
        {loading ? (
          <div style={s.loadingText}>Cargando tus items...</div>
        ) : myItems.length === 0 ? (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>📭</div>
            <p style={s.emptyText}>
              Primero publica algo para poder hacer un intercambio
            </p>
            <button style={s.emptyBtn} onClick={() => router.push('/crear')}>
              Publicar algo
            </button>
          </div>
        ) : (
          <div style={s.list}>
            {myItems.map(item => {
              const img = item.images?.[0] || item.image || null
              const isSelected = selected === item.id
              return (
                <div
                  key={item.id}
                  style={{ ...s.card, ...(isSelected ? s.cardSelected : {}) }}
                  onClick={() => setSelected(isSelected ? null : item.id)}
                >
                  {img ? (
                    <img src={img} style={s.cardImg} />
                  ) : (
                    <div style={s.cardImgFallback}>📦</div>
                  )}
                  <div style={s.cardInfo}>
                    <span style={s.cardTitle}>{item.title}</span>
                    {item.wanted && (
                      <span style={s.cardSub}>Busca: {item.wanted}</span>
                    )}
                  </div>
                  <div style={{ ...s.radio, ...(isSelected ? s.radioSelected : {}) }}>
                    {isSelected && <div style={s.radioDot} />}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* BOTÓN FIJO */}
      <div style={s.footer}>
        <button
          style={{ ...s.sendBtn, ...(!selected || sending ? s.sendDisabled : {}) }}
          disabled={!selected || sending}
          onClick={handleSend}
        >
          {sending ? 'Enviando...' : 'Proponer intercambio'}
        </button>
      </div>

    </div>
  )
}

const s: any = {
  screen: {
    minHeight: '100vh',
    background: '#F6F3F0',
    display: 'flex',
    flexDirection: 'column',
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '16px 16px 0',
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

  title: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
    color: '#1E1E1E',
  },

  body: {
    flex: 1,
    padding: '16px 16px 120px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },

  subtitle: {
    margin: 0,
    fontSize: 14,
    color: '#6F7A82',
    lineHeight: 1.5,
  },

  /* CONTEXT CARD */
  contextCard: {
    background: '#FFF7F2',
    border: '1.5px solid #F0DDD0',
    borderRadius: 18,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  contextLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    overflow: 'hidden',
  },

  contextImg: {
    width: 56,
    height: 56,
    borderRadius: 12,
    objectFit: 'cover',
    flexShrink: 0,
  },

  contextImgFallback: {
    width: 56,
    height: 56,
    borderRadius: 12,
    background: '#F0E8E2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    flexShrink: 0,
  },

  contextText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    overflow: 'hidden',
  },

  contextLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#F97316',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  contextItemTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1E1E1E',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  contextOwner: {
    fontSize: 12,
    color: '#6F7A82',
  },

  exchangeIcon: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#FFE8D5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  /* SECTION */
  sectionRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1E1E1E',
  },

  counter: {
    fontSize: 12,
    color: '#6F7A82',
    background: '#EDE7E1',
    padding: '3px 10px',
    borderRadius: 20,
  },

  loadingText: {
    fontSize: 14,
    color: '#6F7A82',
    textAlign: 'center',
    padding: 20,
  },

  /* EMPTY STATE */
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: '32px 0',
  },

  emptyIcon: {
    fontSize: 40,
  },

  emptyText: {
    fontSize: 14,
    color: '#6F7A82',
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 1.5,
    margin: 0,
  },

  emptyBtn: {
    background: '#F97316',
    color: '#fff',
    border: 'none',
    borderRadius: 16,
    padding: '12px 24px',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  },

  /* ITEM LIST */
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },

  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 16,
    border: '1.5px solid #E8E2DC',
    background: '#fff',
    cursor: 'pointer',
  },

  cardSelected: {
    border: '2px solid #F97316',
    background: '#FFF7F2',
  },

  cardImg: {
    width: 56,
    height: 56,
    borderRadius: 12,
    objectFit: 'cover',
    flexShrink: 0,
  },

  cardImgFallback: {
    width: 56,
    height: 56,
    borderRadius: 12,
    background: '#F0E8E2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    flexShrink: 0,
  },

  cardInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    overflow: 'hidden',
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1E1E1E',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  cardSub: {
    fontSize: 12,
    color: '#6F7A82',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    border: '2px solid #D0C8C0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  radioSelected: {
    border: '2px solid #F97316',
  },

  radioDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: '#F97316',
  },

  /* FOOTER */
  footer: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 500,
    padding: '12px 16px 28px',
    background: '#F6F3F0',
    borderTop: '1px solid #EDE7E1',
  },

  sendBtn: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    background: '#F97316',
    color: '#fff',
    border: 'none',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
  },

  sendDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
}
