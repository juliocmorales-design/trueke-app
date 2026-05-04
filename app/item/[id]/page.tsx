'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import supabase from '@/app/lib/supabase'

export default function ItemDetail() {
  const { id } = useParams()
  const router = useRouter()
  const carouselRef = useRef<HTMLDivElement>(null)

  const [item, setItem] = useState<any>(null)
  const [owner, setOwner] = useState<any>(null)
  const [ownerStats, setOwnerStats] = useState<any>(null)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    loadItem()
  }, [])

  const loadItem = async () => {
    const { data } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single()

    if (!data) return router.push('/')

    setItem(data)

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
  }

  const scrollTo = (index: number) => {
    if (!carouselRef.current) return
    const width = carouselRef.current.clientWidth
    carouselRef.current.scrollTo({
      left: width * index,
      behavior: 'smooth',
    })
    setCurrent(index)
  }

  const next = () => {
    if (!item?.images) return
    const nextIndex = Math.min(current + 1, item.images.length - 1)
    scrollTo(nextIndex)
  }

  const prev = () => {
    const prevIndex = Math.max(current - 1, 0)
    scrollTo(prevIndex)
  }

  const goToOffer = () => {
    router.push(`/offer/new?itemId=${id}`)
  }

  if (!item) return null

  const images = item.images?.length
    ? item.images
    : ['/images/placeholder.png']

  return (
    <div style={styles.screen}>
      <div style={styles.container}>

        {/* HEADER */}
        <div style={styles.header}>
          <button onClick={() => router.back()} style={styles.backBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18l-6-6 6-6" stroke="#1A2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div style={styles.headerRight}>
            <button
              style={styles.backBtn}
              onClick={() => {
                try {
                  navigator.share({ title: item.title, text: item.description, url: window.location.href })
                } catch {}
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="#1A2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* CARRUSEL */}
        <div style={styles.carouselWrapper}>
          <div style={styles.carousel} ref={carouselRef}>
            {images.map((img: string, i: number) => (
              <div key={i} style={styles.slide}>
                <img src={img} style={styles.image} />
              </div>
            ))}
          </div>

          {images.length > 1 && (
            <>
              <div style={styles.arrowLeft} onClick={prev}>‹</div>
              <div style={styles.arrowRight} onClick={next}>›</div>
            </>
          )}
        </div>

        {/* DOTS */}
        <div style={styles.dots}>
          {images.map((_: any, i: number) => (
            <div
              key={i}
              style={{
                ...styles.dot,
                opacity: current === i ? 1 : 0.3,
              }}
            />
          ))}
        </div>

        {/* BODY */}
        <div style={styles.body}>

          <h1 style={styles.title}>{item.title}</h1>

          <div style={styles.meta}>
            Por {item.wanted || 'algo a cambio'}
          </div>

          <div style={styles.badgesRow}>
            {item.city && (
              <div style={styles.badge}>{item.city}</div>
            )}
          </div>

          <p style={styles.desc}>{item.description}</p>

          <div style={styles.sectionTitle}>¿Te interesa?</div>

          <div style={styles.button} onClick={goToOffer}>
            Ofrecer algo a cambio
          </div>

          <div style={styles.divider} />

          {owner && (
            <div style={styles.userRow}>
              <div style={styles.userLeft}>
                <img
                  src={owner.avatar_url || '/images/avatar.png'}
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

/* ⭐ ICONO PRO */
function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B" style={{ marginLeft: 4 }}>
      <path d="M12 17.27L18.18 21 16.54 13.97 
      22 9.24 14.81 8.63 12 2 
      9.19 8.63 2 9.24 7.46 13.97 
      5.82 21z"/>
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
    padding: 20,
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
    overflowX: 'hidden',
  },

  slide: {
    minWidth: '100%',
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
    background: '#fff',
    borderRadius: '50%',
    width: 32,
    height: 32,
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
    background: '#fff',
    borderRadius: '50%',
    width: 32,
    height: 32,
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