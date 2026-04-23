'use client'

import { useState } from 'react'
import supabase from '../lib/supabase'

export default function CrearPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('Monterrey')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!file) {
      alert('Selecciona una imagen')
      return
    }

    setLoading(true)

    try {
      // 🔥 0. Obtener usuario
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (!user) {
        alert('No autenticado')
        setLoading(false)
        return
      }

      // 🔥 1. Subir imagen (MEJORADO con carpeta por usuario)
      const fileName = `items/${user.id}/${Date.now()}-${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file)

      if (uploadError) {
        console.error(uploadError)
        alert('Error subiendo imagen')
        setLoading(false)
        return
      }

      // 🔥 2. Obtener URL pública
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(fileName)

      const imageUrl = data.publicUrl

      console.log('URL:', imageUrl)

      // 🔥 3. Guardar en DB (FIX CLAVE AQUÍ)
      const { error: insertError } = await supabase
        .from('items')
        .insert([
          {
            title,
            description,
            city,
            user_id: user.id, // 🔥 ESTE ERA EL BUG
            images: [imageUrl],
          }
        ])

      if (insertError) {
        console.error(insertError)
        alert('Error guardando')
        setLoading(false)
        return
      }

      alert('Publicado ✅')

      // 🔄 reset
      setTitle('')
      setDescription('')
      setFile(null)

      // 🔥 recargar para ver en home
      window.location.href = '/'
    } catch (err) {
      console.error(err)
      alert('Error general')
    }

    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <h2>Crear publicación</h2>

      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        style={styles.input}
      >
        <option>Monterrey</option>
        <option>Apodaca</option>
        <option>San Nicolás</option>
      </select>

      <input
        placeholder="Título"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={styles.input}
      />

      <textarea
        placeholder="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={styles.input}
      />

      <input
        type="file"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) setFile(f)
        }}
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={styles.button}
      >
        {loading ? 'Publicando...' : 'Publicar'}
      </button>
    </div>
  )
}

const styles = {
  container: {
    padding: 16,
    paddingBottom: 120
  },

  input: {
    width: '100%',
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    border: '1px solid #ddd'
  },

  button: {
    width: '100%',
    padding: 14,
    borderRadius: 10,
    background: '#F97316',
    color: '#fff',
    border: 'none'
  }
}