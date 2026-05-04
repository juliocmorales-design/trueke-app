'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/app/lib/supabase'

type Item = {
  id: number
  title: string
  wanted: string | null
  city: string | null
  images: string[] | null
  created_at: string
}

export default function MisPublicacionesPage() {
  const router = useRouter()
  const [items,     setItems]     = useState<Item[]>([])
  const [loading,   setLoading]   = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user
      if (!user) { router.replace('/login'); return }

      const { data } = await supabase
        .from('items')
        .select('id, title, wanted, city, images, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setItems(data || [])
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => router.back()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <h1 style={styles.title}>Mis publicaciones</h1>
        <div style={{ width: 40 }} />
      </div>

      {loading ? (
        <div style={styles.center}>Cargando...</div>
      ) : loadError ? (
        <div style={styles.center}>Error al cargar las publicaciones. Intenta de nuevo.</div>
      ) : items.length === 0 ? (
        <div style={styles.empty}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1C8BE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <p style={styles.emptyText}>Aún no tienes publicaciones</p>
          <p style={styles.emptySubtext}>Publica tu primer artículo para intercambiar</p>
          <button style={styles.ctaBtn} onClick={() => router.push('/crear')}>
            Publicar ahora
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {items.map(item => (
            <ItemCard key={item.id} item={item} onClick={() => router.push(`/item/${item.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}

function ItemCard({ item, onClick }: { item: Item; onClick: () => void }) {
  const img = item.images?.[0] ?? null

  return (
    <div style={styles.card} onClick={onClick}>
      <div style={styles.cardImg}>
        {img
          ? <img src={img} alt={item.title} style={styles.imgEl} />
          : <div style={styles.imgFallback} />
        }
      </div>
      <div style={styles.cardBody}>
        <div style={styles.itemTitle}>{item.title}</div>
        {item.wanted && (
          <div style={styles.itemWanted}>por {item.wanted}</div>
        )}
        {item.city && (
          <div style={styles.itemCity}>{item.city}</div>
        )}
      </div>
    </div>
  )
}

const styles: any = {
  container: {
    background: '#FDF8F3',
    minHeight: '100vh',
    paddingBottom: 68,
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 16px 12px',
    background: '#FDF8F3',
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#F0EAE0',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },

  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1A2744',
    margin: 0,
  },

  center: {
    display: 'flex',
    justifyContent: 'center',
    padding: 40,
    color: '#9CA3AF',
  },

  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    padding: '60px 32px',
    textAlign: 'center',
  },

  emptyText: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: '#1A2744',
  },

  emptySubtext: {
    margin: 0,
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 1.5,
  },

  ctaBtn: {
    marginTop: 8,
    background: '#F97316',
    color: '#fff',
    border: 'none',
    borderRadius: 16,
    padding: '12px 28px',
    fontSize: 15,
    fontWeight: 700,
    fontFamily: 'inherit',
    cursor: 'pointer',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    padding: '4px 16px',
  },

  card: {
    background: '#FFFFFF',
    border: '1px solid #F0EBE3',
    borderRadius: 16,
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },

  cardImg: {
    width: '100%',
    aspectRatio: '1 / 1',
    overflow: 'hidden',
    background: '#EDE7DF',
  },

  imgEl: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },

  imgFallback: {
    width: '100%',
    height: '100%',
    background: '#E0D8D0',
  },

  cardBody: {
    padding: 10,
  },

  itemTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#1A2744',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  itemWanted: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  itemCity: {
    fontSize: 11,
    color: '#C4BAB1',
    marginTop: 4,
  },
}
