'use client'

import { useParams } from 'next/navigation'

export default function ChainPage() {
  const params = useParams()
  const id = Number(params?.id)

  const chain = [
    {
      id: 1,
      title: 'Libro',
      user: 'Carlos',
      image: '/images/books.jpg',
    },
    {
      id: 2,
      title: 'Audífonos',
      user: 'Ana',
      image: '/images/books.jpg',
    },
    {
      id: 3,
      title: 'Bicicleta',
      user: 'Luis',
      image: '/images/bike.jpg',
    },
    {
      id: 4,
      title: 'Cámara',
      user: 'María',
      image: '/images/guitar.jpg',
    },
  ]

  const first = chain[0]
  const last = chain[chain.length - 1]

  const shareText = `Empecé con un ${first.title} y ahora tengo un ${last.title} 🔥 #Trueke`

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Mi cadena en Trueke',
          text: shareText,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(
          shareText + ' ' + window.location.href
        )
        alert('Texto copiado para compartir 🚀')
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🔁 Cadena de intercambio #{id}</h2>

      <button style={styles.shareBtn} onClick={handleShare}>
        Compartir mi progreso 🚀
      </button>

      <div style={styles.timeline}>
        {chain.map((step, index) => (
          <div key={step.id} style={styles.step}>
            {index !== chain.length - 1 && <div style={styles.line} />}

            <div style={styles.content}>
              <img src={step.image} style={styles.image} />

              <div>
                <div style={styles.item}>{step.title}</div>
                <div style={styles.user}>Por {step.user}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 12,
  },
  shareBtn: {
    width: '100%',
    marginBottom: 20,
    padding: 12,
    borderRadius: 12,
    border: 'none',
    background: '#F97316',
    color: '#fff',
    fontWeight: 600,
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
    position: 'relative' as const,
  },
  step: {
    position: 'relative' as const,
    paddingLeft: 20,
  },
  line: {
    position: 'absolute' as const,
    left: 8,
    top: 40,
    width: 2,
    height: '100%',
    background: '#E5E7EB',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 10,
    objectFit: 'cover' as const,
  },
  item: {
    fontWeight: 600,
  },
  user: {
    fontSize: 12,
    color: '#6B7280',
  },
}