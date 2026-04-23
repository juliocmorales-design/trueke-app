'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import supabase  from '../../lib/supabase'

export default function ExchangePage() {
  const params = useParams()
  const router = useRouter()
  const toItemId = Number(params?.id)

  const [myItems, setMyItems] = useState<any[]>([])
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    loadMyItems()
  }, [])

  const loadMyItems = async () => {
    const user_id = localStorage.getItem('user_id')

    const { data } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', user_id) // 🔥 SOLO TUS ITEMS

    setMyItems(data || [])
  }

  const createOffer = async () => {
    if (!selected) return alert('Selecciona un objeto')

    const { error } = await supabase.from('offers').insert([
      {
        from_item_id: selected,
        to_item_id: toItemId,
        status: 'pending'
      }
    ])

    if (error) {
      alert('Error')
      return
    }

    alert('🔥 Oferta enviada')
    router.push('/intercambios')
  }

  return (
    <div style={styles.container}>
      <h2>Elige qué ofrecer</h2>

      <div style={styles.grid}>
        {myItems.map(item => {
          const image =
            item.image ||
            item.images?.[0] ||
            '/images/placeholder.jpg'

          return (
            <div
              key={item.id}
              onClick={() => setSelected(item.id)}
              style={{
                ...styles.card,
                border:
                  selected === item.id
                    ? '2px solid orange'
                    : '1px solid #ddd'
              }}
            >
              <img src={image} style={styles.image} />
              <div style={styles.title}>{item.title}</div>
            </div>
          )
        })}
      </div>

      <button style={styles.button} onClick={createOffer}>
        Enviar intercambio 🔁
      </button>
    </div>
  )
}

const styles: any = {
  container: {
    padding: 16,
    paddingBottom: 120
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginTop: 10
  },

  card: {
    borderRadius: 12,
    overflow: 'hidden',
    background: '#fff',
    cursor: 'pointer'
  },

  image: {
    width: '100%',
    height: 120,
    objectFit: 'cover'
  },

  title: {
    padding: 8,
    fontSize: 13
  },

  button: {
    marginTop: 20,
    width: '100%',
    padding: 14,
    borderRadius: 12,
    border: 'none',
    background: '#ff7a00',
    color: '#fff',
    fontWeight: 600
  }
}