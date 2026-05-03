# 🧠 CONTEXTO DEL PROYECTO: TRUEKE
> Pega este archivo al inicio de cada sesión con Claude o Claude Code para mantener el contexto completo.
> Última actualización: 29 Abril 2026

---

## 🧩 ¿Qué es Trueke?

Trueke es una app web de intercambio de objetos entre usuarios donde las personas pueden:
1. Publicar artículos para intercambiar directamente (trueque simple)
2. Participar en **cadenas de intercambio** inspiradas en el caso del "clip rojo" — convertir un objeto en algo mejor a través de múltiples intercambios

> El insight clave: la app no vende intercambio, **vende historias que la gente quiere presumir**.

---

## 🎯 Filosofía del producto

| ❌ Lo que NO es | ✅ Lo que SÍ es |
|---|---|
| Marketplace tradicional | Motor de historias virales |
| Centrado en precios | Centrado en progreso y logros |
| Transaccional | Aspiracional y social |
| Publicidad como modelo | Confianza como producto |

---

## 🚨 Decisiones de diseño inamovibles

### 1. Sin valores monetarios — en ningún lado
- Nunca mostrar precios ni valores estimados
- Ni en tarjetas, ni en perfiles, ni en cadenas
- Convierte el trueque en transacción → destruye la magia

### 2. Privacidad en cadenas de intercambio
Las tarjetas compartibles solo muestran:
- ✅ Objeto inicial, objeto final, número de intercambios, días
- ✅ Nombre del usuario (solo si activó el toggle)
- ❌ Nunca items intermedios, otros usuarios, ubicaciones, fotos reales, valores monetarios

### 3. Confianza como sistema central (desde MVP)
- Verificación por teléfono obligatoria al registrarse
- Foto de perfil obligatoria
- Calificación obligatoria después de cada intercambio
- Botón de reportar usuario en menú "..." del chat
- Score de confianza visible en perfil y en chat

### 4. Consistencia visual — nunca romper esto
- **Color primario: naranja #E8642C** → todas las acciones principales
- Fondo: beige/crema #FDF8F3 | Texto principal: navy #1A2744
- El CTA principal SIEMPRE es naranja — nunca navy, nunca gris
- Pills de estado por color: amber=pendiente, verde=aceptado/completado, rojo=rechazado

### 5. Flujo de oferta — reglas importantes
- El chat SIEMPRE está vinculado a una oferta específica (offer_id)
- Para iniciar un chat el usuario DEBE seleccionar qué item ofrece a cambio
- No se puede chatear sin hacer una oferta formal
- Cada chat muestra: item A por item B + barra de progreso + score de confianza
- El menú "..." del chat incluye "Reportar usuario"

---

## 🖥️ Stack tecnológico

- **Next.js 16.2.4** + TypeScript + React 19.2.4
- CSS Modules por pantalla + globals.css
- **Supabase**: PostgreSQL + Auth OTP + Storage + Realtime
- Cliente Supabase en `app/lib/supabase.js`
- **GitHub Codespaces** — repositorio: `barter-app/trueke-app`, branch: `ui/navbar-refactor`
- **Claude Code v2.1.123** instalado y autenticado en Codespaces

---

## 🗄️ Tablas de Supabase (todas con RLS activado)

| Tabla | Columnas clave | Notas |
|---|---|---|
| `profiles` | id (uuid), username, avatar_url, city | id = auth.users.id |
| `items` | id (bigint), title, description, wanted, city, user_id (uuid), images (jsonb) | user_id ya es uuid |
| `offers` | id (bigint), from_user_id (uuid), to_user_id (uuid), status, created_at | |
| `offer_items` | id (bigint), offer_id → offers | |
| `messages` | id (bigint), sender_id (uuid), receiver (uuid), text, offer_id (uuid), is_read | offer_id agregado hoy |
| `exchanges` | id (bigint), item_id, message, status, created_at | |
| `ratings` | id (uuid), offer_id, rater_id, rated_id, score (1-5), comment | NUEVA |
| `chains` | id (bigint), creator_id, initial_item_id, goal_description, status, steps_count, show_name | NUEVA |
| `chain_steps` | id (bigint), chain_id, step_number, item_id, from_user_id, to_user_id, offer_id | NUEVA |

**Usuarios de prueba:**
- Julio: julio.morales@elnorte.com → UUID: `93f2cc3e-0a5d-4ed6-9aff-07ac6f0bc7a1`
- Armajulion: armajulion@hotmail.com → UUID: `3db90ec2-fdd6-4edd-97e9-7136d79b4be2`

**Storage:** buckets `images` y `avatars` (ambos PUBLIC)
**Twilio:** NO configurado aún — SMS no funciona, pendiente

---

## 📁 Estructura de archivos actual

```
trueke-app/app/
├── onboarding/page.tsx       ✅ Registro OTP 5 pasos
├── login/page.tsx            ✅ Login OTP
├── page.tsx                  ✅ Inicio/Home
├── crear/page.tsx            ✅ Crear publicación (hasta 5 fotos)
├── item/[id]/page.tsx        ✅ Detalle de item
├── intercambios/page.tsx     ⏳ Existe pero sin datos reales
├── perfil/page.tsx           ✅ Perfil usuario
├── perfil/edit/page.tsx      ✅ Editar perfil
├── mensajes/page.tsx         ✅ Lista conversaciones
├── mensajes/[userId]/        ✅ Chat con Realtime (vinculado a offer_id)
├── offer/new/page.tsx        ✅ ¿Qué ofreces a cambio?
├── exchange/[id]/page.tsx    ✅ Detalle del intercambio
├── chain/[id]/page.tsx       ⏳ Detalle de cadena (pendiente)
└── lib/supabase.js           ✅ Cliente Supabase
```

---

## ✅ Pantallas completadas

| Pantalla | Notas |
|---|---|
| Inicio / Home | Tarjetas cuadradas, ícono mensajes en header, cadenas con ? en intermedios |
| Crear publicación | Hasta 5 fotos, sube a Supabase Storage |
| Detalle de item | Carrusel fotos, botón "Enviar mensaje" → /offer/new |
| ¿Qué ofreces a cambio? | Radio buttons naranja, estado vacío si no tiene items |
| Chat por oferta | Vinculado a offer_id, contexto visible, score confianza, "+" adjuntar, reportar usuario |
| Detalle del intercambio | Lógica dual simple/cadena, aceptar/rechazar solo al receptor |

---

## ⏳ Pendiente MVP — en orden de prioridad

1. **Fix "Ver detalle ›" en chat** — apunta a /item en lugar de /exchange/[offerId]
2. **Mis intercambios** — conectar a datos reales de offers (tabs: Activos/Completados/Cancelados)
3. **Confirmar punto de encuentro** — pantalla de mapa para acordar dónde se encuentran
4. **Calificación post-intercambio** — pantalla de rating obligatoria al completar
5. **Twilio** — configurar para SMS reales
6. **Cadenas** — flujo completo: crear, seguir progreso, generar tarjeta compartible

---

## 📲 Tarjetas compartibles — 3 versiones aprobadas

| V1 Minimalista | V2 Aspiracional | V3 Story |
|---|---|---|
| WhatsApp/Telegram | Instagram Feed/Facebook | Instagram Stories/TikTok |

CTA fijo en todas: **"Crea tu historia en Trueke"**

---

## 🚀 Lanzamiento

- Ciudad inicial: Monterrey, México
- Meta: 50 usuarios reales antes de lanzamiento público
- Canal: grupos Facebook trueque, WhatsApp, contactos personales

---

## 💡 Cómo usar este archivo

Al iniciar sesión nueva:
> "Estoy trabajando en Trueke. Aquí está el contexto:"
> [pegar este archivo]
> "Hoy quiero trabajar en: [tarea]"
