'use client'

import { useEffect, useState } from 'react'
import supabase from '../lib/supabase'

const myUser = 'user_1'

export default function IntercambiosPage() {
  const [received, setReceived] = useState<any[]>([])
  const [sent, setSent] = useState<any[]>([])
  const [itemsMap, setItemsMap] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const { data: offers } = await supabase.from('offers').select('*')
    const { data: items } = await supabase.from('items').select('*')

    const map: any = {}
    items?.forEach(i => (map[i.id] = i))

    const r: any[] = []
    const s: any[] = []

    offers?.forEach(o => {
      const from = map[o.from_item_id]
      const to = map[o.to_item_id]

      if (!from || !to) return

      if (to.user_id === myUser) r.push(o)
      if (from.user_id === myUser) s.push(o)
    })

    setItemsMap(map)
    setReceived(r)
    setSent(s)
    setLoading(false)
  }

  const updateStatus = async (id: number, status: string) => {
    await supabase.from('offers').update({ status }).eq('id', id)
    load()
  }

  if (loading) return <div style={{ padding: 20 }}>Cargando...</div>

  return (
    <div style={{ padding: 16, paddingBottom: 120 }}>
      <h2>📥 Recibidos</h2>

      {received.map(o => (
        <div key={o.id} style={styles.card}>
          <Row o={o} itemsMap={itemsMap} />

          <div>Estado: {o.status}</div>

          {o.status === 'accepted' && (
            <button
              style={styles.chat}
              onClick={() => (window.location.href = `/chat/${o.id}`)}
            >
              💬 Abrir chat
            </button>
          )}

          {o.status === 'pending' && (
            <div style={styles.actions}>
              <button
                style={styles.accept}
                onClick={() => updateStatus(o.id, 'accepted')}
              >
                Aceptar
              </button>
              <button
                style={styles.reject}
                onClick={() => updateStatus(o.id, 'rejected')}
              >
                Rechazar
              </button>
            </div>
          )}
        </div>
      ))}

      <h2 style={{ marginTop: 20 }}>📤 Enviados</h2>

      {sent.map(o => (
        <div key={o.id} style={styles.card}>
          <Row o={o} itemsMap={itemsMap} />
          <div>Estado: {o.status}</div>

          {o.status === 'accepted' && (
            <button
              style={styles.chat}
              onClick={() => (window.location.href = `/chat/${o.id}`)}
            >
              💬 Abrir chat
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

function Row({ o, itemsMap }: any) {
  const from = itemsMap[o.from_item_id]
  const to = itemsMap[o.to_item_id]

  return (
    <div style={styles.row}>
      <Item item={from} />
      <span>🔁</span>
      <Item item={to} />
    </div>
  )
}

function Item({ item }: any) {
  if (!item) return null

  const img =
    Array.isArray(item.images) && item.images.length > 0
      ? item.images[0]
      : '/images/placeholder.jpg'

  return (
    <div style={styles.item}>
      <img src={img} style={styles.img} />
      <div style={{ fontSize: 12 }}>{item.title}</div>
    </div>
  )
}

const styles: any = {
  card: {
    background: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  item: {
    width: '40%',
    textAlign: 'center'
  },
  img: {
    width: '100%',
    height: 80,
    objectFit: 'cover',
    borderRadius: 8
  },
  actions: {
    display: 'flex',
    gap: 10,
    marginTop: 10
  },
  accept: {
    flex: 1,
    background: 'green',
    color: '#fff',
    border: 'none',
    padding: 10,
    borderRadius: 8
  },
  reject: {
    flex: 1,
    background: 'red',
    color: '#fff',
    border: 'none',
    padding: 10,
    borderRadius: 8
  },
  chat: {
    marginTop: 10,
    width: '100%',
    padding: 10,
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8
  }
}