'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import supabase from '../lib/supabase'

export default function CrearPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const chainId  = searchParams.get('chainId')
  const newChain = searchParams.get('newChain')
  const itemId   = searchParams.get('itemId')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [wanted, setWanted] = useState('')
  const [city, setCity] = useState('')

  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleImages = (e: any) => {
    const selected = Array.from(e.target.files || []) as File[]
    const total = [...files, ...selected].slice(0, 5)

    setFiles(total)

    const urls = total.map((f) => URL.createObjectURL(f as Blob))
    setPreviews(urls)
  }

  const removeImage = (index: number) => {
    const newFiles = [...files]
    const newPreviews = [...previews]

    newFiles.splice(index, 1)
    newPreviews.splice(index, 1)

    setFiles(newFiles)
    setPreviews(newPreviews)
  }

  const handleSubmit = async () => {
    setErrorMsg(null)

    if (files.length === 0) {
      setErrorMsg('Agrega al menos una imagen')
      return
    }

    setLoading(true)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (!user) {
        setErrorMsg('No autenticado')
        setLoading(false)
        return
      }

      const uploadedUrls: string[] = []

      for (const file of files) {
        const fileName = `items/${user.id}/${Date.now()}-${file.name}`

        const { error } = await supabase.storage
          .from('images')
          .upload(fileName, file)

        if (error) {
          console.error(error)
          setErrorMsg('Error subiendo imagen')
          setLoading(false)
          return
        }

        const { data } = supabase.storage
          .from('images')
          .getPublicUrl(fileName)

        uploadedUrls.push(data.publicUrl)
      }

      const { data: newItem, error } = await supabase
        .from('items')
        .insert([{ title, description, wanted, city, user_id: user.id, images: uploadedUrls }])
        .select('id')
        .single()

      if (error || !newItem) {
        console.error(error)
        setErrorMsg('Error guardando la publicación')
        setLoading(false)
        return
      }

      const newItemId = newItem.id
      const { data: { session: sess } } = await supabase.auth.getSession()
      const token = sess?.access_token ?? ''

      if (newChain === 'true') {
        const res = await fetch('/api/chains/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ receivedItemId: newItemId }),
        })
        const json = await res.json().catch(() => null)
        router.push(res.ok ? `/chain/${json?.chainId}` : '/')
        return
      }

      if (chainId) {
        const res = await fetch('/api/chains/add-step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ chainId: Number(chainId), newItemId }),
        })
        const json = await res.json().catch(() => null)
        router.push(res.ok ? `/chain/${json?.chainId}` : '/')
        return
      }

      router.push('/')

    } catch (err) {
      console.error(err)
      setErrorMsg('Ocurrió un error inesperado')
    }

    setLoading(false)
  }

  const canSubmit = title.trim().length > 0 && files.length > 0 && !loading

  return (
    <div style={styles.container}>
      <style>{`
        .crear-input::placeholder,
        .crear-textarea::placeholder { color: #9CA3AF; }
      `}</style>

      {/* HEADER */}
      <div style={styles.header}>
        <button onClick={() => router.back()} style={styles.backBtn}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.5 16L7 10L12.5 4" stroke="#1A2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={styles.headerTitle}>Crear publicación</span>
        <div style={{ width: 40 }} />
      </div>

      {/* BANNER CADENA */}
      {(chainId || newChain) && (
        <div style={styles.chainBanner}>
          {chainId
            ? '🔗 Continuando cadena — publica lo que vas a intercambiar'
            : '✨ Nueva cadena — publica el primer objeto'}
        </div>
      )}

      {/* FOTOS */}
      <div style={styles.section}>
        <div style={styles.label}>Fotos</div>
        <div style={styles.subLabel}>{previews.length}/5 fotos</div>

        <div style={styles.photosRow}>

          {previews.length < 5 && (
            <label style={styles.addPhoto}>
              <span style={{ fontSize: 28, color: '#F97316', lineHeight: 1 }}>+</span>
              <input
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={handleImages}
              />
            </label>
          )}

          {previews.map((p, i) => (
            <div key={i} style={styles.photoWrapper}>
              <img src={p} style={styles.photo} />
              <div style={styles.removeBtn} onClick={() => removeImage(i)}>×</div>
            </div>
          ))}

        </div>
      </div>

      {/* TÍTULO */}
      <div style={styles.group}>
        <div style={styles.label}>Título</div>
        <input
          className="crear-input"
          placeholder="Ej: Cámara Sony Alpha 6000"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={styles.input}
        />
      </div>

      {/* BUSCAS */}
      <div style={styles.group}>
        <div style={styles.label}>¿Qué buscas a cambio?</div>
        <input
          className="crear-input"
          placeholder="Ej: Bicicleta, guitarra o nada en particular..."
          value={wanted}
          onChange={(e) => setWanted(e.target.value)}
          style={styles.input}
        />
      </div>

      {/* CIUDAD */}
      <div style={styles.group}>
        <div style={styles.label}>Ciudad</div>
        <input
          className="crear-input"
          placeholder="Ej: Monterrey, CDMX..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={styles.input}
        />
      </div>

      {/* DESCRIPCIÓN */}
      <div style={styles.group}>
        <div style={styles.label}>Descripción</div>
        <textarea
          className="crear-textarea"
          placeholder="Cuéntales más sobre tu objeto..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={styles.textarea}
        />
      </div>

      {errorMsg && (
        <div style={styles.errorBox}>{errorMsg}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          ...styles.button,
          opacity: canSubmit ? 1 : 0.5,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}
      >
        {loading ? 'Publicando...' : 'Publicar'}
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1A2744',
  },

  chainBanner: {
    background: '#FFF0E6',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontWeight: 500,
    color: '#C2410C',
    marginBottom: 20,
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
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: '#1A2744',
    color: '#fff',
    fontSize: 16,
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
