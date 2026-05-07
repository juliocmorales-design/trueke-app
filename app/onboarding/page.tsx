'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '../lib/supabase'

const cities = [
  'Monterrey', 'CDMX', 'Guadalajara', 'Tijuana', 'Puebla',
  'León', 'Cancún', 'Mérida', 'San Luis Potosí', 'Chihuahua',
  'Toluca', 'Querétaro', 'Hermosillo', 'Saltillo', 'Aguascalientes'
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
  const [error, setError] = useState('')

  // existingUserId: set when user already has a session (incomplete profile)
  const [existingUserId, setExistingUserId] = useState<string | null>(null)

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [city, setCity] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [showOtroInput, setShowOtroInput] = useState(false)
  const [otroText, setOtroText] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()

      if (!data.session?.user) {
        setLoading(false)
        return
      }

      const user = data.session.user
      setExistingUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile?.username) {
        router.push('/')
        return
      }

      if (profile) {
        setUsername(profile.username || '')
        setCity(profile.city || '')
        setInterests(profile.interests || [])
      }

      setStep(0)
      setLoading(false)
    }

    init()
  }, [])

  const toggleInterest = (i: string) => {
    setInterests(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    )
  }

  const handleOtroClick = () => {
    if (showOtroInput && !otroText.trim()) setShowOtroInput(false)
    else setShowOtroInput(true)
  }

  const addCustomInterest = () => {
    const trimmed = otroText.trim()
    if (!trimmed) return
    if (!interests.includes(trimmed)) setInterests(prev => [...prev, trimmed])
    setOtroText('')
  }

  const handleFinish = async () => {
    setSaving(true)
    setError('')

    let uid = existingUserId

    if (!uid) {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })
      if (signUpErr) {
        setError(signUpErr.message)
        setSaving(false)
        return
      }
      uid = data.user?.id ?? null
      if (!uid) {
        setError('No se pudo crear la cuenta. Intenta de nuevo.')
        setSaving(false)
        return
      }
    }

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', uid)
      .maybeSingle()

    if (existing) {
      setError('Este username ya está tomado, elige otro')
      setSaving(false)
      return
    }

    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({ id: uid, username, city, interests })

    setSaving(false)

    if (profileErr) {
      setError(profileErr.message)
      return
    }

    localStorage.setItem('onboarding_seen', 'true')
    router.push('/')
  }

  if (loading) {
    return <div style={{ padding: 20, color: '#6B7680' }}>Cargando...</div>
  }

  if (step === 0) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        overflow: 'hidden', zIndex: 9999,
        backgroundColor: '#FDF8F3',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* 70% superior: imagen */}
        <img
          src="/images/onboarding-hero.jpg"
          alt=""
          style={{ width: '100%', height: '70%', objectFit: 'cover', objectPosition: 'top center', display: 'block', maxWidth: 'none', flexShrink: 0 }}
        />
        {/* 30% inferior: sección beige */}
        <div style={{
          flex: 1,
          backgroundColor: '#FDF8F3',
          padding: 24,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <p style={{ margin: '0 0 2px', textAlign: 'center', fontSize: 22, fontWeight: 700, color: '#1A2744' }}>
            Empieza con algo pequeño,
          </p>
          <p style={{ margin: '0 0 0', textAlign: 'center', fontSize: 22, fontWeight: 700, color: '#1A2744' }}>
            termina con algo{' '}
            <span style={{ color: '#F97316' }}>increíble.</span>
          </p>
          <button
            style={{
              marginTop: 16,
              background: '#F97316',
              color: '#fff',
              border: 'none',
              borderRadius: 16,
              fontWeight: 600,
              fontSize: 16,
              padding: 16,
              width: '100%',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
            onClick={() => setStep(1)}
          >
            Comenzar
          </button>
          <div style={{ marginTop: 12, textAlign: 'center', fontSize: 15, color: '#6B7280' }}>
            ¿Ya tienes cuenta?{' '}
            <button
              style={{ color: '#F97316', fontWeight: 600, fontSize: 15, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
              onClick={() => router.push('/login')}
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>

      {/* ── STEP 1: Nombre ── */}
      {step === 1 && (
        <div style={styles.stepContainer}>
          <div style={styles.progress}>
            <div style={{ ...styles.bar, width: '20%' }} />
          </div>

          <h1 style={styles.title}>¿Cuál es tu nombre?</h1>
          <p style={styles.subtitle}>Así te verán los demás en Trueke</p>

          <input
            style={styles.input}
            placeholder="tunombre"
            value={username}
            onChange={e => setUsername(e.target.value.replace('@', '').trim())}
            autoComplete="username"
          />

          <button style={{ ...styles.button, border: 'none' }} onClick={() => {
            if (!username.trim()) return
            setStep(existingUserId ? 4 : 2)
          }}>
            Siguiente →
          </button>

          <div style={styles.back} onClick={() => setStep(0)}>Atrás</div>
        </div>
      )}

      {/* ── STEP 2: Email ── */}
      {step === 2 && (
        <div style={styles.stepContainer}>
          <div style={styles.progress}>
            <div style={{ ...styles.bar, width: '40%' }} />
          </div>

          <h1 style={styles.title}>¿Cuál es tu email?</h1>
          <p style={styles.subtitle}>Para crear tu cuenta en Trueke</p>

          <input
            style={styles.input}
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            type="email"
            autoComplete="email"
          />

          {error && <p style={styles.errorText}>{error}</p>}

          <button style={{ ...styles.button, border: 'none' }} onClick={() => {
            if (!email.trim()) return
            setStep(3)
          }}>
            Siguiente →
          </button>

          <div style={styles.back} onClick={() => setStep(1)}>Atrás</div>
        </div>
      )}

      {/* ── STEP 3: Contraseña ── */}
      {step === 3 && (
        <div style={styles.stepContainer}>
          <div style={styles.progress}>
            <div style={{ ...styles.bar, width: '60%' }} />
          </div>

          <h1 style={styles.title}>Elige tu contraseña</h1>
          <p style={styles.subtitle}>Al menos 6 caracteres</p>

          <input
            style={styles.input}
            placeholder="Contraseña"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            type="password"
            autoComplete="new-password"
          />
          <input
            style={styles.input}
            placeholder="Confirma tu contraseña"
            value={confirmPassword}
            onChange={e => { setConfirmPassword(e.target.value); setError('') }}
            type="password"
            autoComplete="new-password"
          />

          {error && <p style={styles.errorText}>{error}</p>}

          <button style={{ ...styles.button, border: 'none' }} onClick={() => {
            if (password.length < 6) { setError('Mínimo 6 caracteres'); return }
            if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return }
            setError('')
            setStep(4)
          }}>
            Siguiente →
          </button>

          <div style={styles.back} onClick={() => { setError(''); setStep(2) }}>Atrás</div>
        </div>
      )}

      {/* ── STEP 4: Ciudad ── */}
      {step === 4 && (
        <div style={styles.stepContainer}>
          <div style={styles.progress}>
            <div style={{ ...styles.bar, width: '80%' }} />
          </div>

          <h1 style={styles.title}>¿De qué ciudad eres?</h1>

          <div style={styles.chips}>
            {cities.map(c => (
              <div
                key={c}
                style={{
                  ...styles.chip,
                  background: city === c ? '#F97316' : '#fff',
                  color: city === c ? '#fff' : '#333',
                  borderColor: city === c ? '#F97316' : '#ddd',
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

          <button style={{ ...styles.button, border: 'none' }} onClick={() => {
            if (!city.trim()) return
            setStep(5)
          }}>
            Siguiente →
          </button>

          <div style={styles.back} onClick={() => setStep(existingUserId ? 1 : 3)}>Atrás</div>
        </div>
      )}

      {/* ── STEP 5: Intereses ── */}
      {step === 5 && (
        <div style={styles.stepContainer}>
          <div style={styles.progress}>
            <div style={{ ...styles.bar, width: '100%' }} />
          </div>

          <h1 style={styles.title}>¿Qué te interesa intercambiar?</h1>
          <p style={styles.subtitle}>Selecciona todo lo que aplique</p>

          <div style={styles.chips}>
            {interestsList.filter(i => i !== 'Otro').map(i => (
              <div
                key={i}
                style={{
                  ...styles.chip,
                  background: interests.includes(i) ? '#F97316' : '#fff',
                  color: interests.includes(i) ? '#fff' : '#333',
                  borderColor: interests.includes(i) ? '#F97316' : '#ddd',
                }}
                onClick={() => toggleInterest(i)}
              >
                {i}
              </div>
            ))}

            {interests.filter(i => !interestsList.includes(i)).map(i => (
              <div
                key={i}
                style={{
                  ...styles.chip,
                  background: '#F97316',
                  color: '#FDF8F3',
                  borderColor: '#F97316',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {i}
                <span
                  style={{ fontWeight: 700, lineHeight: 1, cursor: 'pointer' }}
                  onClick={() => setInterests(interests.filter(x => x !== i))}
                >
                  ×
                </span>
              </div>
            ))}

            <div
              style={{
                ...styles.chip,
                background: showOtroInput ? '#F97316' : '#FDF8F3',
                color: showOtroInput ? '#FDF8F3' : '#1A2744',
                borderColor: showOtroInput ? '#F97316' : '#ddd',
              }}
              onClick={handleOtroClick}
            >
              + Otro
            </div>
          </div>

          {showOtroInput && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                style={{ ...styles.input, flex: 1, marginBottom: 0 }}
                placeholder="¿Qué te interesa? Ej: fotografía, cocina..."
                value={otroText}
                onChange={e => setOtroText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addCustomInterest() }}
                autoFocus
              />
              <div
                style={{
                  background: '#F97316',
                  color: '#FDF8F3',
                  padding: '0 18px',
                  borderRadius: 16,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  whiteSpace: 'nowrap',
                }}
                onClick={addCustomInterest}
              >
                Agregar
              </div>
            </div>
          )}

          {error && <p style={styles.errorText}>{error}</p>}

          <button style={{ ...styles.button, border: 'none' }} onClick={handleFinish} disabled={saving}>
            {saving ? 'Creando cuenta...' : '¡Todo listo! ✓'}
          </button>

          <div style={styles.back} onClick={() => { setError(''); setStep(4) }}>Atrás</div>
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
    background: '#FDF8F3',
  },

  stepContainer: {
    marginTop: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 32,
    fontWeight: 700,
    marginBottom: 10,
    color: '#1A2744',
  },

  subtitle: {
    color: '#6B7680',
    marginBottom: 20,
  },

  illustrationWrapper: {
    position: 'relative',
    height: 320,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },

  image: {
    width: '105%',
    zIndex: 1,
  },

  progress: {
    height: 4,
    background: '#E9E2DB',
    borderRadius: 2,
    marginBottom: 30,
    overflow: 'hidden',
  },

  bar: {
    height: '100%',
    background: '#F97316',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },

  input: {
    width: '100%',
    padding: 14,
    borderRadius: 10,
    border: 'none',
    marginBottom: 16,
    fontSize: 16,
    background: '#F0EAE0',
    boxSizing: 'border-box',
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
    fontSize: 14,
    transition: 'all 0.15s ease',
  },

  button: {
    background: '#F97316',
    color: '#fff',
    textAlign: 'center',
    padding: 16,
    borderRadius: 16,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 16,
    marginBottom: 8,
    width: '100%',
  },

  back: {
    marginTop: 10,
    textAlign: 'center',
    color: '#6B7680',
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 500,
    padding: 14,
  },

  login: {
    textAlign: 'center',
    marginTop: 10,
    color: '#6B7680',
    fontSize: 14,
  },

  errorText: {
    color: '#e53e3e',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
}
