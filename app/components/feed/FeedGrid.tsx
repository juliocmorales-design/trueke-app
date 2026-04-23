'use client'

import Link from 'next/link'

type Item = {
  id: number
  title: string
  description: string
  image?: string | null
  images?: any
  city?: string | null
  user_avatar?: string | null
  user_name?: string | null
}

// 🔥 NORMALIZADOR DE IMÁGENES
function getImage(item: Item) {
  try {
    if (typeof item.images === 'string') {
      const parsed = JSON.parse(item.images)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0]
    }

    if (Array.isArray(item.images) && item.images.length > 0) {
      return item.images[0]
    }

    if (item.image) return item.image
  } catch (e) {
    console.log('Error parsing images', e)
  }

  return '/images/placeholder.jpg'
}

export default function FeedGrid({ items }: { items: Item[] }) {
  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        {items.map((item) => {
          const image = getImage(item)

          // 🔥 MOCK DATA (luego será real)
          const avatar =
            item.user_avatar ||
            `https://i.pravatar.cc/100?img=${(item.id % 10) + 1}`

          const score = (Math.random() * 1 + 4).toFixed(1)
          const online = Math.random() > 0.5

          return (
            <Link key={item.id} href={`/item/${item.id}`} style={styles.card}>
              
              {/* 🖼 IMAGEN */}
              <div style={styles.imageWrapper}>
                <img
                  src={image}
                  style={styles.image}
                  onError={(e) => {
                    e.currentTarget.src = '/images/placeholder.jpg'
                  }}
                />

                {/* ❤️ FAVORITO */}
                <div style={styles.heart}>♡</div>
              </div>

              {/* 📄 INFO */}
              <div style={styles.content}>
                <div style={styles.title}>{item.title}</div>

                <div style={styles.sub}>
                  por {item.description?.slice(0, 20) || 'algo'}
                </div>

                {/* 👤 USER */}
                <div style={styles.userRow}>
                  <div style={styles.avatarWrapper}>
                    <img src={avatar} style={styles.avatar} />
                    {online && <div style={styles.online} />}
                  </div>

                  <div style={styles.userInfo}>
                    <div style={styles.username}>
                      {item.user_name || 'Usuario'}
                    </div>
                    <div style={styles.score}>⭐ {score}</div>
                  </div>
                </div>

                {/* 📍 META */}
                <div style={styles.meta}>
                  📍 {item.city || 'Sin ubicación'}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

const styles: any = {
  container: {
    padding: '0 16px',
    marginTop: 10,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },

  card: {
    background: '#fff',
    borderRadius: 22,
    overflow: 'hidden',
    textDecoration: 'none',
    color: '#111',
    boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
    transition: 'transform 0.15s ease',
  },

  imageWrapper: {
    position: 'relative',
  },

  image: {
    width: '100%',
    height: 160,
    objectFit: 'cover',
    background: '#eee',
  },

  heart: {
    position: 'absolute',
    top: 10,
    right: 10,
    background: '#fff',
    borderRadius: '50%',
    padding: '6px 8px',
    fontSize: 14,
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  },

  content: {
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },

  title: {
    fontWeight: 600,
    fontSize: 15,
  },

  sub: {
    fontSize: 13,
    color: '#666',
  },

  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },

  avatarWrapper: {
    position: 'relative',
  },

  avatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    objectFit: 'cover',
  },

  online: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 8,
    height: 8,
    background: '#22c55e',
    borderRadius: '50%',
    border: '2px solid #fff',
  },

  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1,
  },

  username: {
    fontSize: 12,
    fontWeight: 500,
  },

  score: {
    fontSize: 11,
    color: '#888',
  },

  meta: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
}