'use client'

import { useState } from 'react'
import supabase from '@/app/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function login() {
    if (!email) return

    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin, // 🔥 CLAVE
      },
    })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Revisa tu correo 📩')
    }

    setLoading(false)
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Login</h1>

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Tu correo"
        style={{
          width: '100%',
          padding: 10,
          marginBottom: 10,
          border: '1px solid #ccc',
        }}
      />

      <button
        onClick={login}
        disabled={loading}
        style={{
          width: '100%',
          padding: 12,
          background: '#2563eb',
          color: '#fff',
          border: 'none',
        }}
      >
        {loading ? 'Enviando...' : 'Enviar link'}
      </button>
    </div>
  )
}