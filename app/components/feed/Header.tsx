'use client'

import { useState, useEffect } from 'react'

const categories = [
  'ALL',
  'Electrónica',
  'Ropa',
  'Libros',
  'Muebles',
  'Deportes',
  'Servicios'
]

export default function Header({
  onSearch,
  onCategory
}: {
  onSearch: (value: string) => void
  onCategory: (value: string) => void
}) {
  const [city, setCity] = useState('Monterrey')
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('ALL')

  useEffect(() => {
    const saved = localStorage.getItem('city')
    if (saved) setCity(saved)
  }, [])

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setCity(value)
    localStorage.setItem('city', value)
    window.location.reload()
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    onSearch(value)
  }

  const handleCategory = (cat: string) => {
    setActiveCategory(cat)
    onCategory(cat)
  }

  return (
    <div style={styles.container}>
      <select value={city} onChange={handleCityChange} style={styles.select}>
        <option value="ALL">🌎 Todas las ciudades</option>
        <option value="Monterrey">Monterrey</option>
        <option value="San Nicolás">San Nicolás</option>
        <option value="Apodaca">Apodaca</option>
        <option value="Guadalupe">Guadalupe</option>
        <option value="Santa Catarina">Santa Catarina</option>
      </select>

      <input
        style={styles.input}
        placeholder="Buscar objetos o personas..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
      />

      <div style={styles.chips}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategory(cat)}
            style={{
              ...styles.chip,
              backgroundColor: activeCategory === cat ? 'orange' : '#eee',
              color: activeCategory === cat ? 'white' : 'black'
            }}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  select: {
    padding: 8,
    borderRadius: 8
  },
  input: {
    padding: 10,
    borderRadius: 8,
    border: '1px solid #ccc'
  },
  chips: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto'
  },
  chip: {
    padding: '6px 12px',
    borderRadius: 20,
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  }
}