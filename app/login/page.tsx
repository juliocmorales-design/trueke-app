'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/app/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    if (raw.startsWith('+')) return raw
    return `+52${digits}`
  }

  const sendOtp = async () => {
    if (!phone.trim()) return
    setLoading(true)
    setError('')

    const formattedPhone = formatPhone(phone.trim())

    const { error: err } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    })

    setLoading(false)

    if (err) {
      setError(err.message)
    } else {
      setPhone(formattedPhone)
      setStep('otp')
    }
  }

  const signInWithEmail = async () => {
    if (!email.trim() || !password) return
    setEmailLoading(true)
    setEmailError('')

    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setEmailLoading(false)

    if (err) {
      setEmailError(err.message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos'
        : err.message)
    } else {
      localStorage.setItem('onboarding_seen', 'true')
      router.push('/')
    }
  }

  const verifyOtp = async () => {
    if (!otp.trim()) return
    setLoading(true)
    setError('')

    const { data, error: err } = await supabase.auth.verifyOtp({
      phone,
      token: otp.trim(),
      type: 'sms',
    })

    setLoading(false)

    if (err) {
      setError(err.message)
      return
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', data.user.id)
        .single()

      if (profile?.username) {
        router.push('/')
      } else {
        router.push('/onboarding')
      }
    }
  }

  return (
    <div style={styles.container}>
      {step === 'phone' && (
        <>
          <div style={styles.backLink} onClick={() => router.push('/onboarding')}>
            ← Volver
          </div>

          <h1 style={styles.title}>Iniciar sesión</h1>
          <p style={styles.subtitle}>Ingresa tu número de teléfono</p>

          <input
            style={styles.input}
            placeholder="+52 55 1234 5678"
            value={phone}
            onChange={e => { setPhone(e.target.value); setError('') }}
            type="tel"
          />

          {error && <p style={styles.errorText}>{error}</p>}

          <button style={styles.button} onClick={sendOtp} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar código'}
          </button>

          <div style={styles.separator}>
            <span style={styles.separatorLine} />
            <span style={styles.separatorText}>o ingresa con email</span>
            <span style={styles.separatorLine} />
          </div>

          <input
            style={styles.input}
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setEmailError('') }}
            type="email"
            autoComplete="email"
          />
          <input
            style={styles.input}
            placeholder="Contraseña"
            value={password}
            onChange={e => { setPassword(e.target.value); setEmailError('') }}
            type="password"
            autoComplete="current-password"
          />

          {emailError && <p style={styles.errorText}>{emailError}</p>}

          <button style={styles.button} onClick={signInWithEmail} disabled={emailLoading}>
            {emailLoading ? 'Entrando...' : 'Entrar con email'}
          </button>

          {resetSent ? (
            <p style={{ color: '#16A34A', fontSize: 14, textAlign: 'center', margin: '0 0 12px' }}>
              Te enviamos un enlace para restablecer tu contraseña
            </p>
          ) : (
            <p
              style={{ color: '#F97316', fontSize: 14, textAlign: 'center', cursor: 'pointer', margin: '0 0 12px' }}
              onClick={async () => {
                if (!email.trim() || resetLoading) return
                setResetLoading(true)
                await supabase.auth.resetPasswordForEmail(email.trim())
                setResetLoading(false)
                setResetSent(true)
              }}
            >
              {resetLoading ? 'Enviando...' : '¿Olvidaste tu contraseña?'}
            </p>
          )}

          <p style={styles.register}>
            ¿No tienes cuenta?{' '}
            <span
              style={{ color: '#F97316', fontWeight: 600, cursor: 'pointer' }}
              onClick={() => router.push('/onboarding')}
            >
              Regístrate
            </span>
          </p>
        </>
      )}

      {step === 'otp' && (
        <>
          <div style={styles.backLink} onClick={() => { setStep('phone'); setOtp(''); setError('') }}>
            ← Cambiar número
          </div>

          <h1 style={styles.title}>Código de verificación</h1>
          <p style={styles.subtitle}>Enviamos un código a {phone}</p>

          <input
            style={{ ...styles.input, letterSpacing: 8, fontSize: 22, textAlign: 'center' }}
            placeholder="000000"
            value={otp}
            onChange={e => { setOtp(e.target.value); setError('') }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
          />

          {error && <p style={styles.errorText}>{error}</p>}

          <button style={styles.button} onClick={verifyOtp} disabled={loading}>
            {loading ? 'Verificando...' : 'Verificar'}
          </button>

          <p style={styles.resend} onClick={() => { setStep('phone'); setOtp(''); setError('') }}>
            Reenviar código
          </p>
        </>
      )}
    </div>
  )
}

const styles: any = {
  container: {
    padding: 24,
    minHeight: '100vh',
    background: '#FDF8F3',
    display: 'flex',
    flexDirection: 'column',
  },

  backLink: {
    color: '#6B7680',
    fontSize: 14,
    cursor: 'pointer',
    marginBottom: 32,
    marginTop: 16,
    padding: '12px 0',
  },

  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#1A2744',
    marginBottom: 8,
  },

  subtitle: {
    color: '#6B7680',
    marginBottom: 24,
    fontSize: 15,
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

  button: {
    width: '100%',
    padding: 16,
    background: '#F97316',
    color: '#fff',
    border: 'none',
    borderRadius: 16,
    fontWeight: 600,
    fontSize: 16,
    cursor: 'pointer',
    marginBottom: 16,
  },

  register: {
    textAlign: 'center',
    color: '#6B7680',
    fontSize: 14,
  },

  separator: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    marginTop: 4,
  },

  separatorLine: {
    flex: 1,
    height: 1,
    background: '#ddd',
  },

  separatorText: {
    color: '#9CA3AF',
    fontSize: 13,
    whiteSpace: 'nowrap',
  },

  resend: {
    textAlign: 'center',
    color: '#6B7680',
    fontSize: 14,
    cursor: 'pointer',
    padding: 8,
  },

  errorText: {
    color: '#e53e3e',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
}
