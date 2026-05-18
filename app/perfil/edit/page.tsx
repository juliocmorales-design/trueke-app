'use client'

import { useEffect, useRef, useState } from 'react'
import supabase from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

export default function EditProfile() {
  const router = useRouter()

  const [profile,        setProfile]        = useState<any>(null)
  const [name,           setName]           = useState('')
  const [username,       setUsername]       = useState('')
  const [city,           setCity]           = useState('')
  const [bio,            setBio]            = useState('')
  const [avatarFile,     setAvatarFile]     = useState<File | null>(null)
  const [originalValues, setOriginalValues] = useState({ name: '', username: '', city: '', bio: '' })
  const [preview,    setPreview]    = useState<string | null>(null)
  const [saving,     setSaving]     = useState(false)
  const [saveError,  setSaveError]  = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user
      if (!user) return router.push('/login')

      const { data } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()

      setProfile(data)
      setName(data?.name || '')
      setUsername(data?.username || '')
      setCity(data?.city || '')
      setBio(data?.bio || '')
      setOriginalValues({
        name:     data?.name     || '',
        username: data?.username || '',
        city:     data?.city     || '',
        bio:      data?.bio      || '',
      })
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
      .upload(fileName, avatarFile, { upsert: true })

    if (error) { console.error(error); return null }

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleSave = async () => {
    if (!name.trim() || name.trim().length < 2) {
      setSaveError('El nombre debe tener al menos 2 caracteres.')
      return
    }
    if (!username.trim() || username.trim().length < 3) {
      setSaveError('El usuario debe tener al menos 3 caracteres.')
      return
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setSaveError('El usuario solo puede tener letras, números y guión bajo (_).')
      return
    }

    setSaving(true)
    setSaveError(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user
      if (!user) return

      const uploadedUrl = await uploadAvatar(user.id)
      const finalAvatarUrl = uploadedUrl ?? profile?.avatar_url ?? null

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ name, username, city, avatar_url: finalAvatarUrl, bio: bio.trim() || null })
        .eq('id', user.id)

      if (updateError?.code === '23505') {
        setSaveError('Ese nombre de usuario ya está tomado. Elige otro.')
        return
      }
      if (updateError) {
        console.error('Update error:', updateError)
        setSaveError('Error al guardar: ' + updateError.message)
        return
      }
      router.push('/perfil')
    } catch {
      setSaveError('Error al guardar, intenta de nuevo')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges =
    name     !== originalValues.name     ||
    username !== originalValues.username ||
    city     !== originalValues.city     ||
    bio      !== originalValues.bio      ||
    !!avatarFile

  return (
    <div style={s.container}>

      {/* HEADER */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => router.back()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span style={s.headerTitle}>Editar perfil</span>
        <div style={{ width: 40 }} />
      </div>

      {/* AVATAR */}
      <div style={s.avatarSection}>
        <div style={s.avatarWrap}>
          <img
            src={preview || '/images/avatar.svg'}
            style={s.avatar}
            alt="avatar"
          />
        </div>
        <button style={s.changePhotoBtn} onClick={() => fileInputRef.current?.click()}>
          Cambiar foto
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          style={{ display: 'none' }}
        />
      </div>

      {/* FORMULARIO */}
      <div style={s.card}>

        <div style={s.field}>
          <div style={s.label}>Nombre</div>
          <input
            style={s.input}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tu nombre"
          />
        </div>

        <div style={s.field}>
          <div style={s.label}>Username</div>
          <input
            style={s.input}
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="tunombre"
            autoCapitalize="none"
          />
        </div>

        <div style={s.field}>
          <div style={s.label}>Ciudad</div>
          <input
            style={s.input}
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="Ej: Monterrey, CDMX..."
          />
        </div>

        <div style={{ ...s.field, marginBottom: 0 }}>
          <div style={s.label}>Sobre ti</div>
          <textarea
            style={{ ...s.input, minHeight: 80, resize: 'none', fontFamily: 'inherit' }}
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Cuéntales a otros qué tipo de intercambios te interesan..."
            maxLength={200}
          />
          <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'right', margin: '4px 0 0' }}>
            {bio.length}/200
          </p>
        </div>

      </div>

      {saveError && (
        <div style={s.errorBox}>{saveError}</div>
      )}

      <button
        style={{ ...s.saveBtn, opacity: saving || !hasChanges ? 0.6 : 1 }}
        onClick={handleSave}
        disabled={saving || !hasChanges}
      >
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>

    </div>
  )
}

const s: any = {
  container: {
    background: '#FDF8F3',
    minHeight: '100vh',
    paddingBottom: 48,
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 16px 12px',
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#F0EAE0',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1A2744',
  },

  avatarSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: '24px 16px 8px',
  },

  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: '50%',
    overflow: 'hidden',
    background: '#EDE7DF',
    flexShrink: 0,
  },

  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },

  changePhotoBtn: {
    background: '#F97316',
    color: '#fff',
    border: 'none',
    borderRadius: 20,
    padding: '8px 20px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  card: {
    background: '#FFFFFF',
    borderRadius: 20,
    padding: '8px 16px 16px',
    margin: '16px 16px 0',
    boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
  },

  field: {
    paddingTop: 14,
    marginBottom: 14,
  },

  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1A2744',
    marginBottom: 6,
  },

  input: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    border: 'none',
    background: '#F0EAE0',
    fontSize: 15,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    outline: 'none',
  },

  errorBox: {
    background: '#FEE2E2',
    color: '#991B1B',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    margin: '12px 16px 0',
  },

  saveBtn: {
    display: 'block',
    width: 'calc(100% - 32px)',
    margin: '20px 16px 0',
    background: '#F97316',
    color: '#fff',
    border: 'none',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
}
