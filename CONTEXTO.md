# 🧠 CONTEXTO DEL PROYECTO: TRUEKE
> Pega este archivo al inicio de cada sesión con Claude o Claude Code para mantener el contexto completo.
> Última actualización: 12 Mayo 2026 (sesión 9 — cierre completo)

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
- **Color primario: naranja #F97316** → todas las acciones principales (estandarizado — no usar #E8642C ni otros legacy)
- Fondo: beige/crema #FDF8F3 | Texto principal: navy #1A2744
- El CTA principal SIEMPRE es naranja — nunca navy, nunca gris
- Pills de estado por color: amber=pendiente, verde=aceptado/completado, rojo=rechazado
- **`border-radius` de botones CTA: 16px** — no usar 999px ni valores diferentes
- **BottomNav** se oculta en pantallas de flujo (meeting point) vía `hideNav` en `ClientLayout` — NO usar DOM hack `getElementById`
- **Flujo post-aceptación completo:** Exchange → Meeting point → Completado → Rating
- **Notificaciones** usan SVGs consistentes con routing por tipo: offer_received/accepted/completed → /mensajes/, offer_rejected → /intercambios, rating_received → /perfil/resenas
- **Mensaje de meeting point** es propuesta con confirmación por chat, no confirmación unilateral
- **Perfil:** logros removidos, reemplazados por "Mis cadenas". Stats usan datos reales (ratings query, items count)

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
- Admin client con SERVICE_ROLE_KEY en rutas API (bypasea RLS)
- **GitHub Codespaces** — repositorio: `juliocmorales-design/trueke-app`, branch: `ui/navbar-refactor`
- **Remote URL corregida:** `git@github.com:juliocmorales-design/trueke-app.git` (era `juliomorales-design` sin la c)
- **Claude Code v2.1.123** instalado y autenticado en Codespaces
- **Vercel** — dominio `trueke.app` conectado ✅ | deploy automático desde `ui/navbar-refactor`
- **Resend** — SMTP verificado ✅ | emails desde `noreply@trueke.app`
- **Logo:** `public/images/logo.png` (500×301 px, 65 KB) — trackeado en repo ✅

---

## 🗄️ Tablas de Supabase (todas con RLS activado)

| Tabla | Columnas clave | Notas |
|---|---|---|
| `profiles` | id (uuid), username, avatar_url, city | id = auth.users.id |
| `items` | id (bigint), title, description, wanted, city, user_id (uuid), images (jsonb), active (bool) | active agregado sesión 4 |
| `offers` | id (bigint), from_user_id (uuid), to_user_id (uuid), status, created_at, meeting_point, meeting_confirmed_at | meeting_point agregado |
| `offer_items` | id (bigint), offer_id → offers | |
| `messages` | id (bigint), sender_id (uuid), receiver (uuid), text, offer_id (uuid), is_read | |
| `exchanges` | id (bigint), item_id, message, status, created_at | |
| `ratings` | id (uuid), offer_id, rater_id, rated_id, score (1-5), comment | |
| `chains` | id (bigint), creator_id, initial_item_id, goal_description, status, steps_count, show_name | |
| `chain_steps` | id (bigint), chain_id, step_number, item_id, from_user_id, to_user_id, offer_id | |
| `notifications` | id, user_id, type, title, body, offer_id, is_read, created_at | NUEVA — usa admin client |
| `reports` | id, reporter_id (uuid), reported_id (uuid), offer_id (bigint), reason (text), created_at | NUEVA — RLS activado |

**Usuarios de prueba:**
- Julio: juliocmorales@gmail.com / `trueke123` → UUID: `15a54455-6f8b-4fc0-be30-832960e8c080`
- Armajulion: armajulion@hotmail.com / `trueke123` → UUID: `93f2cc3e-0a5d-4ed6-9aff-07ac6f0bc7a1`

**Estado actual de la BD (post sesión 9 completa):**
- **Offer activa id=23:** Julio ofrece Nintendo Switch (item 87) → Armajulion por Cámara Sony (item 78). Status: `pending`. `from_item_id=87`, `to_item_id=78`. También en `offer_items` (ids 20 y 21). Flujo end-to-end verificado.
- **20 items demo (IDs 78–101) con categorías asignadas:** `electronica`: 78, 80, 87–91 | `musica`: 79 | `deportes`: 81 | `libros`: 82 | `otros`: 92–101
- RLS activado en `notifications`. Avatar de Julio (zorro) en Storage.

**Storage:** buckets `images` y `avatars` (ambos PUBLIC)
**Auth:** Email + contraseña como método principal. Magic link como secundario. SMS/Twilio eliminado del onboarding.
**Supabase Auth:** Email templates personalizados ✅ | Redirect URLs de producción actualizados ✅ | SMTP via Resend ✅ (dominio verificado)

---

## 📁 Estructura de archivos actual

```
trueke-app/app/
├── auth/callback/page.tsx           ✅ Callback de Supabase Auth
├── auth/reset-password/page.tsx     ✅ Resetear contraseña
├── onboarding/page.tsx              ✅ Registro email+contraseña — 6 pasos (SMS eliminado, Step 6: contraseña)
├── login/page.tsx                   ✅ Email+contraseña (principal) + magic link (secundario)
├── page.tsx                         ✅ Inicio/Home
├── crear/page.tsx                   ✅ Crear publicación (hasta 5 fotos, botón "Publicar")
├── item/[id]/page.tsx               ✅ Detalle de item (carrusel con márgenes, owner stats con rating)
├── intercambios/page.tsx            ✅ Mis intercambios — tabs Activos/Completados/Cancelados
├── perfil/page.tsx                  ✅ Perfil usuario
├── perfil/edit/page.tsx             ✅ Editar perfil
├── perfil/publicaciones/page.tsx    ✅ Publicaciones del perfil
├── perfil/resenas/page.tsx          ✅ Reseñas del perfil
├── mensajes/page.tsx                ✅ Lista conversaciones (estilo cards beige)
├── mensajes/[userId]/               ✅ Chat con Realtime (ícono "..." vertical como SVG)
├── mensajes/oferta/[offerId]/       ✅ Redirect helper a chat por offerId
├── offer/new/page.tsx               ✅ ¿Qué ofreces a cambio?
├── exchange/[id]/page.tsx           ✅ Server component — fetches offer + items + profiles
├── exchange/[id]/ExchangeClient.tsx ✅ Client component — flujo completo post-aceptación
├── meeting/[offerId]/page.tsx       ✅ Acordar punto de encuentro
├── meeting/[offerId]/MeetingClient.tsx ✅
├── rating/[offerId]/page.tsx        ✅ Calificación post-intercambio
├── rating/[offerId]/RatingClient.tsx ✅
├── notificaciones/page.tsx          ✅ Centro de notificaciones
├── notificaciones/NotificacionesClient.tsx ✅
├── chain/[id]/page.tsx              ✅ Detalle de cadena
├── chain/[id]/ChainClient.tsx       ✅
├── api/notifications/create/        ✅ POST — inserta notificación con admin client
├── api/notifications/list/          ✅ GET — lista notificaciones del usuario
├── api/notifications/unread-count/  ✅ GET — conteo no leídas
├── buscar/page.tsx                  ✅ Pantalla de búsqueda con filtro ciudad + categoría + debounce
├── perfil/[userId]/page.tsx         ✅ Perfil público
├── api/chains/create/               ✅ POST — crea cadena (offerId opcional desde sesión 3)
├── api/chains/add-step/             ✅ POST — agrega paso a cadena existente
├── mis-cadenas/page.tsx             ✅ Mis cadenas — como creador y como participante
└── lib/
    ├── supabase.js                  ✅ Cliente Supabase (anon, con fallback ?? '' para build)
    └── notifications.ts             ✅ Helper createNotification con admin client
├── layout.tsx                       ✅ Server Component — exporta metadata, importa ClientLayout
└── components/layout/
    ├── ClientLayout.tsx             ✅ 'use client' — usePathname, auth init, hideNav, BottomNav
    └── BottomNav.tsx                ✅ Migrado de .js, centrado en desktop con maxWidth 500px
```

---

## ✅ Pantallas completadas

| Pantalla | Notas |
|---|---|
| Inicio / Home | Tarjetas cuadradas, ícono mensajes en header, cadenas. Buscador → navega a /buscar |
| Búsqueda | Grid 2 col, debounce 300ms, filtro chips ciudad, empty state SVG lupa, skeleton 3 cards |
| Crear publicación | Hasta 5 fotos, sube a Supabase Storage, botón "Publicar", requiere foto para activarse |
| Detalle de item | Carrusel con márgenes laterales, CTA "Ofrecer algo a cambio", owner stats con avg rating ("Nuevo" si sin calificaciones) |
| ¿Qué ofreces a cambio? | Radio buttons naranja, estado vacío si no tiene items |
| Detalle del intercambio | Footer dinámico: accepted→meeting+chat+completar, pending→aceptar/rechazar, resto→solo chat |
| Acordar punto de encuentro | BottomNav oculto, input fondo #F0EAE0, mensaje es propuesta con confirmación por chat, sender dinámico según usuario actual |
| Calificación post-intercambio | Se activa tras marcar "Ya hicimos el intercambio" desde ExchangeClient |
| Chat por oferta | Vinculado a offer_id, ícono "..." vertical SVG, reportar usuario |
| Lista de mensajes | Empty state: SVG campana, 2 líneas, color #1A2744, fontWeight 500 |
| Mis intercambios | Tabs Activos/Completados/**Rechazados**, fotos con borderRadius: 12, empty states con SVGs ✅ |
| Notificaciones | Empty state: SVG campana trazo fino #C4BAB1, texto mejorado. Cards con SVGs por tipo |
| Onboarding (6 pasos) | Step 0: fondo #FAF3ED ✅, 4 marcos SVG de Affinity con clipPath + stroke ✅ (pendiente verificar en dispositivo), paisaje de montaña decorativo abajo ✅. Flujo: nombre→email→contraseña→ciudad→intereses → signUp al final |
| Login | Email+contraseña principal, magic link como link de texto discreto (no botón), reset de contraseña vía Supabase |
| Perfil | Stats reales (ratings + items count), sin logros, con "Mis cadenas" y sub-páginas |
| Perfil público | /perfil/[userId] — Server Component, admin client, avatar + stats reales + items activos grid 2col + score de confianza |
| Mis cadenas | Lista como creador + participante, badge status, step count, CTA crear primera cadena |
| Calificación (modal cadena) | Tras guardar rating: opciones continuar cadena existente / iniciar nueva / terminar |

---

## 🔄 Flujo de oferta completo (estado actual)

```
item/[id] → "Ofrecer algo a cambio"
    ↓
offer/new?itemId=[id] → seleccionar item propio → insertar en offers + offer_items
    ↓
mensajes/[offerId] → chat en tiempo real
    ↓
exchange/[id] → detalle con footer dinámico:
  • pending   → to_user: Aceptar / Rechazar
  • accepted  → Acordar punto de encuentro + Ir al chat
              → (si meeting_point existe) ✓ Ya hicimos el intercambio (verde)
  • completed → solo Ir al chat
    ↓
meeting/[offerId] → guardar lugar, mensaje automático al chat
    ↓
"✓ Ya hicimos el intercambio" → status=completed → notifica a ambos → /rating/[offerId]
    ↓
rating/[offerId] → calificación 1-5 + comentario
```

---

## 🔔 Sistema de notificaciones

- **Tabla:** `notifications` con admin client (SERVICE_ROLE_KEY) para bypassear RLS
- **API routes:** `/api/notifications/create`, `/list`, `/unread-count`
- **Autenticación:** Bearer token verificado con `adminClient().auth.getUser(token)` en todos los endpoints (corregido sesión 6)
- **Triggers actuales:** offer_received (offer/new), offer_accepted, offer_rejected, offer_completed (ExchangeClient), rating_received (RatingClient)
- **Helper:** `app/lib/notifications.ts` → `createNotification({ user_id, type, title, body, offer_id })`

---

## ✅ Completado sesión 9

- **Score de confianza real** — reemplazado cálculo inventado por promedio de `ratings` en `perfil/page.tsx`, `exchange/[id]/page.tsx` y `mensajes/[userId]/page.tsx`
- **"Cerca de ti" filtra por ciudad** — query de items ahora usa `profile.city` del usuario; título dinámico
- **Tab "Rechazados"** — renombrado desde "Cancelados" en Mis intercambios; key y tipo actualizados
- **Categoría en crear item** — selector de chips, guardado en BD, vinculado al filtro de búsqueda
- **Perfil público `/perfil/[userId]`** — adminClient movido dentro de la función (Server Component correcto)
- **Build Vercel corregido** — repo apuntado a `trueke-app.git`, `supabase.js` con fallback `?? ''`
- **Item detail → perfil** — userRow con `onClick` y `cursor: pointer`
- **Ciudad pre-llenada en /crear** — useEffect carga `profile.city` al montar el formulario
- **Fecha relativa en cards del home** — helper `timeAgo()` muestra "hace X días/horas/min"
- **Perfil edit rediseñado** — sistema visual Trueke: header con back, avatar centrado, card inputs, campo ciudad agregado
- **BottomNav migrado a .tsx** — centrado en desktop con `position: fixed`, `left: 50%`, `maxWidth: 500`, `translateX(-50%)`
- **Código muerto eliminado** — `Header.tsx`, `Feed.tsx`, `FeedGrid.tsx`, `ItemCard.tsx` (components/feed/) + función `Achievement` de perfil/page.tsx
- **layout.tsx → Server Component** — exporta `metadata` de Next.js; lógica client separada en `ClientLayout.tsx`
- **20 items demo** en BD (IDs 78–101) con categorías, imágenes y datos realistas

### Cambios adicionales sesión 9

- **Home afinado** — avatar del dueño en cards (home y búsqueda), "Ver todo ›" en secciones, buscador fondo blanco con sombra, pin ubicación más prominente
- **Botones back estandarizados** — `polyline points="15 18 9 12 15 6"` 18×18 en toda la app (item, rating, perfil/edit, publicaciones, reseñas, buscar)
- **Tarjeta compartible V1 unificada** — botón "Compartir mi historia" eliminado; V1 integrada al inicio del modal "📤 Compartir"
- **Logo base64 en tarjeta compartible** — `logo.png` leído en Server Component y pasado como prop; funciona en las 3 versiones (V1/V2/V3) para que html2canvas lo capture
- **Botones circulares estandarizados** — exchange (chat SVG) y crear (back SVG) usan estilo circular `#F0EAE0` estándar
- **Emojis → SVGs en toda la app** — reemplazados en: exchange, intercambios, offer/new, mensajes/[userId], mensajes/oferta/[offerId], crear, perfil/publicaciones, item/[id], chain. Las categorías en chips de búsqueda/crear **conservan emojis** (decisión intencional de UX)
- **Home: badge "Nuevo"** — pill naranja en cards de la sección Recomendados para items recientes
- **Home: ícono mensajes en header** — SVG de sobre/chat reemplaza texto; navega a /mensajes
- **Botón "Compartir" unificado en chain/[id]** — un solo CTA que abre el modal con las 3 tarjetas compartibles

### Barrida general de bugs y calidad (sesión 9 — cierre)

- **Guards `.in()` con array vacío** — `page.tsx`, `intercambios/page.tsx`, `mensajes/page.tsx`: guard explícito antes de cada query `.in('id', [])` para evitar retorno de todos los registros
- **Score de confianza en chat** — `mensajes/[userId]/page.tsx`: reemplazado cálculo inventado (`items × 4 + 60`) por promedio real de tabla `ratings`; muestra "Nuevo" si no hay calificaciones
- **Reportar usuario guarda en BD** — `mensajes/[userId]/page.tsx` y `mensajes/oferta/[offerId]/page.tsx`: `handleReport` ahora inserta en tabla `reports` (`reporter_id`, `reported_id`, `offer_id`, `reason`). **Tabla `reports` creada en Supabase con RLS activado**
- **Empty states estandarizados** — `mensajes/page.tsx`: `<p>` plano reemplazado por SVG burbuja de chat + título + subtítulo, igual al patrón del resto de la app
- **SVGs reemplazando Unicode** — `⇄` y `✓` eliminados en `ExchangeClient.tsx` y `mensajes/page.tsx`; sustituidos por SVGs consistentes con el sistema de diseño
- **Toast auto-dismiss** — `perfil/page.tsx`: "Próximamente disponible" se cierra automáticamente a los 3 segundos
- **`router.push` en lugar de `window.location.href`** — `page.tsx` componente `Section`: navegación client-side sin recarga
- **StatusPill consistente** — `intercambios/page.tsx`: pill "Cancelado" → "Rechazado", igual que el tab
- **Sección "Recomendados" condicional** — `page.tsx`: se oculta si hay ≤6 items (evita header huérfano)
- **Username en lista de mensajes** — `mensajes/page.tsx`: select de profiles incluye `username`; fallback `name || username || 'Usuario'`

### Segundo análisis y fixes técnicos (sesión 9 — cierre)

- **Emoji 📍 eliminado de MeetingClient** — mensaje de propuesta de encuentro ya no contiene emoji; texto plano consistente con el resto de la app
- **`onAuthStateChange(() => {})` eliminado de ClientLayout** — suscripción vacía que no hacía nada; eliminada para no ocupar recursos innecesariamente
- **Dead code DOM hack eliminado de MeetingClient** — `useEffect` con `document.getElementById('bottom-nav')` eliminado; el elemento no tenía ese ID y el nav ya se oculta via `hideNav` en ClientLayout
- **`hideNav` simplificado en ClientLayout** — condiciones redundantes (`/offer` y `/mensajes/`) ya cubiertas por `isItemPage`; eliminadas del bloque `hideNav`
- **Validación username duplicado en `perfil/edit`** — `handleSave` ahora detecta error Postgres `23505` (unique constraint) y muestra mensaje amigable "Ese nombre de usuario ya está tomado. Elige otro." en lugar del error genérico
- **Aspect ratio cards home** — `cardImg` cambiado de `1/1` a `3/2` en `page.tsx`; cards más anchas, mejor para fotos horizontales
- **Sintaxis onClick toast corregida** — `perfil/page.tsx`: arrow functions en "Ayuda y soporte" y "Configuración" tenían `}}}` triple; corregido a `}}`
- **3 cadenas demo agregadas en BD** — IDs 21 (Armajulion, item 93, bicicleta eléctrica, 2 pasos), 22 (Julio, item 100, guitarra eléctrica, 1 paso), 23 (Armajulion, item 94, audio premium, 3 pasos)
- **Modal compartir chain** — botones `.downloadBtn` cambiados de `#1A2744` a `#F97316`; label "WHATSAPP / PNG" → "PNG PARA COMPARTIR"

## ⏳ Pendiente MVP — en orden de prioridad

1. **Onboarding Step 0** — rediseño en proceso con ChatGPT (CSS simple, sin SVG). 4 cards con fotos Unsplash placeholder, eslabones entre cards. Pendiente verificar en dispositivo.
2. **Tarjetas compartibles de cadena** — mockup actualizado aprobado, pendiente implementar en chain/[id]
3. **Push notifications** — PWA o web push para notificaciones en tiempo real

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
