'use client'

export default function AppContainer({ children }) {
  return (
    <div style={styles.outer}>
      <div style={styles.app}>
        {children}
      </div>
    </div>
  )
}

const styles = {
  outer: {
    backgroundColor: '#e9e3d9',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center'
  },
  app: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    minHeight: '100vh',
    position: 'relative',

    // 🔥 espacio para el bottom nav
    paddingBottom: 90,
    boxSizing: 'border-box'
  }
}