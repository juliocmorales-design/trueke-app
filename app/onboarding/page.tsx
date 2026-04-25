'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '../lib/supabase'

const cities = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami',
  'London', 'Madrid', 'Barcelona', 'Mexico City',
  'Buenos Aires', 'Bogotá', 'Lima', 'Santiago', 'São Paulo', 'Rio de Janeiro'
]

const interestsList = [
  'Electrónica', 'Ropa', 'Libros', 'Muebles',
  'Deportes', 'Arte', 'Música', 'Herramientas',
  'Juguetes', 'Vehículos', 'Servicios', 'Comida',
  'Plantas', 'Mascotas', 'Otro'
]

export default function Onboarding() {
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [userId, setUserId] = useState<string | null>(null)

  const [username, setUsername] = useState('')
  const [city, setCity] = useState('')
  const [interests, setInterests] = useState<string[]>([])

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()

      if (!data.session?.user) {
        setLoading(false)
        return
      }

      const user = data.session.user
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUsername(profile.username || '')
        setCity(profile.city || '')
        setInterests(profile.interests || [])
      }

      setLoading(false)
    }

    init()
  }, [])

  const toggleInterest = (i: string) => {
    if (interests.includes(i)) {
      setInterests(interests.filter(x => x !== i))
    } else {
      setInterests([...interests, i])
    }
  }

  const saveAll = async () => {
    if (!username || !city) {
      alert('Completa los campos')
      return
    }

    setSaving(true)

    await supabase
      .from('profiles')
      .update({
        username,
        city,
        interests,
      })
      .eq('id', userId)

    setSaving(false)

    localStorage.setItem('onboarding_seen', 'true')
    router.push('/')
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Cargando...</div>
  }

  return (
    <div style={styles.container}>

      {/* STEP 0 → TU PANTALLA ORIGINAL */}
      {step === 0 && (
        <>
          <div style={styles.header}>
            <div>9:41</div>
            <div style={{ cursor: 'pointer' }} onClick={() => setStep(1)}>
              Omitir
            </div>
          </div>

          <div style={styles.content}>
            <h1 style={styles.title}>
              Bienvenido a <br />
              <span style={styles.accent}>Trueke</span>
            </h1>

            <p style={styles.subtitle}>
              Intercambia, conecta <br />
              y crea comunidad.
            </p>

            <div style={styles.illustrationWrapper}>
              <div style={styles.blob} />
              <img src="/images/portada.png" style={styles.image} />
            </div>

            <div style={styles.dots}>
              <div style={{ ...styles.dot, ...styles.activeDot }} />
              <div style={styles.dot} />
              <div style={styles.dot} />
            </div>
          </div>

          <div>
            <div style={styles.button} onClick={() => setStep(1)}>
              Comenzar
            </div>

            <div style={styles.login}>
              ¿Ya tienes cuenta?{' '}
              <span onClick={() => router.push('/login')}>
                Iniciar sesión
              </span>
            </div>
          </div>
        </>
      )}

      {/* STEP 1 → USERNAME */}
      {step === 1 && (
        <div style={styles.stepContainer}>
          <div style={styles.progress}><div style={{ ...styles.bar, width: '33%' }} /></div>

          <h1 style={styles.title}>¡Bienvenido!</h1>
          <p style={styles.subtitle}>Elige un username</p>

          <input
            style={styles.input}
            placeholder="@username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />

          <div style={styles.button} onClick={() => setStep(2)}>
            Siguiente →
          </div>
        </div>
      )}

      {/* STEP 2 → CIUDAD */}
      {step === 2 && (
        <div style={styles.stepContainer}>
          <div style={styles.progress}><div style={{ ...styles.bar, width: '66%' }} /></div>

          <h1 style={styles.title}>Elige tu ciudad</h1>

          <div style={styles.chips}>
            {cities.map(c => (
              <div
                key={c}
                style={{
                  ...styles.chip,
                  background: city === c ? '#F97316' : '#fff',
                  color: city === c ? '#fff' : '#333',
                }}
                onClick={() => setCity(c)}
              >
                {c}
              </div>
            ))}
          </div>

          <input
            style={styles.input}
            placeholder="O escribe tu ciudad"
            value={city}
            onChange={e => setCity(e.target.value)}
          />

          <div style={styles.button} onClick={() => setStep(3)}>
            Siguiente →
          </div>

          <div style={styles.back} onClick={() => setStep(1)}>Atrás</div>
        </div>
      )}

      {/* STEP 3 → INTERESES */}
      {step === 3 && (
        <div style={styles.stepContainer}>
          <div style={styles.progress}><div style={{ ...styles.bar, width: '100%' }} /></div>

          <h1 style={styles.title}>Elige tus intereses</h1>

          <div style={styles.chips}>
            {interestsList.map(i => (
              <div
                key={i}
                style={{
                  ...styles.chip,
                  background: interests.includes(i) ? '#F97316' : '#fff',
                  color: interests.includes(i) ? '#fff' : '#333',
                }}
                onClick={() => toggleInterest(i)}
              >
                {i}
              </div>
            ))}
          </div>

          <div style={styles.button} onClick={saveAll}>
            {saving ? 'Guardando...' : '¡Todo listo! ✓'}
          </div>

          <div style={styles.back} onClick={() => setStep(2)}>Atrás</div>
        </div>
      )}

    </div>
  )
}

const styles: any = {
  container: {
    padding: 20,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    background: '#F6F3F0',
  },

  stepContainer: {
    marginTop: 20,
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#6B7680',
    fontSize: 14,
  },

  content: {},

  title: {
    fontSize: 32,
    marginBottom: 10,
  },

  accent: {
    color: '#F97316',
  },

  subtitle: {
    color: '#6B7680',
    marginBottom: 20,
  },

  illustrationWrapper: {
    position: 'relative',
    height: 280,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },

  blob: {
    position: 'absolute',
    width: 260,
    height: 180,
    background: '#E9E2DB',
    borderRadius: '50%',
  },

  image: {
    width: '90%',
    position: 'relative',
  },

  dots: {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#D8CFC7',
  },

  activeDot: {
    background: '#F97316',
  },

  input: {
    width: '100%',
    padding: 14,
    borderRadius: 10,
    border: '1px solid #ddd',
    marginBottom: 20,
  },

  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },

  chip: {
    padding: '10px 14px',
    borderRadius: 999,
    border: '1px solid #ddd',
    cursor: 'pointer',
  },

  button: {
    background: '#F97316',
    color: '#fff',
    textAlign: 'center',
    padding: 16,
    borderRadius: 30,
    fontWeight: 600,
    cursor: 'pointer',
  },

  back: {
    marginTop: 10,
    textAlign: 'center',
    color: '#6B7680',
    cursor: 'pointer',
  },

  login: {
    textAlign: 'center',
    marginTop: 10,
  },
}