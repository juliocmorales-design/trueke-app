'use client'

import { useRouter } from 'next/navigation'

export default function Onboarding() {
  const router = useRouter()

  const handleStart = () => {
    localStorage.setItem('onboarding_seen', 'true')
    router.push('/')
  }

  const handleLogin = () => {
    localStorage.setItem('onboarding_seen', 'true')
    router.push('/login')
  }

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>9:41</div>
        <div style={{ cursor: 'pointer' }} onClick={handleStart}>
          Omitir
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={styles.content}>
        <div>
          <h1 style={styles.title}>
            Bienvenido a <br />
            <span style={styles.accent}>Trueke</span>
          </h1>

          <p style={styles.subtitle}>
            Intercambia, conecta <br />
            y crea comunidad.
          </p>
        </div>

        {/* 🔥 ILUSTRACIÓN CORRECTA */}
        <div style={styles.illustrationWrapper}>
          {/* fondo suave tipo blob */}
          <div style={styles.blob} />

          {/* imagen */}
          <img
            src="/images/portada.png"
            style={styles.image}
          />
        </div>

        {/* DOTS */}
        <div style={styles.dots}>
          <div style={{ ...styles.dot, ...styles.activeDot }} />
          <div style={styles.dot} />
          <div style={styles.dot} />
        </div>
      </div>

      {/* CTA */}
      <div>
        <div style={styles.button} onClick={handleStart}>
          Comenzar
        </div>

        <div style={styles.login}>
          ¿Ya tienes cuenta?{' '}
          <span onClick={handleLogin}>
            Iniciar sesión
          </span>
        </div>
      </div>
    </div>
  )
}

const styles: any = {
  container: {
    padding: 20,
    paddingBottom: 40,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#6B7680',
    fontSize: 14,
  },

  content: {
    marginTop: 10,
  },

  title: {
    fontSize: 34,
    margin: 0,
    color: '#1E2A32',
    lineHeight: 1.2,
  },

  accent: {
    color: '#F97316',
    fontWeight: 'bold',
  },

  subtitle: {
    color: '#6B7680',
    fontSize: 16,
    marginTop: 10,
    lineHeight: 1.4,
  },

  /* 🔥 CONTENEDOR SIN FONDO */
  illustrationWrapper: {
    position: 'relative',
    marginTop: 20,
    height: 280,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* 🔥 BLOB SUAVE COMO MOCKUP */
  blob: {
    position: 'absolute',
    width: 260,
    height: 180,
    background: '#E9E2DB',
    borderRadius: '50%',
    filter: 'blur(0px)',
  },

  /* 🔥 IMAGEN LIMPIA */
  image: {
    position: 'relative',
    width: '90%',
    objectFit: 'contain',
  },

  dots: {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    marginTop: 15,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#D8CFC7',
  },

  activeDot: {
    background: '#F97316',
  },

  button: {
    background: '#F97316',
    color: '#fff',
    textAlign: 'center',
    padding: 16,
    borderRadius: 30,
    fontSize: 18,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(249,115,22,0.4)',
  },

  login: {
    textAlign: 'center',
    marginTop: 12,
    color: '#6B7680',
  },
}