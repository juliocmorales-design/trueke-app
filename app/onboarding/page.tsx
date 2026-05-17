'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '../lib/supabase'
import css from './onboarding.module.css'

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
  const [emailSent, setEmailSent] = useState(false)

  const [existingUserId, setExistingUserId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [city, setCity] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [showOtroInput, setShowOtroInput] = useState(false)
  const [otroText, setOtroText] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
        setName(profile.name || '')
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
        console.error('SignUp error:', signUpErr)
        if (signUpErr.message.includes('already registered') ||
            signUpErr.message.includes('already been registered') ||
            signUpErr.status === 422) {
          setError('Este correo ya tiene una cuenta. Usa "Iniciar sesión" en lugar de registrarte.')
        } else {
          setError(signUpErr.message)
        }
        setSaving(false)
        return
      }
      if (data.user && data.user.identities?.length === 0) {
        setError('Este correo ya tiene una cuenta. Usa "Iniciar sesión" en lugar de registrarte.')
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

    const res = await fetch('/api/profiles/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: uid, username, name, city, interests }),
    })

    const result = await res.json()
    setSaving(false)

    if (!res.ok) {
      if (result.error === 'USERNAME_TAKEN') {
        setError('Ese nombre de usuario ya está tomado. Elige otro.')
      } else {
        setError(result.error || 'Ocurrió un error. Intenta de nuevo.')
      }
      return
    }

    setEmailSent(true)
  }

  if (loading) {
    return <div style={{ padding: 20, color: '#6B7680' }}>Cargando...</div>
  }

  const ChainLink = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )

  if (emailSent) {
    return (
      <div style={{
        minHeight: '100svh',
        background: '#FAF3ED',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        textAlign: 'center',
        gap: 16,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <img src="/images/logo.png" style={{ width: 140, marginBottom: 8 }} />

        <svg width="64" height="64" viewBox="0 0 24 24" fill="none"
          stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>

        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1A2744', margin: 0 }}>
          ¡Casi listo!
        </h2>

        <p style={{ fontSize: 16, color: '#1A2744', margin: 0, lineHeight: 1.5 }}>
          Te enviamos un correo a<br/>
          <strong>{email}</strong>
        </p>

        <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
          Confirma tu cuenta haciendo clic en el enlace del correo.
        </p>

        <div style={{
          background: '#FFF5F0',
          border: '1.5px solid #F97316',
          borderRadius: 12,
          padding: '12px 16px',
          width: '100%',
          maxWidth: 360,
        }}>
          <p style={{ fontSize: 13, color: '#F97316', margin: 0, fontWeight: 600 }}>
            ⚠️ Revisa también tu carpeta de Spam o Promociones si no ves el correo en tu bandeja principal.
          </p>
        </div>

        <button
          onClick={() => router.push('/login')}
          style={{
            background: '#F97316',
            color: '#fff',
            border: 'none',
            borderRadius: 16,
            padding: '16px',
            width: '100%',
            maxWidth: 360,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            marginTop: 8,
          }}
        >
          Ir a iniciar sesión
        </button>
      </div>
    )
  }

  if (step === 0) {
    return (
      <div className={css.onboarding}>

        <img src="/images/logo.png" className={css.logo} alt="Trueke" />

        <h1 className={css.headline}>
          Empieza con algo pequeño,<br />termina con algo <span>increíble.</span>
        </h1>

        <div className={css.progressionWrapper}>

          <div className={css.cardSlot}>
            <div className={css.progressCard}>
              <img className={css.cardImage} src="/images/onboarding/01_libros.png" alt="Libros" />
              <div className={css.cardFooter}>
                <div className={css.cardLabel}>Tengo<br/><span>libros</span></div>
              </div>
            </div>
            <div className={css.chainOverlay}><ChainLink /></div>
          </div>

          <div className={css.cardSlot}>
            <div className={css.progressCard}>
              <img className={css.cardImage} src="/images/onboarding/02_sierra.png" alt="Sierra" />
              <div className={css.cardFooter}>
                <div className={css.cardLabel}>Me dan<br/><span>sierra</span></div>
              </div>
            </div>
            <div className={css.chainOverlay}><ChainLink /></div>
          </div>

          <div className={css.cardSlot}>
            <div className={css.progressCard}>
              <img className={css.cardImage} src="/images/onboarding/03_mochila.png" alt="Mochila" />
              <div className={css.cardFooter}>
                <div className={css.cardLabel}>Cambio<br/><span>mochila</span></div>
              </div>
            </div>
            <div className={css.chainOverlay}><ChainLink /></div>
          </div>

          <div className={css.cardSlot}>
            <div className={css.progressCard}>
              <img className={css.cardImage} src="/images/onboarding/04_bici.png" alt="Bicicleta" />
              <div className={css.cardFooter}>
                <div className={css.cardLabel}>Obtengo<br/><span>bici</span></div>
              </div>
            </div>
          </div>

        </div>

        <p className={css.subheadline}>
          Sin dinero. Solo <span>intercambios.</span>
        </p>

        <button className={css.ctaButton} onClick={() => setStep(1)}>
          Comenzar →
        </button>

        <div className={css.loginRow}>
          <span>¿Ya tienes cuenta?</span>
          <button onClick={() => router.push('/login')}>Iniciar sesión</button>
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
            <div style={{ ...styles.bar, width: `${(step / 6) * 100}%` }} />
          </div>

          <h1 style={styles.title}>¿Cuál es tu nombre?</h1>
          <p style={styles.subtitle}>Así te verán los demás en Trueke</p>

          <input
            style={styles.input}
            placeholder="Ej: María García"
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            autoComplete="name"
          />

          {error && <p style={styles.errorText}>{error}</p>}

          <button style={{ ...styles.button, border: 'none' }} onClick={() => {
            setError('')
            if (!name.trim() || name.trim().length < 2 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(name.trim())) {
              setError('Por favor ingresa un nombre válido (solo letras, mínimo 2 caracteres)')
              return
            }
            setStep(2)
          }}>
            Siguiente →
          </button>

          <div style={styles.back} onClick={() => setStep(0)}>Atrás</div>
        </div>
      )}

      {/* ── STEP 2: Username ── */}
      {step === 2 && (
        <div style={styles.stepContainer}>
          <div style={styles.progress}>
            <div style={{ ...styles.bar, width: `${(step / 6) * 100}%` }} />
          </div>

          <h1 style={styles.title}>¿Cuál será tu @usuario?</h1>
          <p style={styles.subtitle}>Este será tu identificador público en Trueke</p>

          <input
            style={styles.input}
            placeholder="Ej: mariag"
            value={username}
            onChange={e => { setUsername(e.target.value.replace('@', '').trim()); setError('') }}
            autoComplete="username"
          />

          {username.trim() && (
            <p style={{ color: '#F97316', fontWeight: 600, fontSize: 15, marginTop: -8, marginBottom: 16 }}>
              @{username}
            </p>
          )}

          {error && <p style={styles.errorText}>{error}</p>}

          <button style={{ ...styles.button, border: 'none' }} onClick={() => {
            setError('')
            if (!username.trim() || username.trim().length < 3 || !/^[a-zA-Z0-9_]+$/.test(username.trim())) {
              setError('El username solo puede tener letras, números y guión bajo (_), mínimo 3 caracteres')
              return
            }
            setStep(existingUserId ? 5 : 3)
          }}>
            Siguiente →
          </button>

          <div style={styles.back} onClick={() => { setError(''); setStep(1) }}>Atrás</div>
        </div>
      )}

      {/* ── STEP 3: Email ── */}
      {step === 3 && (
        <div style={styles.stepContainer}>
          <div style={styles.progress}>
            <div style={{ ...styles.bar, width: `${(step / 6) * 100}%` }} />
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

          <button style={{ ...styles.button, border: 'none' }} onClick={async () => {
            setError('')
            if (!email.trim() || email.includes(' ') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
              setError('Por favor ingresa un correo electrónico válido')
              return
            }
            setSaving(true)
            const res = await fetch('/api/auth/check-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            })
            const result = await res.json()
            setSaving(false)
            if (result.exists) {
              setError('Este correo ya tiene una cuenta. Usa "Iniciar sesión" en lugar de registrarte.')
              return
            }
            setStep(4)
          }} disabled={saving}>
            {saving ? 'Verificando...' : 'Siguiente →'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <button
              onClick={() => router.push('/login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#F97316',
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: 'inherit',
                padding: 0,
              }}
            >
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          </div>

          <div style={styles.back} onClick={() => { setError(''); setStep(2) }}>Atrás</div>
        </div>
      )}

      {/* ── STEP 4: Contraseña ── */}
      {step === 4 && (
        <div style={styles.stepContainer}>
          <div style={styles.progress}>
            <div style={{ ...styles.bar, width: `${(step / 6) * 100}%` }} />
          </div>

          <h1 style={styles.title}>Elige tu contraseña</h1>
          <p style={styles.subtitle}>Al menos 8 caracteres, una letra y un número</p>

          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              style={{ ...styles.input, paddingRight: 44 }}
              placeholder="Contraseña"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                color: '#9CA3AF',
              }}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              style={{ ...styles.input, paddingRight: 44 }}
              placeholder="Confirma tu contraseña"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setError('') }}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                color: '#9CA3AF',
              }}
            >
              {showConfirmPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          {error && <p style={styles.errorText}>{error}</p>}

          <button style={{ ...styles.button, border: 'none' }} onClick={() => {
            setError('')
            if (!password || !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
              setError('La contraseña debe tener al menos 8 caracteres, una letra y un número')
              return
            }
            if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return }
            setStep(5)
          }}>
            Siguiente →
          </button>

          <div style={styles.back} onClick={() => { setError(''); setStep(3) }}>Atrás</div>
        </div>
      )}

      {/* ── STEP 5: Ciudad ── */}
      {step === 5 && (
        <div style={styles.stepContainer}>
          <div style={styles.progress}>
            <div style={{ ...styles.bar, width: `${(step / 6) * 100}%` }} />
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

          {error && <p style={styles.errorText}>{error}</p>}

          <button style={{ ...styles.button, border: 'none' }} onClick={() => {
            setError('')
            if (!city.trim() || city.trim().length < 2) {
              setError('Por favor ingresa tu ciudad')
              return
            }
            setStep(6)
          }}>
            Siguiente →
          </button>

          <div style={styles.back} onClick={() => { setError(''); setStep(existingUserId ? 2 : 4) }}>Atrás</div>
        </div>
      )}

      {/* ── STEP 6: Intereses ── */}
      {step === 6 && (
        <div style={styles.stepContainer}>
          <div style={styles.progress}>
            <div style={{ ...styles.bar, width: `${(step / 6) * 100}%` }} />
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

          <button style={{ ...styles.button, border: 'none' }} onClick={() => {
            setError('')
            if (interests.length === 0) {
              setError('Selecciona al menos un interés')
              return
            }
            handleFinish()
          }} disabled={saving}>
            {saving ? 'Creando cuenta...' : '¡Todo listo!'}
          </button>

          {error && (
            <p style={styles.errorText}>{error}</p>
          )}

          <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
            Al continuar aceptas nuestros{' '}
            <span
              style={{ color: '#F97316', cursor: 'pointer' }}
              onClick={() => window.open('/terminos', '_blank')}
            >
              Términos de Uso y Política de Privacidad
            </span>
          </p>

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
