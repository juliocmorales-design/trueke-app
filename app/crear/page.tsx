'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import supabase from '../lib/supabase'
import { compressImage } from '../lib/compressImage'
import { CATEGORIAS } from '../lib/constants'
import ImageCropper from '../components/ImageCropper'

const INTERESTS_LIST = [
  'Electrónica', 'Ropa', 'Libros', 'Muebles',
  'Deportes', 'Arte', 'Música', 'Herramientas',
  'Juguetes', 'Vehículos', 'Comida', 'Plantas',
]

export default function CrearPage() {
  return (
    <Suspense fallback={null}>
      <CrearForm />
    </Suspense>
  )
}

function CrearForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const chainId  = searchParams.get('chainId')
  const newChain = searchParams.get('newChain')

  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [wanted,      setWanted]      = useState('')
  const [category,    setCategory]    = useState('')
  const [city,        setCity]        = useState('')

  const [files,    setFiles]    = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  const [openToOffers, setOpenToOffers] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [errorMsg,     setErrorMsg]     = useState<string | null>(null)
  const [cropSrc,      setCropSrc]      = useState<string | null>(null)
  const [showCropper,  setShowCropper]  = useState(false)

  // City step
  const [needsCityStep,    setNeedsCityStep]    = useState(false)
  const [cityStepDone,     setCityStepDone]     = useState(false)
  const [cityStepInput,    setCityStepInput]    = useState('')
  const [cityStepInterests, setCityStepInterests] = useState<string[]>([])
  const [savingCityStep,   setSavingCityStep]   = useState(false)

  useEffect(() => {
    const loadUserCity = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('city, interests')
        .eq('id', user.id)
        .single()
      if (profile?.city) {
        setCity(profile.city)
        setCityStepDone(true)
      } else {
        setNeedsCityStep(true)
        if (profile?.interests?.length) {
          setCityStepInterests(profile.interests)
        }
      }
    }
    loadUserCity()
  }, [])

  const saveCityStep = async () => {
    if (!cityStepInput.trim()) return
    setSavingCityStep(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user
      if (user) {
        await supabase
          .from('profiles')
          .update({ city: cityStepInput.trim(), interests: cityStepInterests })
          .eq('id', user.id)
        setCity(cityStepInput.trim())
      }
    } finally {
      setSavingCityStep(false)
      setCityStepDone(true)
    }
  }

  const MAX_SIZE = 5 * 1024 * 1024

  const handleImages = (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_SIZE) {
      setErrorMsg('La foto debe pesar menos de 5MB.')
      return
    }
    const url = URL.createObjectURL(file)
    setCropSrc(url)
    setShowCropper(true)
  }

  const removeImage = (index: number) => {
    const nf = [...files]
    const np = [...previews]
    nf.splice(index, 1)
    np.splice(index, 1)
    setFiles(nf)
    setPreviews(np)
  }

  const handleSubmit = async () => {
    setErrorMsg(null)
    if (files.length === 0) { setErrorMsg('Agrega al menos una imagen'); return }
    setLoading(true)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user
      if (!user) { setErrorMsg('No autenticado'); setLoading(false); return }

      const compressedFiles = await Promise.all(files.map(f => compressImage(f)))
      const uploadedUrls: string[] = []
      for (const file of compressedFiles) {
        const fileName = `items/${user.id}/${Date.now()}-${file.name}`
        const { error } = await supabase.storage.from('images').upload(fileName, file)
        if (error) {
          console.error('Storage error:', error)
          setErrorMsg(`Error subiendo imagen: ${error.message}`)
          setLoading(false)
          return
        }
        const { data } = supabase.storage.from('images').getPublicUrl(fileName)
        uploadedUrls.push(data.publicUrl)
      }

      const wantedValue = openToOffers ? 'Abierto a cualquier oferta' : (wanted.trim() || null)
      const { data: newItem, error } = await supabase
        .from('items')
        .insert([{ title, description, wanted: wantedValue, city, category, user_id: user.id, images: uploadedUrls }])
        .select('id')
        .single()

      if (error || !newItem) { setErrorMsg('Error guardando la publicación'); setLoading(false); return }

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

  const canSubmit = title.trim().length > 0 && files.length > 0 && city.trim().length > 0 && category !== '' && !loading

  /* ── City step ── */
  if (needsCityStep && !cityStepDone) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button onClick={() => router.back()} style={styles.backBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="#1A2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span style={styles.headerTitle}>Antes de publicar</span>
          <div style={{ width: 40 }} />
        </div>

        <div style={{ padding: '0 0 80px' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1A2744', marginBottom: 8, marginTop: 8 }}>
            Un momento antes...
          </h2>
          <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.6, marginBottom: 28 }}>
            ¿En qué ciudad estás? Así conectamos tu objeto con personas cerca de ti.
          </p>

          <div style={{ marginBottom: 24 }}>
            <div style={styles.label}>Ciudad</div>
            <input
              style={styles.input}
              placeholder="Ej: Monterrey, CDMX..."
              value={cityStepInput}
              onChange={e => setCityStepInput(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={styles.label}>¿Qué te interesa intercambiar? <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opcional)</span></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {INTERESTS_LIST.map(i => (
                <div
                  key={i}
                  onClick={() => setCityStepInterests(prev =>
                    prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
                  )}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: '1.5px solid',
                    borderColor: cityStepInterests.includes(i) ? '#F97316' : '#E5DDD5',
                    background: cityStepInterests.includes(i) ? '#FFF5F0' : '#FFFFFF',
                    color: cityStepInterests.includes(i) ? '#F97316' : '#6B7280',
                    fontSize: 13,
                    fontWeight: cityStepInterests.includes(i) ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {i}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={saveCityStep}
            disabled={!cityStepInput.trim() || savingCityStep}
            style={{
              ...styles.button,
              opacity: !cityStepInput.trim() || savingCityStep ? 0.5 : 1,
              cursor: !cityStepInput.trim() || savingCityStep ? 'not-allowed' : 'pointer',
            }}
          >
            {savingCityStep ? 'Guardando...' : 'Continuar'}
          </button>
        </div>
      </div>
    )
  }

  /* ── Main form ── */
  return (
    <div style={styles.container}>

      {showCropper && cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          circular={false}
          aspectRatio={4/3}
          onComplete={file => {
            setFiles(prev => [...prev, file])
            setPreviews(prev => [...prev, URL.createObjectURL(file)])
            setShowCropper(false)
            setCropSrc(null)
          }}
          onCancel={() => {
            setShowCropper(false)
            setCropSrc(null)
          }}
        />
      )}
      <style>{`
        .crear-input::placeholder,
        .crear-textarea::placeholder { color: #9CA3AF; }
      `}</style>

      {/* HEADER */}
      <div style={styles.header}>
        <button onClick={() => router.back()} style={styles.backBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="#1A2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span style={styles.headerTitle}>Crear publicación</span>
        <div style={{ width: 40 }} />
      </div>

      {/* BANNER CADENA */}
      {(chainId || newChain) && (
        <div style={styles.chainBanner}>
          {chainId
            ? 'Continuando cadena — publica lo que vas a intercambiar'
            : 'Nueva cadena — publica el primer objeto'}
        </div>
      )}

      <form onSubmit={e => { e.preventDefault(); handleSubmit() }}>
      {/* FOTOS */}
      <div style={styles.section}>
        <div style={styles.label}>Fotos</div>
        <div style={styles.subLabel}>{previews.length}/5 fotos</div>
        <div style={styles.photosRow}>
          {previews.length < 5 && (
            <label style={styles.addPhoto}>
              <span style={{ fontSize: 28, color: '#F97316', lineHeight: 1 }}>+</span>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImages} />
            </label>
          )}
          {previews.map((p, i) => (
            <div key={i} style={styles.photoWrapper}>
              <img src={p} style={styles.photo} alt={`foto ${i + 1}`} />
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
          onChange={e => setTitle(e.target.value)}
          style={styles.input}
          maxLength={80}
        />
      </div>

      {/* BUSCAS */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 16, fontWeight: 700, color: '#1A2744', display: 'block', marginBottom: 8 }}>
          ¿Qué buscas a cambio?
          <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: 13, marginLeft: 6 }}>(opcional)</span>
        </label>

        <div
          onClick={() => setOpenToOffers(!openToOffers)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px',
            background: openToOffers ? '#FFF5F0' : '#F0EAE0',
            borderRadius: 12,
            border: openToOffers ? '1.5px solid #F97316' : '1.5px solid transparent',
            cursor: 'pointer',
            marginBottom: 10,
          }}
        >
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            border: '2px solid #F97316',
            background: openToOffers ? '#F97316' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {openToOffers && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span style={{ fontSize: 14, color: '#1A2744', fontWeight: 500 }}>
            Estoy abierto a cualquier oferta
          </span>
        </div>

        {!openToOffers && (
          <input
            className="crear-input"
            value={wanted}
            onChange={e => setWanted(e.target.value)}
            placeholder="Ej: bicicleta, ropa deportiva, herramientas..."
            maxLength={100}
            style={styles.input}
          />
        )}
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
                padding: '8px 14px', borderRadius: 20, border: '1.5px solid',
                borderColor: category === cat.id ? '#F97316' : '#E5DDD5',
                background: category === cat.id ? '#FFF5F0' : '#FFFFFF',
                color: category === cat.id ? '#F97316' : '#6B7280',
                fontWeight: category === cat.id ? 700 : 400,
                fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                fontFamily: 'inherit', flexShrink: 0,
              }}
            >
              <span aria-hidden="true">{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CIUDAD */}
      <div style={styles.group}>
        <div style={styles.label}>Ciudad</div>
        <input
          className="crear-input"
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
          className="crear-textarea"
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

      {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

      <button
        type="submit"
        disabled={!canSubmit}
        style={{ ...styles.button, opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
      >
        {loading ? 'Publicando...' : 'Publicar'}
      </button>
      </form>
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
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24,
  },

  backBtn: {
    width: 40, height: 40, borderRadius: '50%', background: '#F0EAE0',
    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },

  headerTitle: { fontSize: 18, fontWeight: 700, color: '#1A2744' },

  chainBanner: {
    background: '#FFF0E6', borderRadius: 12, padding: 12,
    fontSize: 14, fontWeight: 500, color: '#C2410C', marginBottom: 20,
  },

  section: { marginBottom: 20 },

  group: { marginBottom: 16 },

  label: { fontSize: 15, fontWeight: 600, color: '#1A2744', marginBottom: 6 },

  subLabel: { fontSize: 13, color: '#6F7A82', marginBottom: 10 },

  photosRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },

  addPhoto: {
    width: 80, height: 80, borderRadius: 16, border: '2px dashed #F97316',
    background: '#FDF8F3', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },

  photoWrapper: { position: 'relative' },

  photo: { width: 80, height: 80, borderRadius: 16, objectFit: 'cover' },

  removeBtn: {
    position: 'absolute', top: -6, right: -6, width: 28, height: 28, borderRadius: '50%',
    background: '#1A2744', color: '#fff', fontSize: 18,
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', lineHeight: 1,
  },

  input: {
    width: '100%', padding: 14, borderRadius: 12, border: 'none',
    fontSize: 16, background: '#F0EAE0', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none',
  },

  textarea: {
    width: '100%', padding: 14, borderRadius: 12, border: 'none',
    fontSize: 16, minHeight: 100, resize: 'none', background: '#F0EAE0',
    boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none',
  },

  button: {
    width: '100%', padding: 16, borderRadius: 16, background: '#F97316',
    color: '#fff', border: 'none', fontSize: 16, fontWeight: 600,
    marginTop: 24, marginBottom: 24, fontFamily: 'inherit',
  },

  errorBox: {
    background: '#FEE2E2', color: '#991B1B', borderRadius: 12, padding: 12, fontSize: 14, marginTop: 8,
  },
}
