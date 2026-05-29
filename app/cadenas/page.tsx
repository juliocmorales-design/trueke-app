'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import supabase from '@/app/lib/supabase'
import { useIsDesktop } from '@/app/hooks/useIsDesktop'

type ChainItem = { id: number; title: string; images: string[] | null }
type Profile   = { id: string; username: string | null; avatar_url: string | null }

type Chain = {
  id: number
  creator_id: string
  initial_item_id: number
  status: string
  steps_count: number
  created_at: string
  steps:        Array<{ step_number: number; item_id: number }>
  initialItem:  ChainItem | null
  middle1Item:  ChainItem | null
  middle2Item:  ChainItem | null
  finalItem:    ChainItem | null
  hiddenCount:  number
  creator:      Profile   | null
}

type Filter = 'populares' | 'recientes' | 'epicas'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'populares', label: 'Populares' },
  { key: 'recientes', label: 'Recientes' },
  { key: 'epicas',    label: 'Épicas' },
]

export default function CadenasPage() {
  const router = useRouter()
  const [chains,  setChains]  = useState<Chain[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState<Filter>('populares')
  const isDesktop = useIsDesktop()

  const loadChains = async () => {
    const { data: rawChains } = await supabase
      .from('chains')
      .select('id, creator_id, initial_item_id, status, steps_count, created_at')
      .in('status', ['active', 'completed'])
      .limit(20)

    if (!rawChains?.length) { setLoading(false); return }

    const chainIds    = rawChains.map((c: any) => c.id)
    const creatorIds  = [...new Set(rawChains.map((c: any) => c.creator_id).filter(Boolean))]
    const initItemIds = [...new Set(rawChains.map((c: any) => c.initial_item_id).filter(Boolean))]

    const [{ data: stepsData }, { data: profilesData }, { data: initItemsData }] = await Promise.all([
      supabase.from('chain_steps').select('chain_id, step_number, item_id').in('chain_id', chainIds).order('step_number', { ascending: true }),
      creatorIds.length > 0  ? supabase.from('profiles').select('id, username, avatar_url').in('id', creatorIds as string[]) : { data: [] },
      initItemIds.length > 0 ? supabase.from('items').select('id, title, images').in('id', initItemIds as number[])          : { data: [] },
    ])

    const stepItemIds = [...new Set((stepsData || []).map((s: any) => s.item_id).filter(Boolean))]

    let stepItemsData: ChainItem[] = []
    if (stepItemIds.length > 0) {
      const { data } = await supabase.from('items').select('id, title, images').in('id', stepItemIds)
      stepItemsData = (data || []) as ChainItem[]
    }

    const profileMap: Record<string, Profile> = {}
    profilesData?.forEach((p: any) => { profileMap[p.id] = p })

    const itemMap: Record<number, ChainItem> = {}
    ;[...(initItemsData || []), ...stepItemsData].forEach((i: any) => { itemMap[i.id] = i })

    const stepsByChain: Record<number, Array<{ step_number: number; item_id: number }>> = {}
    stepsData?.forEach((s: any) => {
      if (!stepsByChain[s.chain_id]) stepsByChain[s.chain_id] = []
      stepsByChain[s.chain_id].push(s)
    })

    const enriched: Chain[] = rawChains.map((c: any) => {
      const steps = (stepsByChain[c.id] || []).sort((a: any, b: any) => a.step_number - b.step_number)
      const n     = steps.length

      // N=1: only final. N=2: m1+final. N>=3: m1+m2+final, +N for hidden beyond 3
      const m1   = n >= 2 ? steps[0]       : null
      const m2   = n >= 3 ? steps[1]       : null
      const last = n >= 1 ? steps[n - 1]   : null

      return {
        ...c,
        steps,
        initialItem: itemMap[c.initial_item_id] ?? null,
        middle1Item: m1   ? (itemMap[m1.item_id]   ?? null) : null,
        middle2Item: m2   ? (itemMap[m2.item_id]   ?? null) : null,
        finalItem:   last ? (itemMap[last.item_id] ?? null) : null,
        hiddenCount: Math.max(0, n - 3),
        creator:     profileMap[c.creator_id]      ?? null,
      }
    })

    setChains(enriched)
    setLoading(false)
  }

  useEffect(() => { loadChains() }, [])

  const filtered = (() => {
    let list = [...chains]
    if (filter === 'epicas')    list = list.filter(c => c.steps_count >= 4)
    if (filter === 'populares') list.sort((a, b) => b.steps_count - a.steps_count)
    if (filter === 'recientes') list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return list
  })()

  const shimmerStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg,#eee 25%,#ddd 37%,#eee 63%)',
    backgroundSize: '400% 100%',
    animation: 'shimmer 1.4s ease infinite',
    borderRadius: 8,
  }

  return (
    <div style={{ background: '#FDF8F3', minHeight: '100vh', paddingBottom: 40, ...(isDesktop && { maxWidth: 860, margin: '0 auto', padding: '32px 24px' }) }}>

      {/* HEADER */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 16px 12px', background: '#FDF8F3',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => router.back()}
          style={{
            width: 40, height: 40, borderRadius: '50%', background: '#F0EAE0',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#1A2744' }}>Cadenas destacadas</span>
        <div style={{ width: 40 }} />
      </div>

      {/* FILTER TABS */}
      <div style={{
        display: 'flex', gap: 8, padding: '0 16px 16px',
        overflowX: 'auto', scrollbarWidth: 'none',
      } as React.CSSProperties}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              flexShrink: 0, padding: '8px 18px', borderRadius: 999,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 14, fontWeight: 600, transition: 'all 0.15s',
              background: filter === f.key ? '#F97316' : '#F0EAE0',
              color:      filter === f.key ? '#fff'    : '#1A2744',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {loading ? (
          <>
            <style>{`@keyframes shimmer{0%{background-position:100% 50%}100%{background-position:0 50%}}`}</style>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, flexShrink: 0, ...shimmerStyle }} />
                  <div style={{ width: 18, height: 14, ...shimmerStyle }} />
                  <div style={{ width: 56, height: 56, borderRadius: 12, flexShrink: 0, ...shimmerStyle }} />
                </div>
                <div style={{ height: 14, width: '65%', ...shimmerStyle }} />
                <div style={{ height: 12, width: '40%', ...shimmerStyle }} />
              </div>
            ))}
          </>
        ) : filtered.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '64px 32px', gap: 12, textAlign: 'center',
          }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#C4BAB1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 7h10M17 7l-3-3M17 7l-3 3"/>
              <path d="M17 17H7M7 17l3-3M7 17l3 3"/>
            </svg>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1A2744' }}>
              {filter === 'epicas' ? 'No hay cadenas épicas aún' : 'No hay cadenas aquí aún'}
            </p>
            <p style={{ margin: 0, fontSize: 14, color: '#9CA3AF' }}>
              {filter === 'epicas' ? 'Las cadenas épicas tienen 4 o más intercambios' : 'Vuelve pronto'}
            </p>
          </div>
        ) : (
          filtered.map(chain => (
            <ChainCard
              key={chain.id}
              chain={chain}
              onClick={() => router.push(`/chain/${chain.id}`)}
            />
          ))
        )}

      </div>
    </div>
  )
}

/* ── Badge ─────────────────────────────────────────────────────────── */
function Badge({ steps }: { steps: number }) {
  if (steps >= 4) return (
    <span style={{
      background: '#F97316', color: '#fff',
      fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, flexShrink: 0,
    }}>
      Épica
    </span>
  )
  if (steps >= 2) return (
    <span style={{
      background: '#EEF2FF', color: '#4F46E5',
      fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, flexShrink: 0,
    }}>
      Popular
    </span>
  )
  return null
}

/* ── Thumb ─────────────────────────────────────────────────────────── */
function Thumb({ src, alt }: { src?: string | null; alt: string }) {
  return (
    <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', background: '#EDE7DF', flexShrink: 0, position: 'relative' }}>
      {src
        ? <Image src={src} fill alt={alt} loading="lazy" style={{ objectFit: 'cover' }} />
        : <div style={{ width: '100%', height: '100%', background: '#E0D8D0' }} />
      }
    </div>
  )
}

/* ── Arrow ─────────────────────────────────────────────────────────── */
function Arrow({ hidden = 0 }: { hidden?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, gap: 2 }}>
      {hidden > 0 && (
        <span style={{
          fontSize: 10, fontWeight: 700, color: '#F97316',
          background: '#FFF0E6', borderRadius: 999, padding: '1px 5px', lineHeight: 1.4,
        }}>
          +{hidden}
        </span>
      )}
      <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
        <line x1="0" y1="7" x2="14" y2="7" stroke="#F97316" strokeWidth="2" strokeLinecap="round"/>
        <polyline points="9,2 14,7 9,12" stroke="#F97316" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

/* ── ChainCard ─────────────────────────────────────────────────────── */
function ChainCard({ chain, onClick }: { chain: Chain; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 16, padding: 16,
        border: '1px solid #F0EBE3', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      {/* Item progression — hasta 4 fotos */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Thumb src={chain.initialItem?.images?.[0]} alt={chain.initialItem?.title ?? ''} />
        {chain.middle1Item && (
          <>
            <Arrow />
            <Thumb src={chain.middle1Item.images?.[0]} alt={chain.middle1Item.title} />
          </>
        )}
        {chain.middle2Item && (
          <>
            <Arrow />
            <Thumb src={chain.middle2Item.images?.[0]} alt={chain.middle2Item.title} />
          </>
        )}
        {chain.finalItem && (
          <>
            <Arrow hidden={chain.hiddenCount} />
            <Thumb src={chain.finalItem.images?.[0]} alt={chain.finalItem.title} />
          </>
        )}
      </div>

      {/* Title + badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 14, fontWeight: 700, color: '#1A2744', flex: 1, minWidth: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          De {chain.initialItem?.title ?? '—'} a {chain.finalItem?.title ?? chain.initialItem?.title ?? '—'}
        </span>
        <Badge steps={chain.steps_count} />
      </div>

      {/* Steps + creator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>
          {chain.steps_count} intercambio{chain.steps_count !== 1 ? 's' : ''}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', overflow: 'hidden', background: '#EDE7DF', flexShrink: 0, position: 'relative' }}>
            {chain.creator?.avatar_url
              ? <Image src={chain.creator.avatar_url} fill alt="" style={{ objectFit: 'cover' }} />
              : <div style={{
                  width: '100%', height: '100%', background: '#F0EAE0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 700, color: '#1A2744',
                }}>
                  {(chain.creator?.username || 'T').charAt(0).toUpperCase()}
                </div>
            }
          </div>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>@{chain.creator?.username ?? 'usuario'}</span>
        </div>
      </div>
    </div>
  )
}
