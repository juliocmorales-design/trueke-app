'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import supabase from '@/app/lib/supabase'

export default function ItemDetail() {
  const { id } = useParams()
  const router = useRouter()

  const [item, setItem] = useState<any>(null)
  const [owner, setOwner] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadItem()
  }, [])

  const loadItem = async () => {
    const { data } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single()

    if (!data) {
      router.push('/')
      return
    }

    setItem(data)

    if (data.user_id) {
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user_id)
        .single()

      setOwner(userData)
    }

    setLoading(false)
  }

  const goToChat = () => {
    if (!owner?.id) return
    router.push(`/mensajes/${owner.id}`)
  }

  if (loading) return <div style={styles.loading}>Cargando...</div>

  const image =
    Array.isArray(item.images) && item.images.length > 0
      ? item.images[0]
      : '/images/placeholder.jpg'

  return (
    <div style={styles.screen}>
      <div style={styles.card}>

        {/* HEADER */}
        <div style={styles.header}>
          <div onClick={() => router.back()}>
            <Icon>
              <polyline points="15 18 9 12 15 6"/>
            </Icon>
          </div>

          <div style={styles.rightIcons}>
            <Icon>
              <path d="M12 3v12"/>
              <polyline points="8 7 12 3 16 7"/>
              <rect x="4" y="13" width="16" height="8" rx="2"/>
            </Icon>

            <Icon>
              <circle cx="5" cy="12" r="1"/>
              <circle cx="12" cy="12" r="1"/>
              <circle cx="19" cy="12" r="1"/>
            </Icon>
          </div>
        </div>

        {/* IMAGE */}
        <div style={styles.image}>
          <img src={image} style={styles.imageTag} />
        </div>

        {/* BODY */}
        <div style={styles.body}>

          <div>
            <h1 style={styles.title}>{item.title}</h1>

            <div style={styles.meta}>
              Por {item.looking_for || 'algo'} • A 1.2 km
            </div>

            <div style={styles.badge}>
              92 • Muy confiable
            </div>

            <div style={styles.desc}>
              {item.description || 'Sin descripción'}
            </div>
          </div>

          {/* CTA */}
          <div>
            <div style={styles.cta}>
              <div style={styles.button} onClick={goToChat}>
                Enviar mensaje
              </div>

              <div style={styles.circle}>
                <Icon>
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>
                </Icon>
              </div>
            </div>

            {/* USER */}
            {owner && (
              <div style={styles.user}>
                <div style={styles.userLeft}>
                  <img
                    src={owner.avatar_url || '/images/avatar.png'}
                    style={styles.avatar}
                  />

                  <div>
                    <strong>{owner.name}</strong>

                    <div style={styles.sub}>
                      34 intercambios • 4.9 ⭐
                    </div>
                  </div>
                </div>

                <Icon>
                  <polyline points="9 6 15 12 9 18"/>
                </Icon>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}

function Icon({ children }: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#1E1E1E" strokeWidth="2" style={{ width: 22 }}>
      {children}
    </svg>
  )
}

const styles: any = {
  screen: {
    background: '#EDE7E1',
    padding: 20,
    minHeight: '100vh',
  },

  card: {
    background: '#F6F3F0',
    borderRadius: 36,
    padding: 16,
    maxWidth: 420,
    margin: '0 auto',
    minHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  rightIcons: {
    display: 'flex',
    gap: 14,
  },

  image: {
    marginTop: 12,
    borderRadius: 24,
    overflow: 'hidden',
  },

  imageTag: {
    width: '100%',
    height: 260,
    objectFit: 'cover',
  },

  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  title: {
    fontSize: 26,
    fontWeight: 700,
    marginTop: 18,
  },

  meta: {
    color: '#6F7A82',
    fontSize: 15,
    marginTop: 6,
  },

  badge: {
    marginTop: 12,
    display: 'inline-block',
    background: '#DDE8DF',
    color: '#2F6B3E',
    padding: '6px 14px',
    borderRadius: 20,
    fontSize: 13,
  },

  desc: {
    marginTop: 16,
    lineHeight: 1.6,
    fontSize: 15,
  },

  cta: {
    display: 'flex',
    gap: 12,
    marginTop: 26,
  },

  button: {
    flex: 1,
    background: '#F97316',
    color: '#fff',
    textAlign: 'center',
    padding: 18,
    borderRadius: 30,
    fontWeight: 600,
    fontSize: 16,
    boxShadow: '0 10px 25px rgba(249,115,22,0.3)',
    cursor: 'pointer',
  },

  circle: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: '#EDE5DD',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  user: {
    marginTop: 22,
    paddingTop: 16,
    borderTop: '1px solid #ddd',
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
    width: 46,
    height: 46,
    borderRadius: '50%',
    objectFit: 'cover',
  },

  sub: {
    fontSize: 13,
    color: '#6F7A82',
  },

  loading: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}