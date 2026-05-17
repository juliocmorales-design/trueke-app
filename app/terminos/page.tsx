'use client'

import { useRouter } from 'next/navigation'

export default function TerminosPage() {
  const router = useRouter()

  return (
    <div style={s.container}>

      {/* HEADER */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => router.back()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="#1A2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span style={s.headerTitle}>Términos y Privacidad</span>
        <div style={{ width: 40 }} />
      </div>

      <div style={s.content}>

        {/* ── TÉRMINOS DE USO ── */}
        <h2 style={s.mainTitle}>Términos de Uso</h2>
        <p style={s.meta}>Última actualización: Mayo 2026</p>

        <Section
          title="1. Aceptación de los Términos"
          body="Al crear una cuenta y usar Trueke.app aceptas estos Términos en su totalidad. Trueke.app es operada por Julio Morales, con domicilio en Monterrey, Nuevo León, México."
        />

        <Section
          title="2. ¿Qué es Trueke.app?"
          body="Trueke.app es una plataforma digital que facilita el intercambio de objetos entre usuarios. No somos parte de ningún intercambio, no vendemos productos, ni actuamos como intermediarios comerciales."
        />

        <Section
          title="3. Elegibilidad"
          body="Para usar Trueke.app debes tener al menos 18 años, proporcionar información veraz al registrarte y tener capacidad legal para celebrar contratos en México."
        />

        <Section
          title="4. Uso Permitido"
          body="Puedes publicar objetos que te pertenecen, contactar otros usuarios para acordar intercambios, calificar intercambios completados y participar en cadenas de intercambio."
        />

        <Section
          title="5. Uso Prohibido"
          body="Está prohibido: publicar objetos ilegales, robados o falsificados; usar la plataforma para fraude; acosar o intimidar usuarios; crear cuentas falsas; publicar contenido obsceno o que viole derechos de terceros."
        />

        <Section
          title="6. Los Intercambios"
          body="Trueke.app no garantiza que los intercambios se completen, el estado o calidad de los objetos, ni la seguridad de los encuentros físicos. Elige siempre lugares públicos y seguros. Cualquier disputa debe resolverse directamente entre usuarios."
        />

        <Section
          title="7. Calificaciones"
          body="Las calificaciones reflejan experiencias reales. Podemos eliminar calificaciones falsas, con lenguaje ofensivo o que no correspondan a intercambios reales."
        />

        <Section
          title="8. Limitación de Responsabilidad"
          body="Trueke.app no será responsable por pérdidas derivadas de intercambios, objetos que no correspondan a su descripción, daños durante encuentros entre usuarios, ni conducta de terceros en la plataforma."
        />

        <Section
          title="9. Terminación de Cuenta"
          body="Podemos suspender tu cuenta si violas estos Términos, recibes múltiples reportes o detectamos actividad fraudulenta."
        />

        <Section
          title="10. Ley Aplicable"
          body="Estos Términos se rigen por las leyes de México. Cualquier controversia se someterá a los tribunales de Monterrey, N.L."
        />

        <div style={s.divider} />

        {/* ── POLÍTICA DE PRIVACIDAD ── */}
        <h2 style={s.mainTitle}>Política de Privacidad</h2>

        <Section
          title="11. Información que Recopilamos"
          body="Recopilamos: nombre y usuario, correo electrónico, ciudad, foto de perfil (opcional), intereses, fotos de objetos publicados y mensajes en el chat."
        />

        <Section
          title="12. Cómo Usamos tu Información"
          body="Usamos tu información para: administrar tu cuenta, facilitar intercambios, enviarte notificaciones, confirmar tu cuenta y mejorar la plataforma. No usamos tu información para publicidad de terceros."
        />

        <Section
          title="13. Qué Compartimos"
          body="Tu usuario y foto son visibles para otros usuarios. Tu correo nunca es visible. No vendemos tu información. Compartimos datos limitados con Supabase (base de datos), Vercel (alojamiento) y Resend (correos), solo para operar el servicio."
        />

        <Section
          title="14. Tus Derechos (LFPDPPP)"
          body="Conforme a la Ley Federal de Protección de Datos Personales, tienes derecho de Acceso, Rectificación, Cancelación y Oposición (derechos ARCO). Escríbenos a: juliocmorales@gmail.com — Respondemos en máximo 20 días hábiles."
        />

        <Section
          title="15. Eliminación de Cuenta"
          body="Al eliminar tu cuenta, tu perfil deja de ser visible. Conservamos algunos datos por obligaciones legales hasta 3 años."
        />

        <Section
          title="16. Cookies"
          body="Solo usamos cookies esenciales para tu sesión. No usamos cookies publicitarias ni de seguimiento."
        />

        <Section
          title="17. Menores de Edad"
          body="Trueke.app no está dirigida a menores de 18 años."
        />

        <Section
          title="18. Contacto"
          body={"Email: juliocmorales@gmail.com\nSitio: www.trueke.app"}
        />

        <div style={s.divider} />

        <p style={s.footer}>Trueke.app — Monterrey, Nuevo León, México</p>

      </div>
    </div>
  )
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 style={s.sectionTitle}>{title}</h3>
      <p style={s.body}>{body}</p>
    </div>
  )
}

const s: any = {
  container: {
    background: '#FDF8F3',
    minHeight: '100vh',
    paddingBottom: 60,
  },

  header: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    background: '#FDF8F3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid #F0EAE0',
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
    fontSize: 16,
    fontWeight: 700,
    color: '#1A2744',
  },

  content: {
    padding: 20,
  },

  mainTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#F97316',
    marginTop: 32,
    marginBottom: 8,
  },

  meta: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 16,
    marginTop: -4,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1A2744',
    marginTop: 20,
    marginBottom: 4,
  },

  body: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 1.7,
    margin: 0,
    whiteSpace: 'pre-line',
  },

  divider: {
    border: 'none',
    borderTop: '1px solid #F0EAE0',
    marginTop: 32,
    marginBottom: 8,
  },

  footer: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 24,
  },
}
