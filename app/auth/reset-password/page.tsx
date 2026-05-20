'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/app/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const handleRecovery = async () => {
      // Leer token_hash de la URL
      const params = new URLSearchParams(window.location.search)
      const tokenHash = params.get('token_hash')
      const type = params.get('type')

      if (tokenHash && type === 'recovery') {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        })
        if (!error) {
          setReady(true)
        } else {
          setError('El enlace expiró o es inválido. Solicita uno nuevo.')
        }
      } else {
        // Fallback: escuchar evento PASSWORD_RECOVERY
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event) => {
            if (event === 'PASSWORD_RECOVERY') {
              setReady(true)
            }
          }
        )
        return () => subscription.unsubscribe()
      }
    }

    handleRecovery()
  }, [])

  const handleReset = async () => {
    setError('')
    if (!password.trim()) {
      setError('Ingresa una contraseña.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
      setError('La contraseña debe tener al menos una letra y un número.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    router.replace('/')
  }

  return (
    <div style={{
      minHeight: '100svh',
      background: '#FAF3ED',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <img src="/images/logo.png" style={{ width: 140, marginBottom: 32 }} />

      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '28px 24px',
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1A2744', margin: '0 0 8px' }}>
          Nueva contraseña
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px' }}>
          Elige una contraseña segura para tu cuenta.
        </p>

        {!ready && (
          <p style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center' }}>
            Verificando enlace...
          </p>
        )}

        {ready && (
          <>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nueva contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  background: '#F0EAE0',
                  border: 'none',
                  borderRadius: 12,
                  padding: '14px 44px 14px 14px',
                  fontSize: 16,
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
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
                  color: '#9CA3AF',
                  padding: 4,
                }}
              >
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

            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              style={{
                width: '100%',
                background: '#F0EAE0',
                border: 'none',
                borderRadius: 12,
                padding: '14px',
                fontSize: 16,
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: 16,
              }}
            />

            {error && (
              <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 16 }}>
                {error}
              </p>
            )}

            <button
              onClick={handleReset}
              disabled={saving}
              style={{
                width: '100%',
                background: '#F97316',
                color: '#fff',
                border: 'none',
                borderRadius: 16,
                padding: 16,
                fontSize: 16,
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                fontFamily: 'inherit',
              }}
            >
              {saving ? 'Guardando...' : 'Guardar nueva contraseña'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
