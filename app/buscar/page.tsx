'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '../lib/supabase'

const sanitizeQuery = (q: string) => q.replace(/[%_\\]/g, '\\$&')

const CATEGORIAS = [
  { id: 'electronica', label: '📱 Electrónica' },
  { id: 'ropa', label: '👕 Ropa' },
  { id: 'hogar', label: '🏠 Hogar' },
  { id: 'deportes', label: '⚽ Deportes' },
  { id: 'libros', label: '📚 Libros' },
  { id: 'juguetes', label: '🧸 Juguetes' },
  { id: 'musica', label: '🎸 Música' },
  { id: 'otros', label: '📦 Otros' },
]

const CITIES = [
  'Todas', 'Monterrey', 'CDMX', 'Guadalajara', 'Tijuana', 'Puebla',
  'León', 'Cancún', 'Mérida', 'San Luis Potosí', 'Chihuahua',
]

export default function BuscarPage() {
  const router = useRouter()
  const [query, setQuery]   = useState('')
  const [city, setCity]     = useState('Todas')
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null)
  const [items, setItems]   = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      search(query, city, categoriaActiva)
    }, query.length >= 2 ? 300 : 0)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, city, categoriaActiva])

  const search = async (q: string, selectedCity: string, selectedCategoria: string | null) => {
    setLoading(true)
    setSearchError(false)
    try {
      let req = supabase.from('items').select('*').eq('active', true)

      if (q.length >= 2) {
        const safeQuery = sanitizeQuery(q)
        req = req.or(
          `title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%,wanted.ilike.%${safeQuery}%,city.ilike.%${safeQuery}%`
        )
      } else {
        req = req.order('created_at', { ascending: false }).limit(12)
      }

      if (selectedCity !== 'Todas') {
        req = req.eq('city', selectedCity)
      }

      if (selectedCategoria) {
        req = req.eq('category', selectedCategoria)
      }

      const { data } = await req

      const userIds = [...new Set((data || []).map((i: any) => i.user_id))]
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds)

      const profileMap: Record<string, any> = {}
      profilesData?.forEach((p: any) => { profileMap[p.id] = p })

      setItems((data || []).map((item: any) => ({
        ...item,
        profile: profileMap[item.user_id] ?? null,
      })))
    } catch {
      setSearchError(true)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.container}>

      {/* HEADER */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => router.back()} aria-label="Volver">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div style={s.inputWrap}>
          <svg viewBox="0 0 24 24" width={15} height={15} style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7" stroke="#9AA3AB" strokeWidth="2" fill="none"/>
            <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="#9AA3AB" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            autoFocus
            style={s.input}
            placeholder="Buscar objetos, categorías, ciudades..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query.length > 0 && (
            <button style={s.clearBtn} onClick={() => setQuery('')} aria-label="Limpiar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#9AA3AB" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* CHIPS CIUDAD */}
      <div style={s.chipsRow}>
        {CITIES.map(c => (
          <div
            key={c}
            style={{
              ...s.chip,
              background: city === c ? '#F97316' : '#F0EAE0',
              color: city === c ? '#fff' : '#1A2744',
            }}
            onClick={() => setCity(c)}
          >
            {c}
          </div>
        ))}
      </div>

      {/* CHIPS CATEGORÍA */}
      <div style={s.chipsRow}>
        <div
          style={{
            ...s.chip,
            background: categoriaActiva === null ? '#F97316' : '#F0EAE0',
            color: categoriaActiva === null ? '#fff' : '#1A2744',
          }}
          onClick={() => setCategoriaActiva(null)}
        >
          Todas
        </div>
        {CATEGORIAS.map(cat => (
          <div
            key={cat.id}
            style={{
              ...s.chip,
              background: categoriaActiva === cat.id ? '#F97316' : '#F0EAE0',
              color: categoriaActiva === cat.id ? '#fff' : '#1A2744',
            }}
            onClick={() => setCategoriaActiva(cat.id)}
          >
            {cat.label}
          </div>
        ))}
      </div>

      {/* LABEL */}
      <div style={s.label}>
        {searchError
          ? 'Error al buscar, intenta de nuevo'
          : query.length >= 2
            ? `Resultados para "${query}"`
            : 'Sugerencias'}
      </div>

      {/* CONTENT */}
      {loading ? (
        <div style={s.grid}>
          {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState query={query} />
      ) : (
        <div style={s.grid}>
          {items.map(item => (
            <ItemCard key={item.id} item={item} router={router} />
          ))}
        </div>
      )}

    </div>
  )
}

function ItemCard({ item, router }: any) {
  const image = item?.images?.[0] || null
  return (
    <div style={s.card} onClick={() => router.push(`/item/${item.id}`)}>
      <div style={s.cardImg}>
        {image
          ? <img
              src={image}
              style={s.imgEl}
              alt={item.title}
              onError={e => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.parentElement!.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#F0EAE0"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C4BAB1" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>'
              }}
            />
          : <div style={{ ...s.imgFallback, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke="#C4BAB1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
        }
      </div>
      <div style={s.cardBody}>
        <div style={s.cardTitle}>{item.title}</div>
        <div style={s.cardWanted}>por {item.wanted || 'algo'}</div>
        <div style={s.ownerRow}>
          {item.profile?.avatar_url ? (
            <img src={item.profile.avatar_url} style={s.ownerAvatar} alt={`Avatar de ${item.profile?.username || 'usuario'}`} />
          ) : (
            <div style={s.ownerAvatarFallback}>
              {(item.profile?.username || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <span style={s.ownerName}>@{item.profile?.username || 'usuario'}</span>
        </div>
        {item.city && <div style={s.cardCity}>{item.city}</div>}
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{ ...s.card, overflow: 'hidden' }}>
      <div style={{ ...s.cardImg, background: '#EDE7DF', animation: 'pulse 1.4s ease-in-out infinite' }} />
      <div style={s.cardBody}>
        <div style={{ height: 12, borderRadius: 6, background: '#EDE7DF', marginBottom: 6, width: '80%' }} />
        <div style={{ height: 10, borderRadius: 6, background: '#EDE7DF', width: '55%' }} />
      </div>
    </div>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <div style={s.empty}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
        stroke="#C4BAB1" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
      </svg>
      <p style={s.emptyTitle}>
        {query.length >= 2 ? `Sin resultados para "${query}"` : 'Sin resultados'}
      </p>
      <p style={s.emptySub}>Intenta con otra palabra o categoría</p>
    </div>
  )
}

const s: any = {
  container: {
    minHeight: '100vh',
    background: '#FDF8F3',
    paddingBottom: 100,
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    position: 'sticky',
    top: 0,
    background: '#FDF8F3',
    zIndex: 10,
  },

  backBtn: {
    width: 40,
    height: 40,
    border: 'none',
    background: '#F0EAE0',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#1A2744',
    flexShrink: 0,
  },

  inputWrap: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#F0EAE0',
    borderRadius: 12,
    padding: '10px 12px',
  },

  input: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: 15,
    color: '#1A2744',
    outline: 'none',
  },

  clearBtn: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },

  chipsRow: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    padding: '4px 16px 10px',
    scrollbarWidth: 'none',
  },

  chip: {
    borderRadius: 999,
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    transition: 'all 0.15s ease',
  },

  label: {
    padding: '0 16px 10px',
    fontSize: 13,
    fontWeight: 600,
    color: '#9AA3AB',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    padding: '0 16px',
  },

  card: {
    background: '#fff',
    border: '1px solid #F0EBE3',
    borderRadius: 16,
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
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
    background: '#E8E0D8',
  },

  cardBody: { padding: 10 },

  cardTitle: {
    fontWeight: 700,
    fontSize: 13,
    color: '#1A2744',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  cardWanted: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  ownerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },

  ownerAvatar: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    objectFit: 'cover',
  },

  ownerAvatarFallback: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#F0EAE0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontWeight: 700,
    color: '#1A2744',
  },

  ownerName: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  cardCity: { fontSize: 11, color: '#C4BAB1', marginTop: 4 },

  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 32px',
    textAlign: 'center',
    gap: 10,
  },

  emptyTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: '#1A2744',
  },

  emptySub: {
    margin: 0,
    fontSize: 14,
    fontWeight: 500,
    color: '#9AA3AB',
    lineHeight: 1.5,
  },
}
