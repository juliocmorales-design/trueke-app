'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '../lib/supabase'

type Item     = { id: number; title: string; images: string[] | null; wanted: string | null; city: string | null; user_id: string }
type Profile  = { id: string; name: string; username: string | null; avatar_url: string | null }
type OfferRow = { id: number; from_user_id: string; to_user_id: string; from_item_id: number | null; to_item_id: number | null; status: string; created_at: string; myItem: Item | null; theirItem: Item | null; otherUser: Profile | null }

const TABS = ['Activos', 'Completados', 'Rechazados'] as const
type TabKey = 'active' | 'completed' | 'rejected'
const TAB_KEYS: TabKey[] = ['active', 'completed', 'rejected']

export default function IntercambiosPage() {
  const router = useRouter()
  const [offers, setOffers] = useState<OfferRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tabIndex, setTabIndex] = useState(0)
  const [anim, setAnim] = useState('')
  const touchStartX = useRef(0)

  const changeTab = (index: number) => {
    setAnim('out')
    setTimeout(() => { setTabIndex(index); setAnim('in') }, 120)
  }

  const onTouchStart = (e: any) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e: any) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current
    if (diff > 60 && tabIndex > 0) changeTab(tabIndex - 1)
    if (diff < -60 && tabIndex < TABS.length - 1) changeTab(tabIndex + 1)
  }

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    /* 1 — Offers */
    const { data: offersData } = await supabase
      .from('offers')
      .select('*')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (!offersData?.length) { setLoading(false); return }

    /* 2 — Items: direct IDs on offer (from_item_id / to_item_id) */
    const directItemIds = offersData
      .flatMap((o: any) => [o.from_item_id, o.to_item_id].filter(Boolean))

    const directItemsMap: Record<string, any> = {}
    if (directItemIds.length) {
      const { data: directItems } = await supabase
        .from('items')
        .select('id, title, images, user_id')
        .in('id', directItemIds)
      directItems?.forEach((item: any) => { directItemsMap[item.id] = item })
    }

    /* 3 — Fallback: offer_items for offers without direct IDs */
    const needsFallback = offersData.filter(
      (o: any) => !o.from_item_id || !o.to_item_id
    )
    const offerItemsMap: Record<string, any[]> = {}
    if (needsFallback.length) {
      const { data: rows } = await supabase
        .from('offer_items')
        .select('offer_id, type, item_id, items(id, title, images, user_id)')
        .in('offer_id', needsFallback.map((o: any) => o.id))
      rows?.forEach((row: any) => {
        if (!offerItemsMap[row.offer_id]) offerItemsMap[row.offer_id] = []
        offerItemsMap[row.offer_id].push(row)
      })
    }

    /* 4 — Profiles */
    const userIds = [
      ...new Set(offersData.flatMap((o: any) => [o.from_user_id, o.to_user_id])),
    ]
    const profileMap: Record<string, any> = {}
    if (userIds.length === 0) {
      setOffers([])
      setLoading(false)
      return
    }
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url')
      .in('id', userIds)
    profiles?.forEach((p: any) => { profileMap[p.id] = p })

    /* 5 — Combine from current user's perspective */
    const final = offersData.map((o: any) => {
      const iAmFrom = o.from_user_id === user.id
      const myItemId    = iAmFrom ? o.from_item_id : o.to_item_id
      const theirItemId = iAmFrom ? o.to_item_id   : o.from_item_id
      const otherUserId = iAmFrom ? o.to_user_id   : o.from_user_id

      let myItem    = myItemId    ? directItemsMap[myItemId]    : null
      let theirItem = theirItemId ? directItemsMap[theirItemId] : null

      if (!myItem || !theirItem) {
        const rows = offerItemsMap[o.id] || []
        const offeredRow   = rows.find((r: any) => r.type === 'offered')
        const requestedRow = rows.find((r: any) => r.type === 'requested')
        // 'offered' = from_user item, 'requested' = to_user item
        if (!myItem)    myItem    = iAmFrom ? offeredRow?.items   : requestedRow?.items
        if (!theirItem) theirItem = iAmFrom ? requestedRow?.items : offeredRow?.items
      }

      return { ...o, myItem, theirItem, otherUser: profileMap[otherUserId] }
    })

    setOffers(final)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const currentKey = TAB_KEYS[tabIndex]
  const filtered = offers.filter(o => {
    if (currentKey === 'active')    return o.status === 'pending' || o.status === 'accepted'
    if (currentKey === 'completed') return o.status === 'completed'
    if (currentKey === 'rejected') return o.status === 'rejected'
    return false
  })

  return (
    <div style={s.screen}>
      <div style={s.wrapper} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

        {/* HEADER */}
        <div style={s.header}>
          <h2 style={s.title}>Mis intercambios</h2>
        </div>

        {/* TABS */}
        <div style={s.tabs}>
          {TABS.map((t, i) => (
            <div key={i} style={s.tabWrapper} onClick={() => changeTab(i)}>
              <span style={tabIndex === i ? s.tabActive : s.tab}>{t}</span>
              {tabIndex === i && <div style={s.tabUnderline} />}
            </div>
          ))}
        </div>

        {/* LIST */}
        <div style={{ ...s.list, ...(anim === 'out' && s.animOut), ...(anim === 'in' && s.animIn) }}>
          {loading ? (
            [1, 2, 3].map(i => <Skeleton key={i} />)
          ) : filtered.length === 0 ? (
            <EmptyState tab={currentKey} onChangeTab={changeTab} />
          ) : (
            filtered.map(o => {
              const img = o.myItem?.images?.[0]
                || o.theirItem?.images?.[0]
                || '/images/placeholder.jpg'
              const myTitle    = o.myItem?.title    || 'Tu item'
              const theirTitle = o.theirItem?.title || 'Su item'
              const userName   = o.otherUser?.name || o.otherUser?.username || 'Usuario'

              return (
                <div
                  key={o.id}
                  style={s.card}
                  onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
                  onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  onClick={() => router.push(`/exchange/${o.id}`)}
                >
                  <img src={img} style={s.image} alt={myTitle} />
                  <div style={s.info}>
                    <div style={s.exchange}>{myTitle} por {theirTitle}</div>
                    <div style={s.user}>{userName}</div>
                    <StatusPill status={o.status} />
                  </div>
                  <div style={s.chevron}>›</div>
                </div>
              )
            })
          )}
        </div>

      </div>
    </div>
  )
}

/* ---------- STATUS PILL ---------- */

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    pending:   { label: 'Pendiente',  bg: '#FEF3C7', color: '#B45309' },
    accepted:  { label: 'Aceptado',   bg: '#DCFCE7', color: '#166534' },
    completed: { label: 'Completado', bg: '#DBEAFE', color: '#1E40AF' },
    rejected:  { label: 'Rechazado',  bg: '#FEE2E2', color: '#991B1B' },
  }
  const pill = map[status]
  if (!pill) return null
  return (
    <div style={{ ...s.pill, background: pill.bg, color: pill.color }}>
      {pill.label}
    </div>
  )
}

/* ---------- EMPTY STATE ---------- */

function EmptyState({ tab, onChangeTab }: { tab: TabKey; onChangeTab: (i: number) => void }) {
  const content: Record<TabKey, { icon: React.ReactNode; title: string; subtitle: string }> = {
    active: {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
          stroke="#C4BAB1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 7h10M17 7l-3-3M17 7l-3 3"/>
          <path d="M17 17H7M7 17l3-3M7 17l3 3"/>
        </svg>
      ),
      title: 'Aún no tienes intercambios activos',
      subtitle: 'Explora publicaciones y haz tu primera oferta.',
    },
    completed: {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
          stroke="#C4BAB1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ),
      title: 'Aún no has completado ningún intercambio',
      subtitle: 'Cada intercambio completado construye tu reputación.',
    },
    rejected: {
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
          stroke="#C4BAB1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="8" y1="15" x2="16" y2="15"/>
          <line x1="9" y1="9" x2="9.01" y2="9"/>
          <line x1="15" y1="9" x2="15.01" y2="9"/>
        </svg>
      ),
      title: 'Todo limpio por aquí',
      subtitle: 'No has tenido ofertas rechazadas. ¡Sigue así!',
    },
  }
  const { icon, title, subtitle } = content[tab]
  const btnStyle: any = {
    background: '#F97316', color: '#fff', borderRadius: 16,
    padding: '12px 24px', border: 'none', fontSize: 14,
    fontWeight: 600, marginTop: 4, cursor: 'pointer', fontFamily: 'inherit',
  }
  return (
    <div style={{ textAlign: 'center', marginTop: 48, padding: '0 16px' }}>
      <div style={{ marginBottom: 16 }}>{icon}</div>
      <p style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: '#1A2744' }}>{title}</p>
      <p style={{ margin: '0 0 16px', fontSize: 14, color: '#6F7A82' }}>{subtitle}</p>
      {tab === 'active' && (
        <button style={btnStyle} onClick={() => window.location.href = '/'}>
          Explorar publicaciones
        </button>
      )}
      {tab === 'completed' && (
        <button style={btnStyle} onClick={() => onChangeTab(0)}>
          Ver mis intercambios activos
        </button>
      )}
    </div>
  )
}

/* ---------- SKELETON ---------- */

function Skeleton() {
  return (
    <div style={s.card}>
      <div style={s.skeletonCircle} />
      <div style={{ flex: 1 }}>
        <div style={s.skeletonLine} />
        <div style={s.skeletonLineSmall} />
      </div>
    </div>
  )
}

/* ---------- STYLES ---------- */

const shimmer = {
  background: 'linear-gradient(90deg,#eee 25%,#ddd 37%,#eee 63%)',
  backgroundSize: '400% 100%',
  animation: 'shimmer 1.4s ease infinite',
}

const s: any = {
  screen: {
    background: '#FDF8F3',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
  },
  wrapper: {
    width: '100%',
    maxWidth: 500,
    padding: '28px 16px 100px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: 700, color: '#1A2744', margin: 0 },

  /* TABS */
  tabs: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottom: '1px solid #E8E2DC',
  },
  tabWrapper: {
    flex: 1,
    textAlign: 'center',
    paddingBottom: 10,
    cursor: 'pointer',
    position: 'relative',
  },
  tab: { fontSize: 14, color: '#6F7A82' },
  tabActive: { fontSize: 14, color: '#F97316', fontWeight: 600 },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    width: '60%',
    height: 3,
    background: '#F97316',
    borderRadius: 2,
  },

  /* LIST */
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    transition: '0.25s',
  },
  animOut: { opacity: 0, transform: 'translateX(20px)' },
  animIn:  { opacity: 1, transform: 'translateX(0)' },

  /* CARD */
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    background: '#FBF8F5',
    border: '1px solid #F0EAE4',
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
    transition: '0.15s',
    cursor: 'pointer',
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 12,
    objectFit: 'cover',
    flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0 },
  exchange: {
    fontWeight: 700,
    fontSize: 15,
    color: '#1A2744',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  user: { fontSize: 13, color: '#6F7A82', margin: '4px 0' },
  pill: {
    display: 'inline-block',
    fontSize: 12,
    fontWeight: 500,
    padding: '3px 10px',
    borderRadius: 999,
  },
  chevron: { fontSize: 22, color: '#6F7A82', flexShrink: 0 },

  /* EMPTY */
  empty: {
    textAlign: 'center',
    color: '#6F7A82',
    fontSize: 14,
    marginTop: 48,
  },

  /* SKELETON */
  skeletonCircle: { width: 64, height: 64, borderRadius: 12, flexShrink: 0, ...shimmer },
  skeletonLine: { height: 14, width: '70%', borderRadius: 6, marginBottom: 8, ...shimmer },
  skeletonLineSmall: { height: 10, width: '40%', borderRadius: 6, ...shimmer },
}
