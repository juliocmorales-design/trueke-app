'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '../lib/supabase'

type Chain = {
  id: number
  status: string
  steps_count: number
  initial_item_id: number | null
  created_at: string
  itemTitle?: string
  itemImage?: string | null
}

export default function MisCadenasPage() {
  const router = useRouter()
  const [chains, setChains] = useState<Chain[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    /* Query 1: cadenas creadas por el usuario */
    const { data: created } = await supabase
      .from('chains')
      .select('id, status, steps_count, initial_item_id, created_at')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })

    /* Query 2: cadenas en las que participa como paso intermedio */
    const { data: steps } = await supabase
      .from('chain_steps')
      .select('chain_id')
      .eq('from_user_id', user.id)

    let participated: Chain[] = []
    if (steps && steps.length > 0) {
      const chainIds = [...new Set(steps.map((s: any) => s.chain_id))]
      const { data: partChains } = await supabase
        .from('chains')
        .select('id, status, steps_count, initial_item_id, created_at')
        .in('id', chainIds)
        .order('created_at', { ascending: false })
      participated = partChains || []
    }

    /* Merge, dedup by id */
    const allMap = new Map<number, Chain>()
    for (const c of [...(created || []), ...participated]) {
      if (!allMap.has(c.id)) allMap.set(c.id, c)
    }
    const all = Array.from(allMap.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    /* Fetch initial items */
    const itemIds = [...new Set(all.map(c => c.initial_item_id).filter(Boolean))] as number[]
    let itemsMap: Record<number, { title: string; images: string[] | null }> = {}
    if (itemIds.length > 0) {
      const { data: items } = await supabase
        .from('items')
        .select('id, title, images')
        .in('id', itemIds)
      items?.forEach((i: any) => { itemsMap[i.id] = i })
    }

    const enriched = all.map(c => ({
      ...c,
      itemTitle: c.initial_item_id ? itemsMap[c.initial_item_id]?.title : undefined,
      itemImage: c.initial_item_id ? (itemsMap[c.initial_item_id]?.images?.[0] ?? null) : null,
    }))

    setChains(enriched)
    setLoading(false)
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div style={s.container}>

      {/* HEADER */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => router.back()} aria-label="Volver">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span style={s.title}>Mis cadenas</span>
        <div style={{ width: 40 }} />
      </div>

      {loading ? (
        <div style={s.loadingWrap}>Cargando…</div>

      ) : chains.length === 0 ? (
        <div style={s.emptyWrap}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none"
            stroke="#C4BAB1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          <p style={s.emptyTitle}>Aún no tienes cadenas</p>
          <p style={s.emptySub}>Completa un intercambio y elige continuar la cadena</p>
          <button style={s.emptyBtn} onClick={() => router.push('/')}>
            Explorar items
          </button>
        </div>

      ) : (
        <div style={s.list}>
          {chains.map(c => (
            <div key={c.id} style={s.card} onClick={() => router.push(`/chain/${c.id}`)}>
              <div style={s.cardImg}>
                {c.itemImage
                  ? <img src={c.itemImage} alt={c.itemTitle} style={s.img} />
                  : <div style={s.imgFallback}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="#C4BAB1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                      </svg>
                    </div>
                }
              </div>

              <div style={s.cardBody}>
                <div style={s.cardTitle}>{c.itemTitle || `Cadena #${c.id}`}</div>
                <div style={s.cardMeta}>
                  <span style={s.steps}>{c.steps_count} {c.steps_count === 1 ? 'paso' : 'pasos'}</span>
                  <span style={s.dot}>·</span>
                  <span style={s.date}>{formatDate(c.created_at)}</span>
                </div>
              </div>

              <div style={{
                ...s.badge,
                background: c.status === 'active' ? '#DCFCE7' : '#F0EAE0',
                color: c.status === 'active' ? '#16A34A' : '#9AA3AB',
              }}>
                {({ active: 'Activa', completed: 'Completada', cancelled: 'Cancelada' } as Record<string, string>)[c.status] ?? c.status}
              </div>
            </div>
          ))}
        </div>
      )}

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
    justifyContent: 'space-between',
    padding: '12px 16px 16px',
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

  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1A2744',
  },

  loadingWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
    color: '#9AA3AB',
    fontSize: 14,
  },

  emptyWrap: {
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
    fontSize: 18,
    fontWeight: 700,
    color: '#1A2744',
  },

  emptySub: {
    margin: 0,
    fontSize: 14,
    fontWeight: 500,
    color: '#9AA3AB',
    lineHeight: 1.6,
  },

  emptyBtn: {
    marginTop: 8,
    background: '#F97316',
    color: '#fff',
    border: 'none',
    borderRadius: 16,
    padding: '14px 28px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },

  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '4px 16px',
  },

  card: {
    background: '#fff',
    borderRadius: 16,
    border: '1px solid #F0EBE3',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    cursor: 'pointer',
  },

  cardImg: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    background: '#F0EAE0',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },

  imgFallback: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },

  cardBody: {
    flex: 1,
    minWidth: 0,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1A2744',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },

  steps: {
    fontSize: 12,
    color: '#9AA3AB',
  },

  dot: {
    fontSize: 12,
    color: '#C4BAB1',
  },

  date: {
    fontSize: 12,
    color: '#9AA3AB',
  },

  badge: {
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 600,
    flexShrink: 0,
  },
}
