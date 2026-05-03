'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from './lib/supabase'
import FeaturedChains from './components/feed/FeaturedChains'
import NotifBadge from './components/feed/NotifBadge'

export default function Home() {
  const router = useRouter()
  const [ready,  setReady]  = useState(false)
  const [items,  setItems]  = useState<any[]>([])
  const [chains, setChains] = useState<any[]>([])

  useEffect(() => { checkFlow() }, [])

  const checkFlow = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (!user) { router.replace('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('username').eq('id', user.id).single()

      if (!profile?.username) { router.replace('/onboarding'); return }

      localStorage.setItem('onboarding_seen', 'true')

      const [{ data: itemsData }, { data: chainsData }] = await Promise.all([
        supabase.from('items').select('*').order('created_at', { ascending: false }).limit(12),
        supabase.from('chains')
          .select('id, initial_item_id, creator_id, steps_count, created_at')
          .eq('status', 'active')
          .order('steps_count', { ascending: false })
          .limit(6),
      ])

      setItems(itemsData || [])

      const rawChains = chainsData || []
      if (rawChains.length > 0) {
        const chainIds   = rawChains.map((c: any) => c.id)
        const itemIds    = rawChains.map((c: any) => c.initial_item_id).filter(Boolean)
        const creatorIds = rawChains.map((c: any) => c.creator_id).filter(Boolean)

        // Parallel: initial items + profiles + chain_steps (to find final item)
        const [{ data: initItems }, { data: profileData }, { data: stepsData }] = await Promise.all([
          supabase.from('items').select('id, title, images').in('id', itemIds),
          supabase.from('profiles').select('id, username, avatar_url').in('id', creatorIds),
          supabase.from('chain_steps')
            .select('chain_id, step_number, item_id')
            .in('chain_id', chainIds),
        ])

        // Find last step per chain → final item_id
        const lastStepByChain: Record<number, { stepNum: number; itemId: number }> = {}
        stepsData?.forEach((s: any) => {
          const cur = lastStepByChain[s.chain_id]
          if (!cur || s.step_number > cur.stepNum) {
            lastStepByChain[s.chain_id] = { stepNum: s.step_number, itemId: s.item_id }
          }
        })

        const finalItemIds = [...new Set(
          Object.values(lastStepByChain).map(s => s.itemId).filter(Boolean)
        )]

        // Fetch final items (sequential — depends on stepsData)
        let finalItemsData: any[] = []
        if (finalItemIds.length > 0) {
          const { data } = await supabase
            .from('items').select('id, title, images').in('id', finalItemIds)
          finalItemsData = data || []
        }

        // Build lookup maps
        const itemMap: Record<number, any> = {}
        ;[...(initItems || []), ...finalItemsData].forEach((i: any) => { itemMap[i.id] = i })

        const profileMap: Record<string, any> = {}
        profileData?.forEach((p: any) => { profileMap[p.id] = p })

        setChains(rawChains.map((c: any) => {
          const initItem  = itemMap[c.initial_item_id]
          const finalId   = lastStepByChain[c.id]?.itemId
          const finalItem = finalId ? itemMap[finalId] : null
          const profile   = profileMap[c.creator_id]
          return {
            ...c,
            initial_item_title: initItem?.title ?? null,
            initial_item_image: initItem?.images?.[0] ?? null,
            final_item_title:   finalItem?.title ?? null,
            final_item_image:   finalItem?.images?.[0] ?? null,
            creator_username:   profile?.username ?? null,
            creator_avatar:     profile?.avatar_url ?? null,
          }
        }))
      } else {
        setChains([])
      }

      setReady(true)
    } catch (err) {
      console.error(err)
      router.replace('/login')
    }
  }

  if (!ready) return <div style={styles.loading}>Cargando...</div>

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.location}>
          <svg viewBox="0 0 24 24" width={16} style={{ flexShrink: 0 }}>
            <path d="M12 21s-6-5.5-6-10a6 6 0 1 1 12 0c0 4.5-6 10-6 10z" fill="#F97316"/>
            <circle cx="12" cy="11" r="2" fill="#fff"/>
          </svg>
          <span style={styles.city}>Monterrey</span>
        </div>
        <div style={styles.headerIcons}>
          <NotifBadge />
        </div>
      </div>

      {/* SEARCH */}
      <div style={styles.search}>
        <svg viewBox="0 0 24 24" width={16} height={16} style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="7" stroke="#9AA3AB" strokeWidth="2" fill="none"/>
          <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="#9AA3AB" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span>Buscar objetos o personas...</span>
      </div>

      {/* CADENAS DESTACADAS */}
      <FeaturedChains chains={chains} />

      {/* CERCA DE TI — 2 columnas */}
      <Section title="Cerca de ti" />
      <div style={styles.grid2}>
        {items.slice(0, 6).map(item => (
          <Card key={item.id} router={router} item={item} />
        ))}
      </div>

      {/* RECOMENDADOS — scroll horizontal compacto */}
      <Section title="Recomendados" />
      <div style={styles.scrollRow}>
        {items.slice(6, 12).map(item => (
          <Card key={item.id} router={router} item={item} small />
        ))}
      </div>

    </div>
  )
}

/* ── Componentes ── */

function Section({ title }: { title: string }) {
  return (
    <div style={styles.section}>
      <strong style={{ fontSize: 17, color: '#1A2744' }}>{title}</strong>
    </div>
  )
}

function Card({ router, item, small = false }: any) {
  const image = item?.images?.[0] || item?.image || item?.image_url || null

  return (
    <div
      style={{ ...styles.card, ...(small ? styles.cardSmall : {}) }}
      onClick={() => router.push(`/item/${item.id}`)}
    >
      <div style={styles.cardImg}>
        {image
          ? <img src={image} style={styles.imgEl} alt={item.title} />
          : <div style={styles.imgFallback} />
        }
      </div>
      <div style={styles.cardBody}>
        <div style={styles.name}>{item.title}</div>
        <div style={styles.exchange}>por {item.wanted || 'algo'}</div>
        <div style={styles.userRow}>
          <div style={styles.avatarWrap}>
            <img src={item?.user?.avatar_url || '/images/avatar.svg'} style={styles.avatar} alt="" />
          </div>
          <span style={styles.distance}>{item?.distance || '1.2 km'}</span>
        </div>
      </div>
    </div>
  )
}

/* ── Estilos ── */

const styles: any = {

  loading: {
    height: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: '#FDF8F3',
  },

  container: {
    padding: 16,
    paddingBottom: 100,
    background: '#FDF8F3',
    minHeight: '100vh',
  },

  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },

  location: {
    display: 'flex', alignItems: 'center', gap: 6,
  },

  city: {
    fontWeight: 700, fontSize: 15, color: '#1A2744',
  },

  headerIcons: {
    display: 'flex', alignItems: 'center', gap: 16,
  },

  search: {
    marginTop: 14,
    background: '#F0EAE0',
    border: 'none',
    borderRadius: 12,
    padding: '11px 14px',
    color: '#9CA3AF',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  section: { marginTop: 24, marginBottom: 12 },

  /* Cerca de ti: 2 columnas */
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },

  /* Recomendados: scroll horizontal */
  scrollRow: {
    display: 'flex',
    overflowX: 'auto',
    gap: 12,
    paddingBottom: 4,
    marginLeft: -16, marginRight: -16,
    paddingLeft: 16, paddingRight: 16,
  },

  card: {
    background: '#FFFFFF',
    border: '1px solid #F0EBE3',
    borderRadius: 16,
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },

  cardSmall: {
    minWidth: 140,
    maxWidth: 160,
    flexShrink: 0,
  },

  cardImg: {
    width: '100%',
    aspectRatio: '1 / 1',
    overflow: 'hidden',
    background: '#EDE7DF',
  },

  imgEl: {
    width: '100%', height: '100%',
    objectFit: 'cover', display: 'block',
  },

  imgFallback: {
    width: '100%', height: '100%',
    background: '#E8E0D8',
  },

  cardBody: { padding: 10 },

  name: {
    fontWeight: 700,
    fontSize: 13,
    color: '#1A2744',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  exchange: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  userRow: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 },

  avatarWrap: {
    width: 20, height: 20, borderRadius: 999,
    overflow: 'hidden', background: '#E8E0D8', flexShrink: 0,
  },

  avatar: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },

  distance: { fontSize: 11, color: '#9CA3AF' },
}
