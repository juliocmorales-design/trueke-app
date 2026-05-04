'use client'

import { useEffect, useState } from 'react'
import supabase from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

export default function EditProfile() {
  const router = useRouter()

  const [profile, setProfile] = useState<any>(null)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (!user) return router.push('/login')

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(data)
      setName(data?.name || '')
      setUsername(data?.username || '')
      setPreview(data?.avatar_url || null)
    } catch {
      router.replace('/')
    }
  }

  const handleFile = (e: any) => {
    const file = e.target.files[0]
    if (!file) return

    setAvatarFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const uploadAvatar = async (userId: string) => {
    if (!avatarFile) return profile?.avatar_url

    const fileExt = avatarFile.name.split('.').pop()
    const fileName = `${userId}.${fileExt}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, avatarFile, {
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
    setSaving(true)
    setSaveError(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (!user) return

      const avatar_url = await uploadAvatar(user.id)

      const { error } = await supabase
        .from('profiles')
        .update({ name, username, avatar_url })
        .eq('id', user.id)

      if (error) throw error

      router.push('/perfil')
    } catch {
      setSaveError('Error al guardar, intenta de nuevo')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={styles.container}>
      <h2>Editar perfil</h2>

      {/* AVATAR */}
      <div style={styles.avatarBox}>
        <img
          src={
            preview ||
            'https://via.placeholder.com/100?text=User'
          }
          style={styles.avatar}
        />

        <input type="file" onChange={handleFile} />
      </div>

      {/* NAME */}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre"
        style={styles.input}
      />

      {/* USERNAME */}
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        style={styles.input}
      />

      {saveError && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 10 }}>
          {saveError}
        </div>
      )}

      <button onClick={handleSave} style={styles.button}>
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
    </div>
  )
}

const styles: any = {
  container: {
    padding: 20,
  },

  avatarBox: {
    marginBottom: 20,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: '50%',
    objectFit: 'cover',
    marginBottom: 10,
  },

  input: {
    display: 'block',
    width: '100%',
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
    border: '1px solid #ddd',
  },

  button: {
    background: '#F97316',
    color: '#fff',
    padding: 12,
    borderRadius: 16,
    border: 'none',
    width: '100%',
  },
}