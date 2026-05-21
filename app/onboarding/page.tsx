'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '../lib/supabase'
import css from './onboarding.module.css'

const AVATARS = [
  { file: 'avatar_01_zorro.png',     label: 'Zorro' },
  { file: 'avatar_02_buho.png',      label: 'Búho' },
  { file: 'avatar_03_mapache.png',   label: 'Mapache' },
  { file: 'avatar_04_jaguar.png',    label: 'Jaguar' },
  { file: 'avatar_05_armadillo.png', label: 'Armadillo' },
  { file: 'avatar_06_colibri.png',   label: 'Colibrí' },
  { file: 'avatar_07_puma.png',      label: 'Puma' },
  { file: 'avatar_08_aguila.png',    label: 'Águila' },
  { file: 'avatar_09_lobo.png',      label: 'Lobo' },
  { file: 'avatar_10_venado.png',    label: 'Venado' },
  { file: 'avatar_11_serpiente.png', label: 'Serpiente' },
  { file: 'avatar_12_tortuga.png',   label: 'Tortuga' },
  { file: 'avatar_13_nutria.png',    label: 'Nutria' },
  { file: 'avatar_14_castor.png',    label: 'Castor' },
  { file: 'avatar_15_conejo.png',    label: 'Conejo' },
]

function ChainLink() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

export default function Onboarding() {
  const router = useRouter()

  const [step,    setStep]    = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [emailSent, setEmailSent] = useState(false)

  const [existingUserId, setExistingUserId] = useState<string | null>(null)

  // Step 1
  const [email, setEmail] = useState('')

  // Step 2
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword,        setShowPassword]        = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Step 3
  const [username,       setUsername]       = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [avatarFile,     setAvatarFile]     = useState<File | null>(null)
  const [avatarPreview,  setAvatarPreview]  = useState('')

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

      setStep(0)
      setLoading(false)
    }

    init()
  }, [])

  const checkUsernameAvailable = async (value: string) => {
    if (value.length < 3) return
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return
    const res = await fetch('/api/auth/check-username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: value }),
    })
    const data = await res.json()
    if (data.taken) setError('Ese username ya está tomado. Elige otro.')
    else setError('')
  }

  const handleEmailNext = async () => {
    setError('')
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
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
      setError('Este correo ya tiene una cuenta. Usa "Iniciar sesión".')
      return
    }
    setStep(2)
  }

  const handlePasswordNext = () => {
    setError('')
    if (!password || !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
      setError('La contraseña debe tener al menos 8 caracteres, una letra y un número')
      return
    }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return }
    setStep(3)
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
        if (signUpErr.message.includes('already registered') ||
            signUpErr.message.includes('already been registered') ||
            signUpErr.status === 422) {
          setError('Este correo ya tiene una cuenta. Usa "Iniciar sesión".')
        } else {
          setError(signUpErr.message)
        }
        setSaving(false)
        return
      }
      if (data.user && data.user.identities?.length === 0) {
        setError('Este correo ya tiene una cuenta. Usa "Iniciar sesión".')
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

    let avatarUrl: string | null = null

    if (avatarFile && uid) {
      const ext = avatarFile.name.split('.').pop() ?? 'jpg'
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`${uid}.${ext}`, avatarFile, { upsert: true })
      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(uploadData.path)
        avatarUrl = urlData.publicUrl
      }
    } else if (selectedAvatar) {
      avatarUrl = `/images/avatars/${selectedAvatar}`
    }

    const res = await fetch('/api/profiles/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: uid,
        username,
        name: username,
        city: '',
        interests: [],
        avatar_url: avatarUrl,
      }),
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

  /* ── Email confirmación enviada ── */
  if (emailSent) {
    return (
      <div style={{
        minHeight: '100svh', background: '#FAF3ED',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', textAlign: 'center', gap: 16,
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
          background: '#FFF5F0', border: '1.5px solid #F97316',
          borderRadius: 12, padding: '12px 16px', width: '100%', maxWidth: 360,
        }}>
          <p style={{ fontSize: 13, color: '#F97316', margin: 0, fontWeight: 600 }}>
            Revisa también tu carpeta de Spam o Promociones si no ves el correo.
          </p>
        </div>

        <button
          onClick={() => router.push('/login')}
          style={{
            background: '#F97316', color: '#fff', border: 'none', borderRadius: 16,
            padding: '16px', width: '100%', maxWidth: 360,
            fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8,
          }}
        >
          Ir a iniciar sesión
        </button>
      </div>
    )
  }

  /* ── STEP 0: Landing ── */
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

        <button className={css.ctaButton} onClick={() => setStep(existingUserId ? 3 : 1)}>
          Comenzar →
        </button>

        <div className={css.loginRow}>
          <span>¿Ya tienes cuenta?</span>
          <button onClick={() => router.push('/login')}>Iniciar sesión</button>
        </div>

      </div>
    )
  }

  /* ── Steps 1-3 ── */
  return (
    <div style={styles.container}>

      {/* ── STEP 1: Email ── */}
      {step === 1 && (
        <div style={styles.stepContainer}>
          <div style={styles.progress}>
            <div style={{ ...styles.bar, width: `${(step / 3) * 100}%` }} />
          </div>

          <h1 style={styles.title}>¿Cuál es tu email?</h1>
          <p style={styles.subtitle}>Para crear tu cuenta en Trueke</p>

          <form onSubmit={e => { e.preventDefault(); handleEmailNext() }}>
          <input
            style={styles.input}
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            type="email"
            autoComplete="email"
            autoFocus
          />

          {error && <p style={styles.errorText}>{error}</p>}

          <button
            type="submit"
            style={{ ...styles.button, border: 'none', opacity: saving ? 0.6 : 1 }}
            disabled={saving}
          >
            {saving ? 'Verificando...' : 'Siguiente →'}
          </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <button
              onClick={() => router.push('/login')}
              style={{
                background: 'none', border: 'none', color: '#F97316',
                fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', padding: 0,
              }}
            >
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          </div>

          <div style={styles.back} onClick={() => { setError(''); setStep(0) }}>Atrás</div>
        </div>
      )}

      {/* ── STEP 2: Contraseña ── */}
      {step === 2 && (
        <div style={styles.stepContainer}>
          <div style={styles.progress}>
            <div style={{ ...styles.bar, width: `${(step / 3) * 100}%` }} />
          </div>

          <h1 style={styles.title}>Elige tu contraseña</h1>
          <p style={styles.subtitle}>Al menos 8 caracteres, una letra y un número</p>

          <form onSubmit={e => { e.preventDefault(); handlePasswordNext() }}>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              style={{ ...styles.input, paddingRight: 44 }}
              placeholder="Contraseña"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
              {showConfirmPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          {error && <p style={styles.errorText}>{error}</p>}

          <button
            type="submit"
            style={{ ...styles.button, border: 'none' }}
          >
            Siguiente →
          </button>
          </form>

          <div style={styles.back} onClick={() => { setError(''); setStep(1) }}>Atrás</div>
        </div>
      )}

      {/* ── STEP 3: Username + Avatar ── */}
      {step === 3 && (
        <div style={styles.stepContainer}>
          <div style={styles.progress}>
            <div style={{ ...styles.bar, width: '100%' }} />
          </div>

          <h1 style={styles.title}>Elige tu @usuario</h1>
          <p style={styles.subtitle}>Así te verán en Trueke</p>

          <input
            style={styles.input}
            placeholder="Ej: mariag"
            value={username}
            onChange={e => { setUsername(e.target.value.replace('@', '').trim()); setError('') }}
            onBlur={e => checkUsernameAvailable(e.target.value)}
            autoComplete="username"
          />

          {username.trim() && (
            <p style={{ color: '#F97316', fontWeight: 600, fontSize: 15, marginTop: -8, marginBottom: 16 }}>
              @{username}
            </p>
          )}

          {/* Grid de avatares */}
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1A2744', marginBottom: 10 }}>
            Elige tu avatar
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 8,
            marginBottom: 16,
          }}>
            {AVATARS.map(av => (
              <div
                key={av.file}
                onClick={() => { setSelectedAvatar(av.file); setAvatarFile(null); setAvatarPreview('') }}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: selectedAvatar === av.file && !avatarPreview
                    ? '3px solid #F97316'
                    : '3px solid transparent',
                  boxSizing: 'border-box',
                  background: '#F0EAE0',
                  transition: 'border 0.15s',
                }}>
                  <img
                    src={`/images/avatars/${av.file}`}
                    alt={av.label}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                <span style={{ fontSize: 9, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.2 }}>
                  {av.label}
                </span>
              </div>
            ))}
          </div>

          {/* Subir foto propia */}
          {avatarPreview ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '10px 0' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', overflow: 'hidden',
                border: '3px solid #F97316', boxSizing: 'border-box', flexShrink: 0,
              }}>
                <img src={avatarPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Mi foto" />
              </div>
              <span style={{ fontSize: 14, color: '#1A2744', fontWeight: 600, flex: 1 }}>Mi foto seleccionada</span>
              <button
                onClick={() => { setAvatarFile(null); setAvatarPreview('') }}
                style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}
              >
                Quitar
              </button>
            </div>
          ) : (
            <label style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#F0EAE0', borderRadius: 12, padding: '12px 16px',
              cursor: 'pointer', marginBottom: 16,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span style={{ fontSize: 14, color: '#6B7280', fontWeight: 500 }}>Subir mi propia foto</span>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (file.size > 5 * 1024 * 1024) { setError('La foto debe pesar menos de 5MB.'); return }
                  setAvatarFile(file)
                  setAvatarPreview(URL.createObjectURL(file))
                  setSelectedAvatar('')
                  setError('')
                }}
              />
            </label>
          )}

          {error && <p style={styles.errorText}>{error}</p>}

          <button
            style={{ ...styles.button, border: 'none', opacity: saving ? 0.6 : 1 }}
            disabled={saving}
            onClick={() => {
              setError('')
              if (!username.trim() || username.trim().length < 3 || !/^[a-zA-Z0-9_]+$/.test(username.trim())) {
                setError('El username solo puede tener letras, números y guión bajo (_), mínimo 3 caracteres')
                return
              }
              handleFinish()
            }}
          >
            {saving ? 'Creando cuenta...' : '¡Todo listo!'}
          </button>

          <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
            Al continuar aceptas nuestros{' '}
            <span
              style={{ color: '#F97316', cursor: 'pointer' }}
              onClick={() => window.open('/terminos', '_blank')}
            >
              Términos de Uso y Política de Privacidad
            </span>
          </p>

          <div style={styles.back} onClick={() => { setError(''); setStep(existingUserId ? 0 : 2) }}>Atrás</div>
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
    fontFamily: 'inherit',
    outline: 'none',
  },

  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    color: '#9CA3AF',
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
    fontFamily: 'inherit',
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

  errorText: {
    color: '#e53e3e',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
}
