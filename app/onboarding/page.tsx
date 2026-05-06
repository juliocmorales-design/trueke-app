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

  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [city, setCity] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [showOtroInput, setShowOtroInput] = useState(false)
  const [otroText, setOtroText] = useState('')

  const [email, setEmail] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

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

      if (profile?.username) {
        router.push('/')
        return
      }

      if (profile) {
        setUsername(profile.username || '')
        setCity(profile.city || '')
        setInterests(profile.interests || [])
      }

      // Session exists but profile incompleto → mostrar bienvenida
      setStep(0)
      setLoading(false)
    }

    init()
  }, [])

  const sendEmailOtp = async () => {
    if (!email.trim()) return
    setSendingEmail(true)
    setError('')

    const { error: err } = await supabase.auth.signInWithOtp({ email: email.trim() })

    setSendingEmail(false)

    if (err) {
      setError(err.message)
    } else {
      setEmailSent(true)
    }
  }

  const toggleInterest = (i: string) => {
    if (interests.includes(i)) {
      setInterests(interests.filter(x => x !== i))
    } else {
      setInterests([...interests, i])
    }
  }

  const handleOtroClick = () => {
    if (showOtroInput && !otroText.trim()) {
      setShowOtroInput(false)
    } else {
      setShowOtroInput(true)
    }
  }

  const addCustomInterest = () => {
    const trimmed = otroText.trim()
    if (!trimmed) return
    if (!interests.includes(trimmed)) {
      setInterests([...interests, trimmed])
    }
    setOtroText('')
  }

  const saveProfile = async (): Promise<boolean> => {
    if (!username || !city) {
      setError('Completa los campos requeridos')
      return false
    }

    setSaving(true)

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', userId)
      .maybeSingle()

    if (existing) {
      setError('Este username ya está tomado, elige otro')
      setSaving(false)
      return false
    }

    const { error: err } = await supabase
      .from('profiles')
      .upsert({ id: userId, username, city, interests })

    setSaving(false)

    if (err) {
      setError(err.message)
      return false
    }

    localStorage.setItem('onboarding_seen', 'true')
    return true
  }

  const handleFinish = async () => {
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    const ok = await saveProfile()
    if (!ok) return

    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      setError(err.message)
      return
    }

    router.push('/')
  }

  if (loading) {
    return <div style={{ padding: 20, color: '#6B7680' }}>Cargando...</div>
  }

  return (
    <div style={styles.container}>

      {/* ── STEP 0: Bienvenida ── */}
      {step === 0 && (
        <>
          <div style={{ textAlign: 'center' }}>
            <img src="/images/logo.png" alt="Trueke.app" style={{ width: '200px', maxWidth: '100%', display: 'block', margin: '0 auto 16px' }} />

            <p style={{ ...styles.subtitle, fontSize: 18, color: '#1A2744', fontWeight: 500, marginTop: 12 }}>
              Intercambia, conecta y crea comunidad.
            </p>
          </div>

          <div style={styles.illustrationWrapper}>
            <img src="/images/portada.png" alt="Trueke" style={styles.image} />
          </div>

          <div>
            <button style={{ ...styles.button, marginTop: 16, border: 'none' }} onClick={() => setStep(1)}>
              Comenzar
            </button>

            <div style={{ ...styles.login, fontSize: 16, color: '#6B7280' }}>
              ¿Ya tienes cuenta?{' '}
              <button
                style={{ color: '#F97316', fontWeight: 600, cursor: 'pointer', fontSize: 16, border: 'none', background: 'none', padding: '8px', fontFamily: 'inherit' }}
                onClick={() => router.push('/login')}
              >
                Iniciar sesión
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── STEP 1: Verificación ── */}
      {step === 1 && (
        <div style={styles.stepContainer}>
          <div style={styles.progress}>
            <div style={{ ...styles.bar, width: '25%' }} />
          </div>

          <h1 style={{ ...styles.title, fontSize: 24, color: '#1A2744' }}>
            Necesitamos verificarte
          </h1>
          <p style={{ ...styles.subtitle, fontSize: 15 }}>
            Te enviamos un enlace a tu correo para entrar
          </p>

          {/* Opción: Email */}
          <p style={styles.optionLabel}>Con tu email</p>
          <p style={styles.optionSub}>Te enviamos un enlace para entrar</p>
          {emailSent ? (
            <div style={styles.successMsg}>
              Revisa tu correo — te enviamos un enlace para entrar
            </div>
          ) : (
            <>
              <input
                style={styles.input}
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                type="email"
              />
              <div
                style={{
                  ...styles.verifyBtn,
                  background: email.length > 0 ? '#F97316' : 'transparent',
                  color: email.length > 0 ? '#fff' : '#F97316',
                  opacity: email.length > 0 ? 1 : 0.6,
                }}
                onClick={sendEmailOtp}
              >
                {sendingEmail ? 'Enviando...' : 'Enviar enlace por email'}
              </div>
            </>
          )}

          {error && <p style={styles.errorText}>{error}</p>}

          {/* Leyenda de confianza */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 20, padding: '0 4px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M12 2L4 5v6c0 5.25 3.5 10.15 8 11.35C16.5 21.15 20 16.25 20 11V5l-8-3z" fill="#6B7280" />
            </svg>
            <p style={{ margin: 0, fontSize: 14, color: '#6B7280', lineHeight: 1.5 }}>
              Solo para verificar tu identidad. Nunca compartimos tus datos ni los usamos para publicidad o spam.
            </p>
          </div>

          <div style={styles.back} onClick={() => setStep(0)}>Atrás</div>
        </div>
      )}

      {/* ── STEP 3: Username ── */}
      {step === 3 && (
        <div style={styles.stepContainer}>
          <div style={styles.progress}>
            <div style={{ ...styles.bar, width: '50%' }} />
          </div>

          <h1 style={styles.title}>¡Bienvenido!</h1>
          <p style={styles.subtitle}>Elige un username</p>

          <input
            style={styles.input}
            placeholder="tunombre"
            value={username}
            onChange={e => setUsername(e.target.value.replace('@', '').trim())}
          />

          <button style={{ ...styles.button, border: 'none' }} onClick={() => {
            if (!username.trim()) return
            setStep(4)
          }}>
            Siguiente →
          </button>
        </div>
      )}

      {/* ── STEP 4: Ciudad ── */}
      {step === 4 && (
        <div style={styles.stepContainer}>
          <div style={styles.progress}>
            <div style={{ ...styles.bar, width: '75%' }} />
          </div>

          <h1 style={styles.title}>Elige tu ciudad</h1>

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

          <div style={styles.back} onClick={() => setStep(3)}>Atrás</div>
        </div>
      )}

      {/* ── STEP 5: Intereses ── */}
      {step === 5 && (
        <div style={styles.stepContainer}>
          <div style={styles.progress}>
            <div style={{ ...styles.bar, width: '100%' }} />
          </div>

          <h1 style={styles.title}>¿Qué te interesa?</h1>
          <p style={styles.subtitle}>Selecciona todo lo que aplique</p>

          <div style={styles.chips}>
            {/* Categorías predefinidas */}
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

            {/* Intereses personalizados con × */}
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

            {/* Botón Otro */}
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

          {/* Input personalizado */}
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

          <button style={{ ...styles.button, border: 'none' }} onClick={() => setStep(6)}>
            Siguiente →
          </button>

          <div style={styles.back} onClick={() => setStep(4)}>Atrás</div>
        </div>
      )}

      {/* ── STEP 6: Contraseña ── */}
      {step === 6 && (
        <div style={styles.stepContainer}>
          <div style={styles.progress}>
            <div style={{ ...styles.bar, width: '100%' }} />
          </div>

          <h1 style={styles.title}>Crea tu contraseña</h1>
          <p style={styles.subtitle}>Para entrar en tu próxima visita</p>

          <input
            style={styles.input}
            placeholder="Crea una contraseña"
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

          <button style={{ ...styles.button, border: 'none' }} onClick={handleFinish}>
            {saving ? 'Guardando...' : '¡Todo listo! ✓'}
          </button>

          <div style={styles.back} onClick={() => { setError(''); setStep(5) }}>Atrás</div>
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

  header: {
    display: 'flex',
    justifyContent: 'space-between',
  },

  content: {},

  title: {
    fontSize: 32,
    fontWeight: 700,
    marginBottom: 10,
    color: '#1A2744',
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

  optionLabel: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1A2744',
    margin: '0 0 4px 0',
  },

  optionSub: {
    fontSize: 14,
    color: '#6B7280',
    margin: '0 0 12px 0',
  },

  verifyBtn: {
    border: '2px solid #F97316',
    textAlign: 'center',
    padding: 16,
    borderRadius: 16,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 16,
    marginBottom: 8,
    transition: 'all 0.2s ease',
  },

  successMsg: {
    background: '#F0FDF4',
    border: '1px solid #86EFAC',
    color: '#16A34A',
    padding: '14px 16px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 8,
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
