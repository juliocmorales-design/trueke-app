'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import supabase from './lib/supabase'
import FeaturedChains from './components/feed/FeaturedChains'
import NotifBadge from './components/feed/NotifBadge'

type Item  = { id: number; title: string; images: string[] | null; wanted: string | null; city: string | null; user_id: string; created_at: string; profile?: { username: string; avatar_url: string | null } }
type Chain = { id: number; initial_item_id: number; created_at: string; initial_item_title: string | null; initial_item_image: string | null; final_item_title: string | null; final_item_image: string | null; creator_username: string | null; creator_avatar: string | null; steps_count: number }

const CACHE_TTL = 5 * 60 * 1000
const PAGE_SIZE = 12

export default function Home() {
  const router = useRouter()
  const [ready,         setReady]         = useState(false)
  const [isAnon,        setIsAnon]        = useState(false)
  const [items,         setItems]         = useState<Item[]>([])
  const [chains,        setChains]        = useState<Chain[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userCity,      setUserCity]      = useState('')
  const [showCityModal, setShowCityModal] = useState(false)
  const [cityInput,     setCityInput]     = useState('')
  const [savingCity,    setSavingCity]    = useState(false)
  const [page,          setPage]          = useState(0)
  const [hasMore,       setHasMore]       = useState(true)
  const [loadingMore,   setLoadingMore]   = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const scrollRef   = useRef(0)
  const [initialLoadDone,       setInitialLoadDone]       = useState(false)
  const [hasSeenChainsExplainer, setHasSeenChainsExplainer] = useState(true)

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('home_scroll')
      if (saved) { window.scrollTo(0, parseInt(saved, 10)); sessionStorage.removeItem('home_scroll') }
    } catch {}
    try {
      const seen = localStorage.getItem('trueke_chains_explainer')
      setHasSeenChainsExplainer(!!seen)
    } catch {}
  }, [])

  const loadPublicFeed = async () => {
    const CACHE_KEY = 'trueke_feed_cache_anon'
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < CACHE_TTL) { setItems(data); setInitialLoadDone(true); return }
      }
    } catch {}
    try {
      const { data: itemsData } = await supabase
        .from('items').select('*').eq('active', true)
        .order('created_at', { ascending: false }).limit(PAGE_SIZE)

      const userIds = [...new Set((itemsData || []).map((i: any) => i.user_id))]
      let itemsWithProfiles: Item[]
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles').select('id, username, avatar_url').in('id', userIds)
        const profileMap: Record<string, any> = {}
        profilesData?.forEach((p: any) => { profileMap[p.id] = p })
        itemsWithProfiles = (itemsData || []).map((item: any) => ({
          ...item, profile: profileMap[item.user_id] ?? null,
        }))
      } else {
        itemsWithProfiles = itemsData || []
      }
      setItems(itemsWithProfiles)
      if (itemsWithProfiles.length < PAGE_SIZE) setHasMore(false)
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: itemsWithProfiles, timestamp: Date.now() }))
      } catch {}
      setInitialLoadDone(true)
    } catch { setItems([]); setInitialLoadDone(true) }
  }

  const checkFlow = async () => {
    const timeoutId = setTimeout(() => { setReady(true) }, 10000)
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !sessionData.session) {
        setIsAnon(true)
        await loadPublicFeed()
        clearTimeout(timeoutId)
        setReady(true)
        return
      }

      const user = sessionData.session.user

      setCurrentUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles').select('username, city').eq('id', user.id).single()

      if (!profile?.username) { router.replace('/onboarding'); return }

      if (profile.city) setUserCity(profile.city)
      localStorage.setItem('onboarding_seen', 'true')

      // Items — independent, failure shows empty feed
      const CACHE_KEY = `trueke_feed_cache_${user.id}`
      try {
        let cacheHit = false
        try {
          const cached = localStorage.getItem(CACHE_KEY)
          if (cached) {
            const { data, timestamp } = JSON.parse(cached)
            if (Date.now() - timestamp < CACHE_TTL) { setItems(data); cacheHit = true }
          }
        } catch {}

        if (!cacheHit) {
          // Query por ciudad primero
          let cityItems: any[] = []
          if (profile.city) {
            const { data } = await supabase
              .from('items').select('*').eq('active', true)
              .eq('city', profile.city).order('created_at', { ascending: false }).limit(PAGE_SIZE)
            cityItems = data || []
          }

          // Si hay menos de 6 items en la ciudad, complementar con otros
          let allItems = cityItems
          if (cityItems.length < 6) {
            const excludeIds = cityItems.map((i: any) => i.id)
            let fillQuery = supabase
              .from('items').select('*').eq('active', true)
              .order('created_at', { ascending: false }).limit(PAGE_SIZE - cityItems.length)
            if (excludeIds.length > 0) fillQuery = fillQuery.not('id', 'in', `(${excludeIds.join(',')})`)
            const { data: fillItems } = await fillQuery
            allItems = [...cityItems, ...(fillItems || [])]
          }

          const itemsData = allItems
          const userIds = [...new Set((itemsData || []).map((i: any) => i.user_id))]
          let itemsWithProfiles: Item[]
          if (userIds.length > 0) {
            const { data: profilesData } = await supabase
              .from('profiles').select('id, username, avatar_url').in('id', userIds)
            const profileMap: Record<string, any> = {}
            profilesData?.forEach((p: any) => { profileMap[p.id] = p })
            itemsWithProfiles = (itemsData || []).map((item: any) => ({
              ...item, profile: profileMap[item.user_id] ?? null,
            }))
          } else {
            itemsWithProfiles = itemsData || []
          }
          setItems(itemsWithProfiles)
          if (itemsWithProfiles.length < PAGE_SIZE) setHasMore(false)
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ data: itemsWithProfiles, timestamp: Date.now() }))
          } catch {}
        }
        setInitialLoadDone(true)
      } catch { setItems([]); setInitialLoadDone(true) }

      // Chains — independent, failure shows empty chains section
      try {
        const { data: chainsData } = await supabase
          .from('chains')
          .select('id, initial_item_id, creator_id, steps_count, created_at')
          .eq('status', 'active')
          .order('steps_count', { ascending: false })
          .limit(6)

        const rawChains = chainsData || []
        if (rawChains.length > 0) {
          const chainIds   = rawChains.map((c: any) => c.id)
          const itemIds    = rawChains.map((c: any) => c.initial_item_id).filter(Boolean)
          const creatorIds = rawChains.map((c: any) => c.creator_id).filter(Boolean)

          if (itemIds.length === 0 || creatorIds.length === 0 || chainIds.length === 0) {
            setChains([])
            clearTimeout(timeoutId)
            setReady(true)
            return
          }

          const [{ data: initItems }, { data: profileData }, { data: stepsData }] = await Promise.all([
            supabase.from('items').select('id, title, images').in('id', itemIds),
            supabase.from('profiles').select('id, username, avatar_url').in('id', creatorIds),
            supabase.from('chain_steps')
              .select('chain_id, step_number, item_id')
              .in('chain_id', chainIds),
          ])

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

          let finalItemsData: any[] = []
          if (finalItemIds.length > 0) {
            const { data } = await supabase
              .from('items').select('id, title, images').in('id', finalItemIds)
            finalItemsData = data || []
          }

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
      } catch { setChains([]) }

      clearTimeout(timeoutId)
      setReady(true)
    } catch (err) {
      clearTimeout(timeoutId)
      console.error(err)
      setIsAnon(true)
      await loadPublicFeed()
      setReady(true)
    }
  }

  const saveCity = async () => {
    const trimmed = cityInput.trim()
    if (!trimmed) return
    setSavingCity(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user
      if (user) {
        await supabase.from('profiles').update({ city: trimmed }).eq('id', user.id)
        setUserCity(trimmed)
      }
    } finally {
      setSavingCity(false)
      setShowCityModal(false)
    }
  }

  const loadMoreItems = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const { data } = await supabase
        .from('items').select('*').eq('active', true)
        .order('created_at', { ascending: false })
        .range(nextPage * PAGE_SIZE, (nextPage + 1) * PAGE_SIZE - 1)

      if (!data || data.length === 0) { setHasMore(false); return }
      if (data.length < PAGE_SIZE) setHasMore(false)

      const userIds = [...new Set(data.map((i: any) => i.user_id))]
      const profileMap: Record<string, any> = {}
      if (userIds.length > 0) {
        const { data: pd } = await supabase
          .from('profiles').select('id, username, avatar_url').in('id', userIds as string[])
        pd?.forEach((p: any) => { profileMap[p.id] = p })
      }
      setItems(prev => [...prev, ...data.map((item: any) => ({ ...item, profile: profileMap[item.user_id] ?? null }))])
      setPage(nextPage)
    } catch {} finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => { checkFlow() }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && initialLoadDone) loadMoreItems()
      },
      { threshold: 0.1 }
    )
    if (sentinelRef.current) observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, initialLoadDone])

  if (!ready) return <HomeSkeleton />

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        {isAnon ? (
          <>
            <img src="/svg/Logo_Trueke.svg" alt="Trueke" style={{ display: 'block', height: 32, width: 'auto' }} />
            <button style={styles.joinBtn} onClick={() => router.push('/onboarding')}>
              Únete gratis
            </button>
          </>
        ) : (
          <>
            <button
              style={styles.locationBtn}
              onClick={() => { setCityInput(userCity || ''); setShowCityModal(true) }}
            >
              <svg viewBox="0 0 24 24" width={20} height={20} style={{ flexShrink: 0 }}>
                <path d="M12 21s-6-5.5-6-10a6 6 0 1 1 12 0c0 4.5-6 10-6 10z" fill="#F97316"/>
                <circle cx="12" cy="11" r="2.5" fill="#fff"/>
              </svg>
              <span style={styles.city}>{userCity || 'Mi ciudad'}</span>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#1A2744" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            <div style={styles.headerIcons}>
              <div style={{ cursor: 'pointer', padding: 4 }} onClick={() => router.push('/mensajes')}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="#1A2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <NotifBadge />
            </div>
          </>
        )}
      </div>

      {/* MODAL CIUDAD */}
      {showCityModal && (
        <div style={styles.overlay} onClick={() => setShowCityModal(false)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <p style={styles.modalTitle}>¿En qué ciudad estás?</p>
            <input
              style={styles.modalInput}
              placeholder="Ej: Monterrey, CDMX..."
              value={cityInput}
              onChange={e => setCityInput(e.target.value)}
              autoFocus
            />
            <button
              style={{ ...styles.modalSave, opacity: savingCity ? 0.6 : 1 }}
              onClick={saveCity}
              disabled={savingCity}
            >
              {savingCity ? 'Guardando...' : 'Guardar'}
            </button>
            <button style={styles.modalCancel} onClick={() => setShowCityModal(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* SEARCH */}
      <div style={{ ...styles.search, cursor: 'pointer' }} onClick={() => router.push('/buscar')}>
        <svg viewBox="0 0 24 24" width={16} height={16} style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="7" stroke="#9AA3AB" strokeWidth="2" fill="none"/>
          <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="#9AA3AB" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span>Buscar objetos o personas...</span>
      </div>

      {/* VALUE PROP — solo anónimos */}
      {isAnon && (
        <div style={{
          background: 'linear-gradient(135deg, #1A2744 0%, #2D3F6B 100%)',
          borderRadius: 20,
          padding: '20px 20px',
          marginBottom: 20,
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: '0 0 6px', lineHeight: 1.3 }}>
            Publica lo que tienes.<br/>
            Consigue lo que quieres.
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '0 0 16px' }}>
            Sin dinero. Solo intercambios.
          </p>
          <button
            onClick={() => router.push('/onboarding')}
            style={{
              background: '#F97316', color: '#fff', border: 'none',
              borderRadius: 99, padding: '10px 24px',
              fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Únete gratis →
          </button>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '12px 0 0' }}>
            ¿Ya tienes cuenta?{' '}
            <span
              onClick={() => router.push('/login')}
              style={{ color: '#fff', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Inicia sesión
            </span>
          </p>
        </div>
      )}

      {/* EXPLAINER CADENAS */}
      {!hasSeenChainsExplainer && chains.length > 0 && (
        <div style={{
          background: '#FFF5F0', border: '1.5px solid #F97316',
          borderRadius: 12, padding: '12px 14px', marginBottom: 12,
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 20 }}>🔗</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1A2744', margin: '0 0 2px' }}>
              ¿Qué es una cadena?
            </p>
            <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
              Intercambia algo → consigue algo mejor → intercámbialo de nuevo. Cada paso te acerca a lo que realmente quieres.
            </p>
          </div>
          <button
            onClick={() => {
              try { localStorage.setItem('trueke_chains_explainer', '1') } catch {}
              setHasSeenChainsExplainer(true)
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 18, padding: 0, flexShrink: 0 }}
          >
            ×
          </button>
        </div>
      )}

      {/* CADENAS DESTACADAS */}
      <FeaturedChains chains={chains} />

      {/* FEED — 2 columnas */}
      {items.length === 0 ? (
        <div style={styles.emptyFeed}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#C4BAB1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
          <p style={styles.emptyFeedTitle}>
            {isAnon ? 'Aún no hay publicaciones' : 'Aún no hay items cerca de ti'}
          </p>
          <p style={styles.emptyFeedSub}>
            {isAnon ? 'Únete y sé el primero en publicar algo' : 'Sé el primero en publicar algo'}
          </p>
          <button
            style={styles.emptyFeedBtn}
            onClick={() => router.push(isAnon ? '/onboarding' : '/crear')}
          >
            {isAnon ? 'Únete gratis' : 'Publicar algo'}
          </button>
        </div>
      ) : (
        <>
          <Section
            title={isAnon ? 'Publicaciones recientes' : (userCity ? `Cerca de ti en ${userCity}` : 'Publicaciones recientes')}
            href="/buscar"
          />
          <div style={styles.grid2}>
            {items.map(item => (
              <Card
                key={item.id}
                router={router}
                item={item}
                isOwn={item.user_id === currentUserId}
                onNavigate={() => { scrollRef.current = window.scrollY; try { sessionStorage.setItem('home_scroll', String(window.scrollY)) } catch {} }}
              />
            ))}
          </div>
          <div ref={sentinelRef} style={{ height: 20 }} />
          {loadingMore && (
            <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 14, padding: 16 }}>
              Cargando más...
            </p>
          )}
          {!hasMore && items.length > 0 && (
            <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: 16 }}>
              Ya viste todo 👀
            </p>
          )}
        </>
      )}

    </div>
  )
}

/* ── Sub-componentes ── */

function HomeSkeleton() {
  const sh: any = {
    background: 'linear-gradient(90deg,#e8e0d8 25%,#ddd5cc 37%,#e8e0d8 63%)',
    backgroundSize: '400% 100%',
    animation: 'shimmer 1.4s ease infinite',
    borderRadius: 8,
  }
  return (
    <div style={{ padding: 16, paddingBottom: 100, background: '#FDF8F3', minHeight: '100vh' }}>
      <style>{`@keyframes shimmer{0%{background-position:100% 50%}100%{background-position:0 50%}}`}</style>
      <div style={{ ...sh, height: 44, borderRadius: 16, marginTop: 10, marginBottom: 20 }} />
      <div style={{ ...sh, height: 110, borderRadius: 16, marginBottom: 24 }} />
      <div style={{ ...sh, height: 14, width: '45%', borderRadius: 8, marginBottom: 14 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ ...sh, width: '100%', aspectRatio: '3/2', borderRadius: 0 }} />
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ ...sh, height: 12, width: '80%' }} />
              <div style={{ ...sh, height: 10, width: '55%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 60) return `hace ${mins}m`
  if (hours < 24) return `hace ${hours}h`
  if (days < 7) return `hace ${days}d`
  return `hace ${Math.floor(days / 7)}sem`
}

function Section({ title, href, badge }: { title: string; href?: string; badge?: string }) {
  const router = useRouter()
  return (
    <div style={styles.section}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <strong style={{ fontSize: 17, color: '#1A2744' }}>{title}</strong>
        {badge && (
          <span style={{
            background: '#F97316', color: '#fff',
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
          }}>
            {badge}
          </span>
        )}
      </div>
      {href && (
        <span
          style={{ fontSize: 14, color: '#F97316', cursor: 'pointer', fontWeight: 500 }}
          onClick={() => router.push(href)}
        >
          Ver todo ›
        </span>
      )}
    </div>
  )
}

function Card({ router, item, small = false, isOwn = false, onNavigate }: any) {
  const image = item?.images?.[0] ?? null
  const [imgError, setImgError] = useState(false)
  return (
    <div
      style={{ ...styles.card, ...(small ? styles.cardSmall : {}) }}
      onClick={() => { onNavigate?.(); router.push(`/item/${item.id}`) }}
    >
      <div style={{ ...styles.cardImg, position: 'relative' }}>
        {isOwn && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: '#F97316', color: '#fff',
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, zIndex: 1,
          }}>
            Tuyo
          </div>
        )}
        {image && !imgError
          ? <Image
              src={image}
              fill
              style={{ objectFit: 'cover' }}
              alt={item.title}
              loading="lazy"
              onError={() => setImgError(true)}
            />
          : <div style={{ ...styles.imgFallback, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke="#C4BAB1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
        }
      </div>
      <div style={styles.cardBody}>
        <div style={styles.name}>{item.title}</div>
        <div style={styles.exchange}>por {item.wanted || 'algo'}</div>
        <div style={styles.ownerRow}>
          {item.profile?.avatar_url ? (
            <Image src={item.profile.avatar_url} width={20} height={20} alt={`Avatar de ${item.profile?.username || 'usuario'}`} style={{ borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={styles.ownerAvatarFallback}>
              {(item.profile?.username || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <span style={styles.ownerName}>@{item.profile?.username || 'usuario'}</span>
        </div>
        <div style={styles.timeAgo}>{timeAgo(item.created_at)}</div>
      </div>
    </div>
  )
}

/* ── Estilos ── */

const styles: any = {

  container: {
    padding: 16,
    paddingBottom: 100,
    background: '#FDF8F3',
    minHeight: '100vh',
  },

  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },

  locationBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
  },

  joinBtn: {
    background: '#F97316',
    color: '#fff',
    border: 'none',
    borderRadius: 20,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  },

  modalCard: {
    background: '#fff', borderRadius: '20px 20px 0 0',
    padding: 24, paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
    width: '100%', maxWidth: 500,
    display: 'flex', flexDirection: 'column', gap: 12,
  },

  modalTitle: {
    margin: 0, fontSize: 18, fontWeight: 700, color: '#1A2744',
  },

  modalInput: {
    background: '#F0EAE0', borderRadius: 12, border: 'none',
    padding: 14, fontSize: 16, fontFamily: 'inherit', outline: 'none',
  },

  modalSave: {
    background: '#F97316', color: '#fff', border: 'none',
    borderRadius: 16, width: '100%', padding: 16,
    fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },

  modalCancel: {
    background: 'none', border: 'none', color: '#6F7A82',
    fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0',
  },

  city: { fontWeight: 700, fontSize: 16, color: '#1A2744' },

  headerIcons: { display: 'flex', alignItems: 'center', gap: 16 },

  search: {
    marginTop: 14, background: '#FFFFFF', border: 'none', borderRadius: 16,
    padding: '12px 16px', color: '#9CA3AF', fontSize: 14,
    display: 'flex', alignItems: 'center', gap: 8,
    boxShadow: '0 2px 8px rgba(26,39,68,0.08)',
  },

  section: {
    marginTop: 24, marginBottom: 12,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },

  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },

  card: {
    background: '#FFFFFF', border: '1px solid #F0EBE3',
    borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },

  cardSmall: { minWidth: 140, maxWidth: 160, flexShrink: 0 },

  cardImg: { width: '100%', aspectRatio: '3 / 2', overflow: 'hidden', background: '#EDE7DF' },

  imgFallback: { width: '100%', height: '100%', background: '#E8E0D8' },

  cardBody: { padding: 10 },

  name: {
    fontWeight: 700, fontSize: 13, color: '#1A2744',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },

  exchange: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  ownerRow: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 },

  ownerAvatarFallback: {
    width: 20, height: 20, borderRadius: '50%', background: '#F0EAE0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 700, color: '#1A2744',
  },

  ownerName: { fontSize: 11, color: '#9CA3AF' },

  timeAgo: { fontSize: 11, color: '#C4BAB1', marginTop: 2 },

  emptyFeed: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '48px 32px', gap: 10, textAlign: 'center',
  },

  emptyFeedTitle: { margin: 0, fontSize: 16, fontWeight: 700, color: '#1A2744' },

  emptyFeedSub: { margin: 0, fontSize: 14, color: '#9AA3AB' },

  emptyFeedBtn: {
    marginTop: 4, background: '#F97316', color: '#fff', border: 'none',
    borderRadius: 16, padding: '14px 28px', fontSize: 15, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
}
