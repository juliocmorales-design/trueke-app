'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '../lib/supabase'

const TABS = ['Activos', 'Completados', 'Cancelados'] as const
type TabKey = 'active' | 'completed' | 'cancelled'
const TAB_KEYS: TabKey[] = ['active', 'completed', 'cancelled']

export default function IntercambiosPage() {
  const router = useRouter()
  const [offers, setOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tabIndex, setTabIndex] = useState(0)
  const [anim, setAnim] = useState('')
  const touchStartX = useRef(0)

  useEffect(() => { load() }, [])

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
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url')
      .in('id', userIds)
    const profileMap: Record<string, any> = {}
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

  const currentKey = TAB_KEYS[tabIndex]
  const filtered = offers.filter(o => {
    if (currentKey === 'active')    return o.status === 'pending' || o.status === 'accepted'
    if (currentKey === 'completed') return o.status === 'completed'
    if (currentKey === 'cancelled') return o.status === 'rejected'
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
            <EmptyState tab={currentKey} />
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
    rejected:  { label: 'Cancelado',  bg: '#FEE2E2', color: '#991B1B' },
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

function EmptyState({ tab }: { tab: TabKey }) {
  const msg: Record<TabKey, string> = {
    active:    'No tienes intercambios activos.',
    completed: 'Aún no has completado ningún intercambio.',
    cancelled: 'No tienes intercambios cancelados.',
  }
  return <p style={s.empty}>{msg[tab]}</p>
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
  skeletonCircle: { width: 64, height: 64, borderRadius: '50%', flexShrink: 0, ...shimmer },
  skeletonLine: { height: 14, width: '70%', borderRadius: 6, marginBottom: 8, ...shimmer },
  skeletonLineSmall: { height: 10, width: '40%', borderRadius: 6, ...shimmer },
}
