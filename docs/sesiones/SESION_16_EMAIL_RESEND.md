# Sesión 16 — Sistema de correo transaccional con Resend

> Fecha: 7–8 julio 2026
> Objetivo: dejar el envío de correos de Trueke funcionando con calidad de producción sobre Resend, con plantillas en React Email, reutilizable y seguro.
> Commit: `346fbbf` — `feat: sistema de correo transaccional con Resend + React Email` (branch `main`, pusheado a `origin/main`)

Este documento describe el estado del sistema de correo **tal como quedó al cierre de esta sesión**. Está pensado para que cualquier desarrollador (o una sesión futura de Claude Code) entienda la arquitectura sin tener que leer el historial del chat.

---

## 1. Resumen ejecutivo

Antes de esta sesión, Trueke no enviaba ningún correo transaccional propio — solo dependía de los correos nativos de Supabase Auth (confirmación, magic link, reset de contraseña), que ya usaban Resend como SMTP por configuración previa de Supabase (no de este código).

En esta sesión se construyó, de cero y en dos iteraciones, un sistema propio de correo transaccional:

1. **Iteración 1** — integración funcional mínima: SDK de Resend, una utilidad `sendEmail()`, HTML inline, enganchado al endpoint de notificaciones existente.
2. **Iteración 2** (auditoría + refactor a producción) — se reemplazó el HTML inline por plantillas tipadas en **React Email**, se añadió idempotencia automática, reintentos con backoff, logging estructurado, validación de variables de entorno, y se cerró un hueco de autorización que la iteración 1 había dejado abierto.

El resultado final es el que queda documentado en las secciones siguientes.

---

## 2. Infraestructura externa (prerrequisito, configurada *antes* de esta sesión)

Esto **no se hizo en esta sesión** — se documenta porque es el prerrequisito sin el cual nada de lo demás funciona. Según el contexto que el usuario aportó al iniciar la sesión y lo que ya figuraba en `CONTEXTO.md`:

| Componente | Estado según contexto previo | Fuente |
|---|---|---|
| Dominio `trueke.app` | Comprado y apuntando a Vercel | `CONTEXTO.md` |
| Verificación de dominio en Resend | ✅ Verificado (SPF/DKIM configurados) | Mensaje inicial del usuario + `CONTEXTO.md` ("SMTP verificado ✅") |
| Registros DNS (Namecheap) | Se asume configurados para que Resend pueda enviar en nombre de `trueke.app` (SPF, DKIM, y probablemente MX si hay buzón real en Namecheap Private Email / Gmail) | No verificado desde este código — no hay forma de comprobar DNS desde el repo |
| `RESEND_API_KEY` en Vercel | Ya existía | Mensaje inicial del usuario |
| `RESEND_FROM` en Vercel | Ya existía, valor `hola@trueke.app` | Mensaje inicial del usuario |
| Supabase Auth SMTP | Configurado para usar Resend (fuera de este repo, en el dashboard de Supabase) | `CONTEXTO.md` |

**⚠️ Inconsistencia detectada, no resuelta:** `CONTEXTO.md` dice que los correos de Supabase Auth salen "desde `noreply@trueke.app`", pero el `RESEND_FROM` que el usuario indicó en esta sesión es `hola@trueke.app`. No se verificó cuál de las dos direcciones está realmente verificada como remitente en Resend, ni si ambas lo están. **Antes de confiar en producción, verificar en el dashboard de Resend qué remitentes están autorizados para el dominio.**

No se tocó ninguna configuración de Namecheap, DNS, Gmail ni el dashboard de Resend/Supabase durante esta sesión — todo el trabajo fue código dentro del repo `trueke-app`.

---

## 3. Arquitectura implementada

Tres capas, cada una con una única responsabilidad:

```
┌─────────────────────────────────────────────────────────────┐
│  PLANTILLAS — app/emails/                                    │
│  Componentes React Email. No saben nada de Resend ni de la   │
│  base de datos. Reciben props tipadas y devuelven JSX.       │
└─────────────────────────────────────────────────────────────┘
                          ▲
                          │ import
┌─────────────────────────────────────────────────────────────┐
│  ORQUESTACIÓN — app/lib/notificationEmail.tsx                │
│  Sabe qué plantilla corresponde a cada tipo de notificación   │
│  (via registry.ts), busca el email del destinatario en        │
│  Supabase Auth, arma el CTA y llama a sendEmail().            │
└─────────────────────────────────────────────────────────────┘
                          ▲
                          │ import
┌─────────────────────────────────────────────────────────────┐
│  TRANSPORTE — app/lib/email.ts                                │
│  ÚNICA función que llama al SDK de Resend. Valida env vars,   │
│  genera idempotencyKey, reintenta con backoff, loguea.        │
└─────────────────────────────────────────────────────────────┘
                          ▲
                          │ import
┌─────────────────────────────────────────────────────────────┐
│  RUTAS API — app/api/notifications/create,                    │
│              app/api/email/test                               │
│  Autentican al caller (app/lib/apiAuth.ts), validan el         │
│  payload, y delegan todo lo anterior.                          │
└─────────────────────────────────────────────────────────────┘
```

Regla de oro: **nada fuera de `app/lib/email.ts` llama al SDK de Resend directamente.** Si en el futuro se agrega un nuevo tipo de correo, el patrón es: crear el componente en `app/emails/`, registrarlo en `registry.ts`, y listo — no hay que tocar `email.ts`.

---

## 4. Archivos creados

### Plantillas — `app/emails/`

| Archivo | Rol |
|---|---|
| `EmailLayout.tsx` | Shell compartido por todos los correos: `<Html>`, `<Body>`, contenedor blanco redondeado, barra de color de acento arriba, fondo beige `#FDF8F3` (paleta de marca). |
| `EmailHeader.tsx` | Logo de Trueke (`/images/logo.png`) centrado. |
| `EmailFooter.tsx` | Línea divisoria, link a `trueke.app`, copyright con año dinámico. |
| `EmailButton.tsx` | Botón CTA naranja `#F97316`, `border-radius: 12px` (igual que los botones CTA del resto de la app), usa el componente `Button` de `@react-email/components` para que también se vea bien en Outlook (que no soporta `border-radius` en `<a>` sin VML — react-email lo resuelve). |
| `textStyles.ts` | Estilos de heading/texto compartidos por las 5 plantillas, para no repetirlos. |
| `notifications/shared.ts` | Tipo `NotificationEmailProps { title, body, ctaUrl }`, común a las 5 plantillas de notificación. |
| `notifications/OfferReceived.tsx` | Correo de "nueva oferta recibida". Acento naranja `#F97316`. CTA: "Ver oferta". |
| `notifications/OfferAccepted.tsx` | Correo de "oferta aceptada". Acento verde `#16A34A`. CTA: "Ver intercambio". |
| `notifications/OfferRejected.tsx` | Correo de "oferta rechazada". Acento rojo `#DC2626`. CTA: "Ver mis intercambios". |
| `notifications/OfferCompleted.tsx` | Correo de "intercambio completado". Acento azul `#2563EB`. CTA: "Ver intercambio". |
| `notifications/RatingReceived.tsx` | Correo de "nueva valoración recibida". Acento ámbar `#F59E0B`. CTA: "Ver mi reseña". |
| `notifications/TestEmail.tsx` | Plantilla genérica usada solo por el endpoint de pruebas cuando no se pide un tipo específico. |
| `registry.ts` | Mapa `NotificationEmailType → { Component, path }` + `buildNotificationCtaUrl()` + type guard `isNotificationEmailType()`. Es la fuente de verdad que conecta "tipo de notificación" con "qué plantilla renderizar y a qué URL debe apuntar el botón". |

Los colores de acento de cada plantilla **no son arbitrarios**: son exactamente los mismos que usa `app/notificaciones/NotificacionesClient.tsx` (`TYPE_BG`) para las tarjetas de notificación in-app, así el correo y la notificación dentro de la app se ven como el mismo sistema visual.

Cada plantilla exporta `Component.PreviewProps` con datos de ejemplo (convención estándar de React Email) — esto es lo que permite previsualizarlas sin tener que llamar a la API real (ver sección 8).

### Lógica — `app/lib/`

| Archivo | Rol |
|---|---|
| `email.ts` | `sendEmail({ to, subject, react, type?, idempotencyKey? })`. Única puerta de entrada a Resend. Ver detalle en sección 6. |
| `emailLogger.ts` | `logEmailEvent()` — logging estructurado (`console.log`/`console.error` con JSON) con el email del destinatario enmascarado (ej. `j***@gmail.com`), nunca en texto plano completo. |
| `apiAuth.ts` | `requireUser(req)` (resuelve el usuario autenticado a partir del header `Authorization: Bearer`) y `adminClient()` (cliente Supabase con `SERVICE_ROLE_KEY`). Antes esta lógica estaba duplicada línea por línea en dos rutas API distintas. |
| `notificationEmail.tsx` | `sendNotificationEmail({ userId, type, title, body, offerId })`. Busca el email del destinatario vía `adminClient().auth.admin.getUserById()`, resuelve la plantilla en `registry.ts`, arma el CTA y llama a `sendEmail()`. Es *best-effort*: si falla, no lanza (el caller decide si loguear). |

### Rutas API

| Archivo | Rol |
|---|---|
| `app/api/email/test/route.tsx` | `POST /api/email/test?type=<tipo>`. Envía un correo de prueba **solo a la cuenta del usuario autenticado** (no es un relay abierto). Sin `type`, o con un valor desconocido, envía `TestEmail` genérico. |

---

## 5. Archivos modificados

| Archivo | Cambio |
|---|---|
| `app/api/notifications/create/route.ts` | Reemplaza el boilerplate de auth por `requireUser`/`adminClient` de `apiAuth.ts`. Agrega una verificación de autorización nueva (ver sección 7, punto 4). Después de insertar la notificación in-app, llama a `sendNotificationEmail(...)` dentro de un `try/catch` que no bloquea la respuesta si el correo falla. |
| `package.json` | Nuevas dependencias (ver sección 9) + script `email:dev`. |

## 6. Archivos eliminados

| Archivo | Motivo |
|---|---|
| `app/lib/emailTemplates.ts` | Era la implementación de la iteración 1 (HTML como *template literal*). Reemplazado íntegramente por `app/emails/`. Nunca llegó a commitearse por separado — se creó y se eliminó dentro de la misma sesión, así que no aparece como "delete" en el historial de git. |
| `app/api/email/test/route.ts` (el `.ts` original) | Reemplazado por `route.tsx` porque la versión nueva usa JSX directamente en la ruta. |

---

## 7. Decisiones de diseño (y el porqué)

1. **React Email en vez de HTML en template literals.** La versión inicial interpolaba `title`/`body` directamente en un string HTML sin escapar — cualquier caller que lograra inyectar `<` en esos campos rompía el correo o, en el peor caso, inyectaba markup. React Email escapa automáticamente y da tipado a las props.

2. **`sendEmail()` como única puerta de entrada.** Ninguna ruta ni componente llama a `new Resend(...)` directamente. Esto hace que el logging, los reintentos y la idempotencia sean automáticos para todo correo futuro, sin que cada desarrollador tenga que acordarse de implementarlos.

3. **Idempotencia siempre presente, nunca opcional en la llamada real a Resend.** Si el caller no pasa `idempotencyKey`, `sendEmail()` deriva una determinística con SHA-256 a partir de `to + subject + props del componente React` — y esas props ya contienen la identidad real del evento (tipo de notificación, `offerId`, etc., porque son las mismas props que arma `notificationEmail.tsx`). Así, si Vercel reintenta la función serverless (timeout, cold start, etc.), el segundo intento genera la misma clave y Resend deduplica en su lado — no se manda el correo dos veces.

   **Excepción deliberada:** `/api/email/test` pasa una `idempotencyKey` aleatoria (`crypto.randomUUID()`) en cada llamada, porque un test manual *sí* debe reenviar el correo cada vez que el desarrollador lo pide — no es un reintento de la misma operación, es una acción nueva cada vez.

4. **Verificación de autorización por oferta en `/api/notifications/create`.** Antes de esta sesión, cualquier usuario autenticado podía llamar a este endpoint con `userId` de un tercero y `title`/`body` arbitrarios (solo limitados en longitud), y el sistema le creaba una notificación in-app a esa persona. Era molesto pero contenido. Al engancharle un correo real, ese mismo hueco se convertía en **spam por email desde un dominio verificado** hacia cualquier usuario de la plataforma. Se agregó `isOfferParticipant()`: antes de insertar la notificación, se verifica que tanto el caller como el `userId` destino sean `from_user_id`/`to_user_id` de la oferta indicada. Los tres call sites existentes (`offer/new`, `ExchangeClient`, `RatingClient`) ya pasaban `offerId` en todos los casos, así que este chequeo no rompe ningún flujo legítimo.

5. **Reintentos solo para errores transitorios.** `RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}`, máximo 3 intentos, backoff exponencial (`300ms, 600ms, 1200ms` + jitter aleatorio). Errores de validación (API key inválida, dominio no verificado, campo faltante) no se reintentan — fallan inmediato porque reintentar no los va a arreglar.

6. **Validación de env vars con excepción explícita.** `assertEnv('RESEND_API_KEY' | 'RESEND_FROM')` lanza un `Error` con mensaje claro si falta la variable, en vez de devolver un objeto de error silencioso como hacía la iteración 1. Se valida de forma perezosa (al primer envío), no en el arranque del proceso, para no romper rutas/páginas que no envían correo si por alguna razón las env vars no están disponibles en ese contexto.

7. **Logging enmascarado.** `emailLogger.ts` nunca escribe una dirección de correo completa en los logs (`j***@dominio.com`), ni la API key. Sí registra tipo de correo, éxito/error, `messageId` de Resend, duración en ms y número de intento — suficiente para debuggear sin exponer PII en logs de Vercel.

8. **Endpoint de prueba restringido a la propia cuenta.** `/api/email/test` nunca acepta un `to` arbitrario en el body — siempre usa el email del usuario autenticado (`requireUser(req)`). Evita que se use como relay de spam hacia terceros.

9. **`PreviewProps` en cada plantilla — arquitectura lista para previsualización sin instalar nada extra.** Es la convención estándar de React Email: cada componente expone datos de ejemplo como propiedad estática. Dado que ya se instaló `react-email` (ver sección 9) como devDependency, `npm run email:dev` levanta el visor local inmediatamente. Si en algún momento se decide no mantener esa dependencia, el patrón de `PreviewProps` sigue siendo válido y no hay que tocar las plantillas para reinstalarla.

10. **No se tocaron los correos de Supabase Auth (confirmación, magic link, reset password).** Deliberado — el usuario pidió explícitamente no romper ese flujo en esta sesión. La arquitectura (`registry.ts` + `sendEmail()` genérico) ya está preparada para que, el día que se decida reemplazarlos, solo haga falta crear los componentes nuevos y una función `sendAuthEmail()` análoga a `sendNotificationEmail()` — sin tocar `email.ts`. No se crearon archivos de plantilla "por si acaso" para esto, para no dejar código muerto sin usar.

---

## 8. Problemas encontrados y soluciones aplicadas

| # | Problema | Solución |
|---|---|---|
| 1 | HTML sin escapar interpolado directamente en template literals (riesgo de inyección). | Migración completa a componentes React Email. |
| 2 | Boilerplate de autenticación (`anonClient` + `getUser(token)`) duplicado línea por línea en dos rutas API. | Extraído a `requireUser()` en `apiAuth.ts`. |
| 3 | `sendEmail()` fallaba en silencio (devolvía un objeto de error falso) si faltaba `RESEND_API_KEY`. | `assertEnv()` lanza un `Error` explícito. |
| 4 | Cero resiliencia ante errores transitorios de Resend (429/5xx). | Backoff exponencial con jitter, máx. 3 intentos, solo para códigos retryable. |
| 5 | Riesgo de correos duplicados si Vercel reintenta la función serverless. | `idempotencyKey` siempre presente en la llamada a Resend (explícita o derivada automáticamente). |
| 6 | El resultado de `sendEmail()` se descartaba en el call site — imposible correlacionar un fallo con un `messageId` de Resend. | `sendEmail()` devuelve `{ success, messageId, error }` tipado; además queda logueado estructuradamente en cada intento. |
| 7 | Hueco de autorización: cualquier usuario podía notificar/emailear a cualquier otro. | Verificación `isOfferParticipant()` antes de insertar la notificación. |
| 8 | `/api/email/test` solo mandaba un correo genérico — no permitía validar cómo se veía cada plantilla real. | Se agregó `?type=<tipo>` que renderiza la plantilla real correspondiente con sus `PreviewProps`. |
| 9 | `npm run build` falla localmente en este Codespace con `Error: supabaseUrl is required` al prerenderizar `/_not-found`. | **Confirmado preexistente, no relacionado con el trabajo de esta sesión.** Se reprodujo el mismo error haciendo `git stash` de todos los cambios de email y corriendo `npm run build` sobre el `main` original — falla igual. Es porque este Codespace no tiene `.env.local` con las credenciales de Supabase (sí existen en Vercel). `npx tsc --noEmit` y `npm run lint` sí pasan limpio, y el build llega a compilar todo el código (incluidas las rutas de email) antes de fallar en el paso de generación estática. |

---

## 9. Dependencias agregadas

```json
// dependencies
"@react-email/components": "^1.0.12",
"@react-email/render": "^2.0.10",   // peer dependency de "resend" para usar la prop `react`
"resend": "^6.17.1",

// devDependencies
"react-email": "^6.6.8"             // CLI de previsualización, solo dev
```

Todas compatibles con React 19 (peer dependencies verificadas antes de instalar). El CLI `react-email` no afecta el bundle de producción (solo se usa a través de `npm run email:dev`).

npm reporta warnings de "deprecated" en varios subpaquetes de `@react-email/*` (`@react-email/text`, `@react-email/button`, etc.) — es un artefacto conocido de cómo React Email reorganizó sus paquetes internos; `@react-email/components` los re-exporta y siguen siendo la vía oficial recomendada. No requiere acción.

---

## 10. Variables de entorno requeridas

| Variable | Dónde debe existir | Usada por |
|---|---|---|
| `RESEND_API_KEY` | Vercel (ya configurada) | `app/lib/email.ts` |
| `RESEND_FROM` | Vercel (ya configurada, valor actual `hola@trueke.app` — ver inconsistencia en sección 2) | `app/lib/email.ts` |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel (ya configurada, preexistente) | `app/lib/apiAuth.ts`, `notificationEmail.tsx` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel (ya configurada, preexistente) | `app/lib/apiAuth.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (ya configurada, preexistente) | `app/lib/apiAuth.ts` (`adminClient`), usado para leer el email real del destinatario vía Auth Admin API |

Ninguna variable nueva de Supabase fue necesaria — el sistema de correo reutiliza las credenciales que ya usaba el resto de la app.

---

## 11. Cómo probar el envío de correos

**Requiere que la app esté desplegada en Vercel** (o corriendo localmente con un `.env.local` que tenga las 5 variables de la tabla anterior) — este Codespace no tiene esas credenciales, así que no se pudo hacer un envío real durante esta sesión.

### A. Probar cada plantilla real, en tu propia cuenta

Con sesión iniciada en la app (desde la consola del navegador, o cualquier cliente HTTP):

```js
const { data: { session } } = await supabase.auth.getSession()
const headers = { Authorization: `Bearer ${session.access_token}` }

// Correo genérico de conectividad
await fetch('/api/email/test', { method: 'POST', headers })

// Cualquiera de los 5 tipos reales, con datos de ejemplo (PreviewProps)
await fetch('/api/email/test?type=offer_received',  { method: 'POST', headers })
await fetch('/api/email/test?type=offer_accepted',  { method: 'POST', headers })
await fetch('/api/email/test?type=offer_rejected',  { method: 'POST', headers })
await fetch('/api/email/test?type=offer_completed', { method: 'POST', headers })
await fetch('/api/email/test?type=rating_received', { method: 'POST', headers })
```

Cada llamada responde `{ ok: true, messageId: "..." }` si Resend aceptó el envío, o `{ error: "..." }` si falló (revisar los logs de la función en Vercel para el detalle — quedan con el prefijo `[email]`).

### B. Probar el flujo real end-to-end

Disparar cualquiera de estas acciones en la app y verificar que el correo llegue junto con la notificación in-app:
- Hacer una oferta sobre un ítem ajeno → `offer_received` al dueño del ítem.
- Aceptar/rechazar una oferta → `offer_accepted`/`offer_rejected` al que la envió.
- Completar un intercambio → `offer_completed` a ambas partes.
- Calificar a alguien después de un intercambio → `rating_received` a la persona calificada.

### C. Previsualizar plantillas sin enviar nada (desarrollo local)

```bash
npm run email:dev
```

Levanta el visor de React Email apuntando a `app/emails`, con hot reload — usa los `PreviewProps` de cada componente, no requiere `RESEND_API_KEY` ni conexión a Supabase.

---

## 12. Pendientes futuros / riesgos abiertos

- **No verificado en un inbox real.** Nunca se envió un correo de verdad durante esta sesión (sin credenciales en este entorno). Falta confirmar visualmente en Gmail y Outlook (web + apps móviles) que el layout se ve bien — el diseño usa los componentes de `@react-email/components`, que están pensados para eso, pero no hay sustituto de verlo en un cliente real.
- **Resolver la inconsistencia `hola@trueke.app` vs `noreply@trueke.app`** (sección 2) — confirmar en el dashboard de Resend qué remitente(s) están realmente verificados.
- **Correos de Supabase Auth sin migrar.** Confirmación de registro, magic link y reset de password siguen usando las plantillas nativas de Supabase (configuradas en su dashboard, fuera de este repo). La arquitectura ya está lista para migrarlos (ver decisión 10) pero no se hizo en esta sesión.
- **Plantillas con datos limitados.** Hoy los correos de notificación solo reciben `title`/`body` (los mismos strings que se muestran en la notificación in-app) — no reciben el nombre del ítem, el nombre de la otra persona, etc. Para correos más ricos, habría que modificar los 3 call sites (`app/offer/new/page.tsx`, `app/exchange/[id]/ExchangeClient.tsx`, `app/rating/[offerId]/RatingClient.tsx`) para pasar datos estructurados en vez de texto ya formateado.
- **Sin manejo de bounces/quejas.** No hay webhook de Resend (`email.bounced`, `email.complained`) — si una dirección empieza a rebotar, el sistema seguirá intentando enviarle indefinidamente. Recomendado para una futura sesión si el volumen de correos crece.
- **`app/lib/notifications.ts` (archivo preexistente, no tocado).** Es un helper `createNotification()` con service role que no tiene ningún importador en todo el repo (código muerto detectado durante la auditoría, pero fuera del alcance de esta sesión porque no está relacionado con el sistema de correo). Queda como candidato a limpieza en una sesión futura.

---

## 13. Verificación de calidad ejecutada en esta sesión

| Chequeo | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ Sin errores |
| `npm run lint` | ✅ 257 problems (2 errores, 255 warnings) — **idéntico** al conteo en `main` antes de estos cambios (verificado con `git stash`); ninguno de los errores/warnings está en los archivos nuevos o modificados de esta sesión |
| `npm run build` | ⚠️ Compila y type-checka correctamente ("Compiled successfully", "Finished TypeScript"); falla después, en el paso de prerender de `/_not-found`, por falta de env vars de Supabase en este Codespace — **falla preexistente**, confirmada idéntica en `main` sin estos cambios |

---

## 14. Cómo continuar en una sesión futura

1. Si vas a agregar un nuevo tipo de correo transaccional (no ligado a `notifications`): crear el componente en `app/emails/`, seguir el patrón de `EmailLayout` + `PreviewProps`, y llamar a `sendEmail()` desde donde corresponda. No hace falta tocar `email.ts`.
2. Si vas a agregar un nuevo tipo de notificación in-app que también debe generar correo: agregarlo a `VALID_TYPES` en `app/api/notifications/create/route.ts`, crear la plantilla en `app/emails/notifications/`, y registrarla en `app/emails/registry.ts`.
3. Antes de dar por sentado que el correo "ya funciona en producción", verificar manualmente con los pasos de la sección 11 — esta sesión dejó el código listo pero **sin una prueba de envío real ejecutada**.
4. Revisar la inconsistencia de remitente (`hola@` vs `noreply@`) en el dashboard de Resend antes de comunicar a usuarios reales.
