'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import supabase from '@/app/lib/supabase'

const CATEGORIAS = [
  { id: 'electronica', label: '📱 Electrónica' },
  { id: 'ropa',        label: '👕 Ropa' },
  { id: 'hogar',       label: '🏠 Hogar' },
  { id: 'deportes',    label: '⚽ Deportes' },
  { id: 'libros',      label: '📚 Libros' },
  { id: 'juguetes',    label: '🧸 Juguetes' },
  { id: 'musica',      label: '🎸 Música' },
  { id: 'otros',       label: '📦 Otros' },
]

export default function EditarItem() {
  const { id } = useParams()
  const router = useRouter()

  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [title,       setTitle]       = useState('')
  const [wanted,      setWanted]      = useState('')
  const [category,    setCategory]    = useState('')
  const [city,        setCity]        = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => { loadItem() }, [])

  const loadItem = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user
      if (!user) { router.replace('/login'); return }

      const { data: item } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single()

      if (!item) { router.replace('/'); return }

      if (item.user_id !== user.id) { router.replace(`/item/${id}`); return }

      setTitle(item.title ?? '')
      setWanted(item.wanted ?? '')
      setCategory(item.category ?? '')
      setCity(item.city ?? '')
      setDescription(item.description ?? '')
    } catch {
      router.replace('/')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim() || !city.trim() || !category) return
    setSaving(true)
    setErrorMsg(null)

    try {
      const { error } = await supabase
        .from('items')
        .update({ title, wanted, category, city, description })
        .eq('id', id)

      if (error) {
        console.error('Update error:', error)
        setErrorMsg('Error al guardar: ' + error.message)
        return
      }

      router.push(`/item/${id}`)
    } catch {
      setErrorMsg('Ocurrió un error inesperado')
    } finally {
      setSaving(false)
    }
  }

  const canSave = title.trim().length > 0 && city.trim().length > 0 && category !== '' && !saving

  if (loading) {
    return <div style={{ background: '#FDF8F3', minHeight: '100vh', padding: 20, color: '#6B7680' }}>Cargando...</div>
  }

  return (
    <div style={styles.container}>
      <style>{`
        .edit-input::placeholder,
        .edit-textarea::placeholder { color: #9CA3AF; }
      `}</style>

      {/* HEADER */}
      <div style={styles.header}>
        <button onClick={() => router.back()} style={styles.backBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="#1A2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span style={styles.headerTitle}>Editar publicación</span>
        <div style={{ width: 40 }} />
      </div>

      {/* FOTOS — no editables en MVP */}
      <div style={styles.photosNote}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>Para cambiar las fotos, contacta a soporte.</span>
      </div>

      {/* TÍTULO */}
      <div style={styles.group}>
        <div style={styles.label}>Título</div>
        <input
          className="edit-input"
          placeholder="Ej: Cámara Sony Alpha 6000"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={styles.input}
        />
      </div>

      {/* BUSCAS */}
      <div style={styles.group}>
        <div style={styles.label}>¿Qué buscas a cambio?</div>
        <input
          className="edit-input"
          placeholder="Ej: Bicicleta, guitarra o nada en particular..."
          value={wanted}
          onChange={e => setWanted(e.target.value)}
          style={styles.input}
        />
      </div>

      {/* CATEGORÍA */}
      <div style={{ marginBottom: 16 }}>
        <div style={styles.label}>Categoría</div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {CATEGORIAS.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              style={{
                padding: '8px 14px',
                borderRadius: 20,
                border: '1.5px solid',
                borderColor: category === cat.id ? '#F97316' : '#E5DDD5',
                background: category === cat.id ? '#FFF5F0' : '#FFFFFF',
                color: category === cat.id ? '#F97316' : '#6B7280',
                fontWeight: category === cat.id ? 700 : 400,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: 'inherit',
                flexShrink: 0,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* CIUDAD */}
      <div style={styles.group}>
        <div style={styles.label}>Ciudad</div>
        <input
          className="edit-input"
          placeholder="Ej: Monterrey, CDMX..."
          value={city}
          onChange={e => setCity(e.target.value)}
          style={styles.input}
        />
      </div>

      {/* DESCRIPCIÓN */}
      <div style={styles.group}>
        <div style={styles.label}>Descripción</div>
        <textarea
          className="edit-textarea"
          placeholder="Cuéntales más sobre tu objeto..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={styles.textarea}
        />
      </div>

      {errorMsg && (
        <div style={styles.errorBox}>{errorMsg}</div>
      )}

      <button
        onClick={handleSave}
        disabled={!canSave}
        style={{
          ...styles.button,
          opacity: canSave ? 1 : 0.5,
          cursor: canSave ? 'pointer' : 'not-allowed',
        }}
      >
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  )
}

const styles: any = {
  container: {
    padding: 16,
    paddingBottom: 80,
    background: '#FDF8F3',
    minHeight: '100vh',
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
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
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1A2744',
  },

  photosNote: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#FFF5F0',
    border: '1.5px solid #F97316',
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 13,
    color: '#C2410C',
    fontWeight: 500,
    marginBottom: 20,
  },

  group: {
    marginBottom: 16,
  },

  label: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1A2744',
    marginBottom: 6,
  },

  input: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    border: 'none',
    fontSize: 14,
    background: '#F0EAE0',
    boxSizing: 'border-box',
  },

  textarea: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    border: 'none',
    fontSize: 14,
    minHeight: 100,
    resize: 'none',
    background: '#F0EAE0',
    boxSizing: 'border-box',
  },

  button: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    background: '#F97316',
    color: '#fff',
    border: 'none',
    fontSize: 16,
    fontWeight: 600,
    marginTop: 24,
    marginBottom: 24,
    fontFamily: 'inherit',
  },

  errorBox: {
    background: '#FEE2E2',
    color: '#991B1B',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginTop: 8,
  },
}
