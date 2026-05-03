'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import supabase from '../lib/supabase'

export default function OfferPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const itemId = searchParams.get('itemId')

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [myItems, setMyItems] = useState<any[]>([])
  const [targetItem, setTargetItem] = useState<any>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [message, setMessage] = useState('')
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
    setLoading(false)
  }

  const handleSend = async () => {
    if (!selected || !currentUser || !targetItem) return
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

    if (message.trim()) {
      await supabase.from('messages').insert({
        sender_id: currentUser.id,
        receiver: targetItem.user_id,
        text: message.trim(),
        offer_id: offer.id,
        is_read: false,
      })
    }

    router.push(`/mensajes/oferta/${offer.id}`)
  }

  return (
    <div style={styles.screen}>
      <div style={styles.sheet}>

        {/* Header */}
        <div style={styles.header}>
          <button onClick={() => router.back()} style={styles.back}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div>
            <h2 style={styles.title}>¿Qué ofreces a cambio?</h2>
            {targetItem && (
              <p style={styles.subtitle}>
                Por: <span style={{ color: '#F97316' }}>{targetItem.title}</span>
              </p>
            )}
          </div>
        </div>

        <p style={styles.label}>Selecciona uno de tus items</p>

        {/* Lista */}
        <div style={styles.list}>
          {loading ? (
            <p style={{ color: '#6F7A82', fontSize: 14 }}>Cargando tus items...</p>
          ) : myItems.length === 0 ? (
            <p style={{ color: '#6F7A82', fontSize: 14 }}>
              No tienes items publicados aún.{' '}
              <span
                style={{ color: '#F97316', cursor: 'pointer' }}
                onClick={() => router.push('/crear')}
              >
                Publicar uno
              </span>
            </p>
          ) : (
            myItems.map(item => {
              const isSelected = selected === item.id

              return (
                <div
                  key={item.id}
                  onClick={() => setSelected(isSelected ? null : item.id)}
                  style={{ ...styles.card, ...(isSelected ? styles.cardActive : {}) }}
                >
                  <img
                    src={item.images?.[0] || '/placeholder.png'}
                    style={styles.image}
                  />

                  <div style={styles.info}>
                    <p style={styles.itemTitle}>{item.title}</p>
                    {item.wanted && (
                      <p style={styles.itemSub}>Busca: {item.wanted}</p>
                    )}
                  </div>

                  <div style={{
                    ...styles.radio,
                    ...(isSelected ? styles.radioActive : {}),
                  }}>
                    {isSelected && <div style={styles.radioDot} />}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Mensaje opcional */}
        <textarea
          placeholder="Agrega un mensaje (opcional)..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={styles.textarea}
          maxLength={250}
        />

        {/* Footer */}
        <div style={styles.footer}>
          <button style={styles.cancel} onClick={() => router.back()}>
            Cancelar
          </button>

          <button
            style={{
              ...styles.send,
              ...(!selected || sending ? styles.disabled : {}),
            }}
            disabled={!selected || sending}
            onClick={handleSend}
          >
            {sending ? 'Enviando...' : 'Confirmar oferta'}
          </button>
        </div>

        <p style={styles.note}>
          La otra persona recibirá tu propuesta y podrán chatear.
        </p>

      </div>
    </div>
  )
}

const styles: any = {
  screen: {
    background: '#F6F3F0',
    minHeight: '100vh',
  },

  sheet: {
    padding: 20,
    paddingBottom: 40,
    maxWidth: 500,
    margin: '0 auto',
  },

  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
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
  },

  subtitle: {
    fontSize: 14,
    color: '#6F7A82',
    margin: '4px 0 0',
  },

  label: {
    fontWeight: 600,
    fontSize: 14,
    color: '#3D3D3D',
    marginBottom: 12,
  },

  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 16,
  },

  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    border: '1.5px solid #E5E7EB',
    cursor: 'pointer',
    background: '#fff',
  },

  cardActive: {
    border: '2px solid #F97316',
    background: '#FFF7F2',
  },

  image: {
    width: 52,
    height: 52,
    borderRadius: 12,
    objectFit: 'cover',
    flexShrink: 0,
  },

  info: {
    flex: 1,
  },

  itemTitle: {
    fontWeight: 600,
    margin: 0,
    fontSize: 14,
  },

  itemSub: {
    fontSize: 12,
    color: '#6F7A82',
    margin: '2px 0 0',
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    border: '2px solid #ccc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  radioActive: {
    border: '2px solid #F97316',
  },

  radioDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: '#F97316',
  },

  textarea: {
    width: '100%',
    minHeight: 80,
    borderRadius: 12,
    border: '1px solid #ddd',
    padding: 12,
    fontSize: 14,
    resize: 'none',
    background: '#fff',
  },

  footer: {
    display: 'flex',
    gap: 10,
    marginTop: 16,
  },

  cancel: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    border: '1px solid #ddd',
    background: '#fff',
    fontSize: 14,
    cursor: 'pointer',
  },

  send: {
    flex: 2,
    padding: 14,
    borderRadius: 14,
    background: '#F97316',
    color: '#fff',
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },

  disabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },

  note: {
    marginTop: 12,
    fontSize: 12,
    color: '#6F7A82',
    textAlign: 'center',
  },
}
