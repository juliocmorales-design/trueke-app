'use client'

import { useEffect, useState } from 'react'
import supabase from '@/app/lib/supabase'
import Icon from '../icons/Icon'

const PLACEHOLDER =
  'https://via.placeholder.com/300x200?text=Sin+imagen'

// 🔥 evita loop infinito
function handleImageError(e: any) {
  if (e.currentTarget.dataset.errorHandled === 'true') return

  e.currentTarget.dataset.errorHandled = 'true'
  e.currentTarget.src = PLACEHOLDER
}

function isValidUrl(url: any) {
  if (!url) return false
  if (typeof url !== 'string') return false

  const clean = url.trim()

  if (
    clean === '' ||
    clean === 'null' ||
    clean === 'undefined'
  ) {
    return false
  }

  return clean.startsWith('http')
}

function getImage(item: any) {
  try {
    if (typeof item.images === 'string') {
      const parsed = JSON.parse(item.images)

      if (Array.isArray(parsed) && parsed.length > 0) {
        if (isValidUrl(parsed[0])) return parsed[0]
      }
    }

    if (Array.isArray(item.images) && item.images.length > 0) {
      if (isValidUrl(item.images[0])) return item.images[0]
    }

    if (isValidUrl(item.image)) {
      return item.image
    }
  } catch (e) {
    console.log('Error parsing images', e)
  }

  return PLACEHOLDER
}

export default function Feed() {
  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    const { data } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false })

    setItems(data || [])
  }

  const filtered = items.filter(item =>
    item.title?.toLowerCase().includes(search.toLowerCase())
  )

  const featured = filtered.slice(0, 4)
  const recommended = filtered.slice(4)

  return (
    <div style={styles.container}>
      
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.location}>
          <Icon name="location" active size={18} />
          <span>Monterrey</span>
        </div>

        <div style={styles.headerIcons}>
          <Icon name="notifications" />
          <Icon name="messages" />
        </div>
      </div>

      {/* SEARCH */}
      <div style={styles.search}>
        <Icon name="search" size={18} />
        <input
          placeholder="Buscar objetos o personas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* CERCA DE TI */}
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Cerca de ti</h3>
        <span style={styles.link}>Ver todo</span>
      </div>

      <div style={styles.horizontal}>
        {featured.map((item) => {
          const image = getImage(item)

          return (
            <div
              key={item.id}
              style={styles.cardHorizontal}
              onClick={() =>
                window.location.href = `/item/${item.id}`
              }
            >
              <div style={styles.imageWrapper}>
                <img
                  src={image}
                  style={styles.image}
                  onError={handleImageError}
                />

                <div style={styles.heart}>❤️</div>
              </div>

              <div style={styles.cardBody}>
                <div style={styles.title}>{item.title}</div>

                <div style={styles.subtitle}>
                  por {item.wanted || 'algo'}
                </div>

                <div style={styles.meta}>
                  {Math.floor(Math.random() * 5) + 1}.
                  {Math.floor(Math.random() * 9)} km
                </div>

                <div style={styles.userRow}>
                  <div style={styles.avatar} />
                  <span style={styles.userName}>Usuario</span>
                  <span style={styles.score}>
                    ⭐ 4.{Math.floor(Math.random() * 9)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* RECOMENDADOS */}
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Recomendados</h3>
        <span style={styles.badge}>Nuevo</span>
      </div>

      <div style={styles.grid}>
        {recommended.map((item) => {
          const image = getImage(item)

          return (
            <div
              key={item.id}
              style={styles.card}
              onClick={() =>
                window.location.href = `/item/${item.id}`
              }
            >
              <div style={styles.imageWrapper}>
                <img
                  src={image}
                  style={styles.image}
                  onError={handleImageError}
                />

                <div style={styles.heart}>❤️</div>
              </div>

              <div style={styles.cardBody}>
                <div style={styles.title}>{item.title}</div>

                <div style={styles.subtitle}>
                  por {item.wanted || 'algo'}
                </div>

                <div style={styles.meta}>
                  {Math.floor(Math.random() * 5) + 1}.
                  {Math.floor(Math.random() * 9)} km
                </div>

                <div style={styles.userRow}>
                  <div style={styles.avatar} />
                  <span style={styles.userName}>Usuario</span>
                  <span style={styles.score}>
                    ⭐ 4.{Math.floor(Math.random() * 9)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}

const styles: any = {
  container: {
    padding: 16,
    paddingBottom: 120,
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  location: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontWeight: 600,
    fontSize: 16,
  },

  headerIcons: {
    display: 'flex',
    gap: 14,
  },

  search: {
    marginTop: 16,
    background: '#EAE3DD',
    padding: '12px 16px',
    borderRadius: 30,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  searchInput: {
    border: 'none',
    background: 'transparent',
    width: '100%',
    outline: 'none',
    fontSize: 14,
  },

  sectionHeader: {
    marginTop: 20,
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
  },

  link: {
    color: '#F97316',
    fontWeight: 600,
  },

  badge: {
    background: '#F97316',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: 10,
    fontSize: 12,
  },

  horizontal: {
    display: 'flex',
    gap: 12,
    overflowX: 'auto',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 14,
  },

  card: {
    background: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
  },

  cardHorizontal: {
    minWidth: 180,
    background: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
  },

  imageWrapper: {
    position: 'relative',
  },

  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    background: '#fff',
    borderRadius: '50%',
    padding: 6,
    fontSize: 12,
  },

  image: {
    width: '100%',
    height: 140,
    objectFit: 'cover',
  },

  cardBody: {
    padding: 10,
  },

  title: {
    fontWeight: 600,
  },

  subtitle: {
    color: '#6B6B6B',
    fontSize: 14,
  },

  meta: {
    fontSize: 13,
    marginTop: 4,
    color: '#6B6B6B',
  },

  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },

  avatar: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#ddd',
  },

  userName: {
    fontSize: 12,
    color: '#555',
  },

  score: {
    fontSize: 12,
    marginLeft: 'auto',
  },
}