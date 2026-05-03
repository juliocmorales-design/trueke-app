'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/app/lib/supabase'

export default function PerfilSetup() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const uploadAvatar = async (userId: string) => {
    if (!file) return null

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}.${fileExt}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        upsert: true,
      })

    if (error) {
      console.error(error)
      return null
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  const handleSave = async () => {
    if (!name || !username) {
      alert('Completa todos los campos')
      return
    }

    setLoading(true)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const user = session?.user
    if (!user) return

    // 🔥 subir imagen
    const avatar_url = await uploadAvatar(user.id)

    const { error } = await supabase
      .from('profiles')
      .update({
        name,
        username,
        avatar_url,
      })
      .eq('id', user.id)

    setLoading(false)

    if (error) {
      alert('Error guardando perfil')
      return
    }

    router.replace('/')
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Completa tu perfil</h1>

      {/* AVATAR */}
      <label style={styles.avatarBox}>
        {file ? (
          <img
            src={URL.createObjectURL(file)}
            style={styles.avatar}
          />
        ) : (
          <div style={styles.placeholder}>+</div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setFile(e.target.files?.[0] || null)
          }
          style={{ display: 'none' }}
        />
      </label>

      <input
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={styles.input}
      />

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={styles.input}
      />

      <button onClick={handleSave} style={styles.button}>
        {loading ? 'Guardando...' : 'Continuar'}
      </button>
    </div>
  )
}

const styles: any = {
  container: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: 700,
  },

  avatarBox: {
    width: 100,
    height: 100,
    borderRadius: '50%',
    overflow: 'hidden',
    background: '#EFE7E0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },

  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  placeholder: {
    fontSize: 28,
    color: '#999',
  },

  input: {
    padding: 12,
    borderRadius: 10,
    border: '1px solid #ddd',
    fontSize: 14,
  },

  button: {
    background: '#F97316',
    color: '#fff',
    padding: 14,
    borderRadius: 16,
    border: 'none',
    fontWeight: 600,
    fontSize: 16,
  },
}