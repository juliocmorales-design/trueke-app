'use client'

export default function FeaturedChains() {
  const chains = [
    {
      id: 1,
      title: 'De libro a bicicleta',
      subtitle: '5 intercambios',
      image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba',
    },
    {
      id: 2,
      title: 'De audífonos a laptop',
      subtitle: '3 intercambios',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
    },
    {
      id: 3,
      title: 'De cámara a moto',
      subtitle: '7 intercambios',
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
    },
  ]

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <h3 style={styles.title}>Cerca de ti</h3>
        <span style={styles.link}>Ver todo</span>
      </div>

      {/* SCROLL HORIZONTAL */}
      <div style={styles.scroll}>
        {chains.map((chain) => (
          <div key={chain.id} style={styles.card}>
            <img src={chain.image} style={styles.image} />

            <div style={styles.cardBody}>
              <div style={styles.cardTitle}>{chain.title}</div>
              <div style={styles.cardSubtitle}>{chain.subtitle}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles: any = {
  container: {
    padding: '0 16px',
    marginTop: 10,
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
  },

  link: {
    color: '#f97316',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  },

  scroll: {
    display: 'flex',
    gap: 14,
    overflowX: 'auto',
    paddingBottom: 6,
  },

  card: {
    minWidth: 200,
    maxWidth: 200,
    background: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    flexShrink: 0,
  },

  image: {
    width: '100%',
    height: 130,
    objectFit: 'cover',
  },

  cardBody: {
    padding: 12,
  },

  cardTitle: {
    fontWeight: 600,
    fontSize: 14,
    marginBottom: 4,
  },

  cardSubtitle: {
    fontSize: 12,
    color: '#777',
  },
}