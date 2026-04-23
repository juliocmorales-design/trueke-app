'use client'

import { useRouter } from 'next/navigation'

export default function ItemCard({ item }: { item: any }) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/item/${item.id}`)
  }

  const image =
    item.image ||
    (item.images && item.images.length > 0
      ? item.images[0]
      : '/images/placeholder.jpg')

  return (
    <div style={styles.card} onClick={handleClick}>
      <img src={image} style={styles.image} />

      <div style={styles.content}>
        <div style={styles.title}>{item.title}</div>

        <div style={styles.sub}>
          por {item.looking_for || 'algo'}
        </div>

        <div style={styles.meta}>
          📍 {item.city || 'Sin ubicación'}
        </div>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    cursor: 'pointer',
    boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
    transition: 'transform 0.15s ease',
  },

  image: {
    width: '100%',
    height: 150,
    objectFit: 'cover',
  },

  content: {
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },

  title: {
    fontWeight: 600,
    fontSize: 15,
  },

  sub: {
    fontSize: 13,
    color: '#666',
  },

  meta: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
}