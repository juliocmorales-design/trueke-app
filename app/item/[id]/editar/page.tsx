'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import supabase from '@/app/lib/supabase'
import { compressImage } from '@/app/lib/compressImage'

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

  // URLs de fotos existentes que el usuario no ha eliminado
  const [existingImages, setExistingImages] = useState<string[]>([])
  // Fotos nuevas seleccionadas por el usuario
  const [newFiles,    setNewFiles]    = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])

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
      setExistingImages(item.images ?? [])
    } catch {
      router.replace('/')
    } finally {
      setLoading(false)
    }
  }

  const totalCount = existingImages.length + newFiles.length

  const MAX_SIZE = 5 * 1024 * 1024 // 5MB

  const handleImages = (e: any) => {
    const selected = Array.from(e.target.files || []) as File[]

    for (const file of selected) {
      if (file.size > MAX_SIZE) {
        setErrorMsg('Cada foto debe pesar menos de 5MB.')
        return
      }
    }

    const slots = 5 - existingImages.length
    const combined = [...newFiles, ...selected].slice(0, slots)
    setNewFiles(combined)
    setNewPreviews(combined.map(f => URL.createObjectURL(f as Blob)))
  }

  const removeExisting = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeNew = (index: number) => {
    const f = [...newFiles]
    const p = [...newPreviews]
    f.splice(index, 1)
    p.splice(index, 1)
    setNewFiles(f)
    setNewPreviews(p)
  }

  const handleSave = async () => {
    if (!title.trim() || !city.trim() || !category) return
    if (existingImages.length + newFiles.length === 0) {
      setErrorMsg('Agrega al menos una imagen')
      return
    }

    setSaving(true)
    setErrorMsg(null)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user
      if (!user) return

      const compressedFiles = await Promise.all(newFiles.map(f => compressImage(f)))
      const uploadedUrls: string[] = []
      for (const file of compressedFiles) {
        const fileName = `items/${user.id}/${Date.now()}-${file.name}`
        const { error } = await supabase.storage.from('images').upload(fileName, file)
        if (error) {
          console.error(error)
          setErrorMsg('Error subiendo imagen')
          setSaving(false)
          return
        }
        const { data } = supabase.storage.from('images').getPublicUrl(fileName)
        uploadedUrls.push(data.publicUrl)
      }

      const finalImages = [...existingImages, ...uploadedUrls]

      const { error } = await supabase
        .from('items')
        .update({ title, wanted, category, city, description, images: finalImages })
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

  const handleDeactivate = async () => {
    const confirmed = window.confirm(
      '¿Seguro que quieres desactivar esta publicación? Ya no aparecerá en el feed ni en búsquedas, y las ofertas pendientes serán canceladas automáticamente.'
    )
    if (!confirmed) return

    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user
    if (!user) return

    // Cancelar ofertas pendientes de este item
    const { error: offersError } = await supabase
      .from('offers')
      .update({ status: 'rejected' })
      .eq('status', 'pending')
      .or(`from_item_id.eq.${id},to_item_id.eq.${id}`)

    if (offersError) {
      console.error('Error cancelando ofertas:', offersError)
      // No bloqueamos — continuamos con la desactivación
    }

    const { error } = await supabase
      .from('items')
      .update({ active: false })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      setErrorMsg('Error al desactivar: ' + error.message)
      return
    }

    router.push('/perfil/publicaciones')
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

      {/* FOTOS */}
      <div style={styles.section}>
        <div style={styles.label}>Fotos</div>
        <div style={styles.subLabel}>{totalCount}/5 fotos</div>

        <div style={styles.photosRow}>

          {totalCount < 5 && (
            <label style={styles.addPhoto}>
              <span style={{ fontSize: 28, color: '#F97316', lineHeight: 1 }}>+</span>
              <input
                type="file"
                multiple
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImages}
              />
            </label>
          )}

          {existingImages.map((url, i) => (
            <div key={`ex-${i}`} style={styles.photoWrapper}>
              <img src={url} style={styles.photo} alt="" />
              <div style={styles.removeBtn} onClick={() => removeExisting(i)}>×</div>
            </div>
          ))}

          {newPreviews.map((p, i) => (
            <div key={`new-${i}`} style={styles.photoWrapper}>
              <img src={p} style={styles.photo} alt="" />
              <div style={styles.removeBtn} onClick={() => removeNew(i)}>×</div>
            </div>
          ))}

        </div>
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
          maxLength={80}
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
          maxLength={100}
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
          maxLength={500}
        />
        <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'right', margin: '4px 0 0' }}>
          {description.length}/500
        </p>
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

      <button
        onClick={handleDeactivate}
        style={{
          background: 'none',
          border: '1.5px solid #DC2626',
          borderRadius: 16,
          padding: '14px',
          width: '100%',
          color: '#DC2626',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
          marginTop: 8,
        }}
      >
        Desactivar publicación
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

  section: {
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

  subLabel: {
    fontSize: 13,
    color: '#6F7A82',
    marginBottom: 10,
  },

  photosRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },

  addPhoto: {
    width: 80,
    height: 80,
    borderRadius: 16,
    border: '2px dashed #F97316',
    background: '#FDF8F3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },

  photoWrapper: {
    position: 'relative',
  },

  photo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    objectFit: 'cover',
  },

  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: '#1A2744',
    color: '#fff',
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    lineHeight: 1,
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
