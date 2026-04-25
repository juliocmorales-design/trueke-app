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

  // 🔥 FUNCIÓN CORREGIDA
  const createOffer = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('Debes iniciar sesión')
      return
    }

    if (!item || !owner) return

    // 🔥 1. Obtener un item del usuario (lo que ofrece)
    const { data: myItems } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)

    if (!myItems || myItems.length === 0) {
      alert('Primero debes publicar un objeto para intercambiar')
      return
    }

    const myItem = myItems[0]

    // 🔥 2. Crear offer
    const { data: offer, error } = await supabase
      .from('offers')
      .insert({
        from_user_id: user.id,
        to_user_id: owner.id,
        status: 'pending',
      })
      .select()
      .single()

    if (error || !offer) {
      console.error(error)
      alert('Error creando intercambio')
      return
    }

    // 🔥 3. Insertar items (REQUESTED + OFFERED)
    const { error: itemsError } = await supabase
      .from('offer_items')
      .insert([
        {
          offer_id: offer.id,
          item_id: item.id,
          owner_id: owner.id,
          type: 'requested',
        },
        {
          offer_id: offer.id,
          item_id: myItem.id,
          owner_id: user.id,
          type: 'offered',
        },
      ])

    if (itemsError) {
      console.error(itemsError)
      alert('Error guardando items del intercambio')
      return
    }

    // 🔥 4. Redirigir
    router.push('/intercambios')
  }

  if (loading) return <div style={styles.loading}>Cargando...</div>

  const image =
    Array.isArray(item.images) && item.images.length > 0
      ? item.images[0]
      : '/images/placeholder.png'

  return (
    <div style={styles.screen}>

      <div style={styles.header}>
        <div onClick={() => router.back()} style={styles.iconBtn}>
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

      <div style={styles.wrapper}>
        <div style={styles.body}>

          <div style={styles.imageWrapper}>
            <img src={image} style={styles.image} />
          </div>

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

          <div style={styles.sectionTitle}>
            ¿Te interesa?
          </div>

          <div style={styles.cta}>
            <div style={styles.button} onClick={createOffer}>
              Enviar mensaje
            </div>

            <div style={styles.circle}>
              <Icon>
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>
              </Icon>
            </div>
          </div>

          {owner && (
            <div style={styles.userCard}>
              <div style={styles.userLeft}>
                <img
                  src={owner.avatar_url || '/images/avatar.png'}
                  style={styles.avatar}
                />

                <div>
                  <strong style={styles.userName}>{owner.name}</strong>

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
    background: '#F6F3F0',
    minHeight: '100vh',
    width: '100%',
  },

  header: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },

  iconBtn: {
    padding: 6,
    cursor: 'pointer',
  },

  rightIcons: {
    display: 'flex',
    gap: 14,
  },

  wrapper: {
    display: 'flex',
    justifyContent: 'center',
  },

  body: {
    width: '100%',
    maxWidth: 500,
    padding: 20,
    paddingTop: 80,
  },

  imageWrapper: {
    width: '100%',
    height: 260,
    borderRadius: 24,
    overflow: 'hidden',
    background: '#eee',
  },

  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: 800,
    marginTop: 20,
    color: '#1F2A33',
    textAlign: 'center',
  },

  meta: {
    color: '#6F7A82',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
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
    marginTop: 18,
    lineHeight: 1.6,
    fontSize: 15,
    color: '#1F2A33',
    textAlign: 'center',
  },

  sectionTitle: {
    marginTop: 28,
    fontSize: 18,
    fontWeight: 700,
    textAlign: 'center',
  },

  cta: {
    display: 'flex',
    gap: 12,
    marginTop: 14,
  },

  button: {
    flex: 1,
    background: '#F97316',
    color: '#fff',
    textAlign: 'center',
    padding: 16,
    borderRadius: 30,
    fontWeight: 600,
    fontSize: 15,
    boxShadow: '0 12px 30px rgba(249,115,22,0.35)',
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

  userCard: {
    marginTop: 24,
    background: '#fff',
    borderRadius: 20,
    padding: 14,
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

  userName: {
    fontSize: 15,
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