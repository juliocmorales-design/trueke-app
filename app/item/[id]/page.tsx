'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import supabase from '@/app/lib/supabase'

// NOTE: if the `active` column doesn't exist in Supabase, run:
// ALTER TABLE items ADD COLUMN active boolean DEFAULT true;

export default function ItemDetail() {
  const { id } = useParams()
  const router = useRouter()
  const carouselRef = useRef<HTMLDivElement>(null)

  const [item,        setItem]        = useState<any>(null)
  const [owner,       setOwner]       = useState<any>(null)
  const [ownerStats,  setOwnerStats]  = useState<any>(null)
  const [current,     setCurrent]     = useState(0)
  const [currentUser, setCurrentUser] = useState<string | null>(null)

  const [showMenu,      setShowMenu]      = useState(false)
  const [menuDeleting,  setMenuDeleting]  = useState(false)
  const [menuDeleteErr, setMenuDeleteErr] = useState<string | null>(null)

  useEffect(() => {
    loadItem()
  }, [])

  const loadItem = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      setCurrentUser(sessionData.session?.user?.id ?? null)

      const { data } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single()

      if (!data) { router.push('/'); return }

      const userId = sessionData.session?.user?.id ?? null
      if (!data.active && data.user_id !== userId) { router.replace('/'); return }

      setItem(data)

      try {
        const { data: userData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user_id)
          .single()

        setOwner(userData)

        if (userData) {
          const { data: ratingsData } = await supabase
            .from('ratings')
            .select('score')
            .eq('rated_id', data.user_id)

          if (ratingsData && ratingsData.length > 0) {
            const avg = ratingsData.reduce((sum: number, r: any) => sum + r.score, 0) / ratingsData.length
            setOwnerStats({ avg, count: ratingsData.length })
          } else {
            setOwnerStats({ avg: null, count: 0 })
          }
        }
      } catch { /* owner/ratings optional — screen still works */ }
    } catch {
      router.push('/')
    }
  }

  const handleDeleteItem = async () => {
    if (!item) return
    setMenuDeleting(true)
    setMenuDeleteErr(null)

    try {
      const { data: activeOffers } = await supabase
        .from('offers')
        .select('id')
        .or(`from_item_id.eq.${item.id},to_item_id.eq.${item.id}`)
        .in('status', ['pending', 'accepted'])
        .limit(1)

      if (activeOffers && activeOffers.length > 0) {
        setMenuDeleteErr('Este item tiene intercambios activos, no puedes eliminarlo')
        setMenuDeleting(false)
        setShowMenu(false)
        return
      }

      await supabase
        .from('items')
        .update({ active: false })
        .eq('id', item.id)

      router.back()
    } catch {
      setMenuDeleteErr('Error al eliminar. Intenta de nuevo.')
      setMenuDeleting(false)
    }
  }

  const scrollTo = (index: number) => {
    if (!carouselRef.current) return
    carouselRef.current.scrollLeft = carouselRef.current.clientWidth * index
    setCurrent(index)
  }

  const next = () => {
    if (!item?.images) return
    scrollTo(Math.min(current + 1, item.images.length - 1))
  }

  const prev = () => {
    scrollTo(Math.max(current - 1, 0))
  }

  const goToOffer = () => {
    if (!currentUser) { router.push('/onboarding'); return }
    router.push(`/offer/new?itemId=${id}`)
  }

  if (!item) return (
    <div style={{ background: '#FDF8F3', minHeight: '100vh' }}>
      <style>{`@keyframes shimmer{0%{opacity:.6}50%{opacity:1}100%{opacity:.6}}`}</style>
      <div style={{ height: 280, background: '#E8E0D8', animation: 'shimmer 1.4s ease infinite' }} />
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ height: 26, width: '70%', borderRadius: 8, background: '#E8E0D8', animation: 'shimmer 1.4s ease infinite', marginBottom: 12 }} />
        <div style={{ height: 16, width: '40%', borderRadius: 8, background: '#E8E0D8', animation: 'shimmer 1.4s ease infinite', marginBottom: 20 }} />
        <div style={{ height: 14, width: '100%', borderRadius: 8, background: '#E8E0D8', animation: 'shimmer 1.4s ease infinite', marginBottom: 8 }} />
        <div style={{ height: 14, width: '85%', borderRadius: 8, background: '#E8E0D8', animation: 'shimmer 1.4s ease infinite', marginBottom: 8 }} />
        <div style={{ height: 14, width: '60%', borderRadius: 8, background: '#E8E0D8', animation: 'shimmer 1.4s ease infinite' }} />
      </div>
    </div>
  )

  const images = item.images?.length ? item.images : []
  const isOwner = currentUser != null && item.user_id === currentUser

  return (
    <div style={styles.screen}>
      <div style={styles.container}>

        {/* HEADER */}
        <div style={styles.header}>
          <button onClick={() => router.back()} style={styles.backBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <div style={styles.headerRight}>
            {/* Share */}
            <button
              style={styles.backBtn}
              onClick={() => {
                try { navigator.share({ title: item.title, text: item.description, url: window.location.href }) } catch {}
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="#1A2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Owner actions */}
            {isOwner && (
              <>
                <button
                  onClick={() => router.push(`/item/${id}/editar`)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    color: '#F97316',
                    fontSize: 15,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                  }}
                >
                  Editar
                </button>
                <div style={{ position: 'relative' }}>
                <button style={styles.backBtn} onClick={() => setShowMenu(v => !v)} aria-label="Opciones">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="5"  r="1" fill="#1A2744"/>
                    <circle cx="12" cy="12" r="1" fill="#1A2744"/>
                    <circle cx="12" cy="19" r="1" fill="#1A2744"/>
                  </svg>
                </button>

                {showMenu && (
                  <>
                    {/* Backdrop to close menu on outside tap */}
                    <div
                      style={{ position: 'fixed', inset: 0, zIndex: 19 }}
                      onClick={() => setShowMenu(false)}
                    />
                    <div style={styles.dropdown}>
                      <button
                        style={styles.dropdownItem}
                        onClick={() => { setShowMenu(false); handleDeleteItem() }}
                        disabled={menuDeleting}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                        {menuDeleting ? 'Eliminando...' : 'Eliminar publicación'}
                      </button>
                    </div>
                  </>
                )}
              </div>
              </>
            )}
          </div>
        </div>

        {/* DELETE ERROR BANNER */}
        {menuDeleteErr && (
          <div style={styles.errorBanner}>
            <span>{menuDeleteErr}</span>
            <button style={styles.errorClose} onClick={() => setMenuDeleteErr(null)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

        {/* CARRUSEL */}
        <div style={styles.carouselWrapper}>
          {images.length === 0 ? (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0EAE0' }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#C4BAB1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
          ) : (
            <>
              <div
                style={styles.carousel}
                ref={carouselRef}
                onScroll={() => {
                  if (!carouselRef.current) return
                  const index = Math.round(
                    carouselRef.current.scrollLeft / carouselRef.current.clientWidth
                  )
                  setCurrent(index)
                }}
              >
                {images.map((img: string, i: number) => (
                  <div key={i} style={styles.slide}>
                    <img src={img} style={styles.image} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* DOTS */}
        <div style={styles.dots}>
          {images.map((_: any, i: number) => (
            <div key={i} style={{ ...styles.dot, opacity: current === i ? 1 : 0.3 }} />
          ))}
        </div>

        {/* BODY */}
        <div style={styles.body}>

          <h1 style={styles.title}>{item.title}</h1>

          <div style={styles.meta}>
            Por {item.wanted || 'algo a cambio'}
          </div>

          <div style={styles.badgesRow}>
            {item.category && (
              <span style={{
                background: '#F0EAE0',
                color: '#1A2744',
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 20,
              }}>
                {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
              </span>
            )}
            {item.city && (
              <div style={styles.badge}>{item.city}</div>
            )}
          </div>

          <p style={styles.desc}>{item.description}</p>

          {!isOwner && (
            <>
              <div style={styles.sectionTitle}>¿Te interesa?</div>
              <div style={styles.button} onClick={goToOffer}>
                {currentUser ? 'Ofrecer algo a cambio' : 'Únete para intercambiar'}
              </div>
            </>
          )}

          <div style={styles.divider} />

          {owner && (
            <div style={styles.userRow} onClick={() => router.push(`/perfil/${owner.id}`)}>
              <div style={styles.userLeft}>
                <img
                  src={owner.avatar_url || '/images/avatar.svg'}
                  style={styles.avatar}
                />
                <div>
                  <div style={styles.userName}>{owner.username || owner.name || 'Usuario'}</div>
                  <div style={styles.sub}>
                    {owner.city || 'Monterrey'} · {ownerStats?.count || 0} intercambios · {ownerStats?.avg ? ownerStats.avg.toFixed(1) : 'Nuevo'}
                    <StarIcon />
                  </div>
                </div>
              </div>
              <div style={styles.arrow}>›</div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B" style={{ marginLeft: 4 }}>
      <path d="M12 17.27L18.18 21 16.54 13.97 22 9.24 14.81 8.63 12 2 9.19 8.63 2 9.24 7.46 13.97 5.82 21z"/>
    </svg>
  )
}

const styles: any = {
  screen: {
    background: '#FDF8F3',
    display: 'flex',
    justifyContent: 'center',
  },

  container: {
    width: '100%',
    maxWidth: 500,
    paddingBottom: 80,
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 16px',
    position: 'sticky',
    top: 0,
    background: '#FDF8F3',
    zIndex: 10,
  },

  headerRight: {
    display: 'flex',
    gap: 10,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#F0EAE0',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dropdown: {
    position: 'absolute',
    top: 46,
    right: 0,
    background: '#fff',
    borderRadius: 14,
    boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
    overflow: 'hidden',
    zIndex: 20,
    minWidth: 200,
  },

  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '14px 18px',
    background: 'none',
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    color: '#DC2626',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
  },

  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#FEE2E2',
    color: '#991B1B',
    fontSize: 13,
    fontWeight: 500,
    padding: '10px 20px',
    margin: '0 20px 8px',
    borderRadius: 12,
    gap: 8,
  },

  errorClose: {
    background: 'none',
    border: 'none',
    color: '#991B1B',
    fontSize: 16,
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
    flexShrink: 0,
  },

  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#EDE5DD',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },

  carouselWrapper: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    marginLeft: 16,
    marginRight: 16,
  },

  carousel: {
    display: 'flex',
    overflowX: 'scroll',
    scrollSnapType: 'x mandatory',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },

  slide: {
    minWidth: '100%',
    scrollSnapAlign: 'start',
    flexShrink: 0,
  },

  image: {
    width: '100%',
    height: 280,
    objectFit: 'cover',
  },

  arrowLeft: {
    position: 'absolute',
    top: '50%',
    left: 10,
    transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.9)',
    border: 'none',
    borderRadius: '50%',
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },

  arrowRight: {
    position: 'absolute',
    top: '50%',
    right: 10,
    transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.9)',
    border: 'none',
    borderRadius: '50%',
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },

  dots: {
    display: 'flex',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#333',
  },

  body: {
    padding: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: 800,
  },

  meta: {
    fontSize: 15,
    color: '#6F7A82',
    marginTop: 6,
  },

  badgesRow: {
    display: 'flex',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },

  badge: {
    background: '#E8F0E9',
    color: '#2D6A4F',
    fontSize: 13,
    fontWeight: 600,
    padding: '6px 12px',
    borderRadius: 16,
    display: 'inline-block',
  },

  desc: {
    margin: 0,
    marginTop: 14,
    fontSize: 15,
    color: '#3D3D3D',
    lineHeight: 1.7,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  sectionTitle: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: 700,
    color: '#1A2744',
  },

  button: {
    marginTop: 10,
    background: '#F97316',
    color: '#fff',
    padding: '16px 0',
    borderRadius: 16,
    textAlign: 'center',
    fontWeight: 600,
    fontSize: 16,
    cursor: 'pointer',
  },

  divider: {
    marginTop: 20,
    height: 1,
    background: '#E5E7EB',
  },

  userRow: {
    marginTop: 16,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
  },

  userLeft: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: '50%',
  },

  userName: {
    fontWeight: 600,
  },

  sub: {
    fontSize: 14,
    color: '#4A5568',
    display: 'flex',
    alignItems: 'center',
  },

  arrow: {
    fontSize: 18,
    color: '#999',
  },
}
