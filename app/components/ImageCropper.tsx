'use client'
import Cropper from 'react-easy-crop'
import { useState, useCallback } from 'react'
import { Area } from 'react-easy-crop'
import { getCroppedImg } from '@/app/lib/cropImage'

interface Props {
  imageSrc: string
  circular?: boolean
  aspectRatio?: number
  onComplete: (file: File) => void
  onCancel: () => void
}

export default function ImageCropper({
  imageSrc, circular = false, aspectRatio = 4/3,
  onComplete, onCancel
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels) return
    setSaving(true)
    const file = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, circular)
    setSaving(false)
    onComplete(file)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
      zIndex: 100, display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={circular ? 1 : aspectRatio}
          cropShape={circular ? 'round' : 'rect'}
          showGrid={!circular}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div style={{
        background: '#1A2744',
        padding: '16px 20px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
      }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)',
            display: 'block', marginBottom: 4 }}>
            Zoom
          </label>
          <input type="range" min={1} max={3} step={0.1}
            value={zoom} onChange={e => setZoom(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)',
            display: 'block', marginBottom: 4 }}>
            Rotar
          </label>
          <input type="range" min={-180} max={180} step={1}
            value={rotation} onChange={e => setRotation(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel}
            style={{ flex: 1, background: 'rgba(255,255,255,0.1)',
              border: 'none', borderRadius: 16, padding: 14,
              color: '#fff', fontSize: 15, cursor: 'pointer',
              fontFamily: 'inherit' }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 2, background: '#F97316', border: 'none',
              borderRadius: 16, padding: 14, color: '#fff',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Procesando...' : 'Usar esta foto'}
          </button>
        </div>
      </div>
    </div>
  )
}
