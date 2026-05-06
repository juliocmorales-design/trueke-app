'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/app/lib/supabase'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const [resetSent, setResetSent]       = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const [showMagicLink, setShowMagicLink] = useState(false)
  const [magicSending, setMagicSending]   = useState(false)
  const [magicSent, setMagicSent]         = useState(false)
  const [magicError, setMagicError]       = useState('')

  const signIn = async () => {
    if (!email.trim() || !password) return
    setLoading(true)
    setError('')

    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoading(false)

    if (err) {
      setError('Correo o contraseña incorrectos')
      return
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', data.user.id)
        .single()

      router.push(profile?.username ? '/' : '/onboarding')
    }
  }

  const sendMagicLink = async () => {
    if (!email.trim()) return
    setMagicSending(true)
    setMagicError('')

    const { error: err } = await supabase.auth.signInWithOtp({ email: email.trim() })

    setMagicSending(false)

    if (err) {
      setMagicError(err.message)
    } else {
      setMagicSent(true)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.backLink} onClick={() => router.push('/onboarding')}>
        ← Volver
      </div>

      <h1 style={styles.title}>Iniciar sesión</h1>

      <input
        style={styles.input}
        placeholder="correo@ejemplo.com"
        value={email}
        onChange={e => { setEmail(e.target.value); setError('') }}
        type="email"
        autoComplete="email"
      />
      <input
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChange={e => { setPassword(e.target.value); setError('') }}
        type="password"
        autoComplete="current-password"
      />

      {error && <p style={styles.errorText}>{error}</p>}

      <button style={styles.button} onClick={signIn} disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar con email'}
      </button>

      {resetSent ? (
        <p style={styles.resetConfirm}>
          Revisa tu correo — te enviamos el enlace
        </p>
      ) : (
        <p
          style={styles.textLink}
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

      <div style={styles.divider} />

      {magicSent ? (
        <div style={styles.successMsg}>
          Revisa tu correo — te enviamos un enlace para entrar sin contraseña
        </div>
      ) : showMagicLink ? (
        <>
          {magicError && <p style={styles.errorText}>{magicError}</p>}
          <p style={{ color: '#6B7680', fontSize: 14, textAlign: 'center', marginBottom: 12 }}>
            Se enviará un enlace a <strong>{email || 'tu correo'}</strong>
          </p>
          <button style={styles.button} onClick={sendMagicLink} disabled={magicSending}>
            {magicSending ? 'Enviando...' : 'Enviar enlace mágico'}
          </button>
          <p style={{ ...styles.textLink, color: '#9CA3AF' }} onClick={() => setShowMagicLink(false)}>
            Cancelar
          </p>
        </>
      ) : (
        <p
          style={styles.textLink}
          onClick={() => { setShowMagicLink(true); setMagicSent(false); setMagicError('') }}
        >
          Prefiero entrar sin contraseña
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
    marginBottom: 24,
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

  textLink: {
    color: '#F97316',
    fontSize: 14,
    textAlign: 'center',
    cursor: 'pointer',
    margin: '0 0 16px',
  },

  divider: {
    height: 1,
    background: '#E5DDD5',
    margin: '8px 0 20px',
  },

  successMsg: {
    background: '#F0FDF4',
    border: '1px solid #86EFAC',
    color: '#16A34A',
    padding: '14px 16px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 16,
  },

  resetConfirm: {
    color: '#16A34A',
    fontSize: 14,
    textAlign: 'center',
    margin: '0 0 16px',
  },

  register: {
    textAlign: 'center',
    color: '#6B7680',
    fontSize: 14,
    marginTop: 'auto',
    paddingTop: 24,
  },

  errorText: {
    color: '#e53e3e',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
}
