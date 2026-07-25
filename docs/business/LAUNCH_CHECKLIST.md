# LAUNCH CHECKLIST

> Última actualización: 25 julio 2026 — creado en sesión de auditoría de lanzamiento (verificación directa sobre el código, no sobre lo documentado); revisado en la sesión de consistencia documental del mismo día.
> Fuentes leídas al crear este documento: `README.md`, `CONTEXTO.md`. En ese momento `docs/branding/PRODUCT_BOOK.md` y `docs/arquitectura/CADENAS_ARQUITECTURA.md` no existían todavía — se crearon después, en la misma fecha, y ya están incorporados como referencia cruzada donde corresponde.

## Objetivo

Este documento es la definición oficial de **"Launch Ready"** para Trueke: el único lugar donde se responde, con evidencia verificable y no con intención, la pregunta "¿podemos abrir Trueke a usuarios reales hoy?".

Reglas de este documento:
- Cada punto se marca únicamente con evidencia funcional encontrada en el código o en la documentación existente — nunca porque "debería estar" o porque existe un archivo con el nombre correcto.
- Si algo no se puede verificar desde el repositorio (infraestructura externa, decisiones de negocio, activos de marketing), se marca 🟡 y se indica qué falta para verificarlo, no se asume.
- Este documento se actualiza cada vez que cambie el estado real del producto — no es un documento de una sola sesión.

**Leyenda:**
- ✅ Completado y verificado
- ⚠️ Existe parcialmente o presenta una inconsistencia
- ❌ Falta implementar
- 🟡 Requiere una decisión del fundador (Julio)

---

# Criterios para lanzar

Checklist de alto nivel — verificado contra el código el 25 de julio de 2026, no asumido:

- ☑ El flujo completo funciona
- ☑ Registro
- ☑ Login
- ☑ Publicaciones
- ☑ Ofertas
- ☑ Chat
- ☑ Intercambio
- ☑ Calificaciones
- ☑ Cadenas
- ☑ Correos *(Gmail confirmado en producción; Outlook y móvil sin probar)*
- ☑ Sin errores críticos *(los 2 hallazgos de seguridad encontrados en la auditoría del 25 julio se corrigieron el mismo día — ver sección 2)*
- ☐ Landing terminada *(existe experiencia funcional para visitantes anónimos, no una landing de conversión dedicada)*
- ☐ Analytics funcionando *(no implementado — ningún paquete de analítica instalado)*
- ☑ Términos y privacidad publicados
- ☐ Beta testers completados *(solo existen 2 cuentas de prueba internas, ningún tester externo real)*
- ☐ Primera historia real documentada *(no existe ninguna — toda la actividad registrada es de cuentas de prueba)*

---

# 1. Producto

| Punto | Estado | Evidencia encontrada | Observaciones | Siguiente acción |
|---|---|---|---|---|
| Registro | ✅ | `app/onboarding/page.tsx` (3 pasos: email → contraseña → username+avatar), `api/auth/check-email`, `api/auth/check-username`, confirmación por correo vía Supabase Auth | El botón final de onboarding solo valida el `username`; el avatar/foto **no bloquea** el registro si se omite | Ver contradicción de política en "Riesgos" |
| Login | ✅ | `app/login/page.tsx` (email+contraseña principal, magic link secundario), `app/auth/reset-password`, `app/auth/callback` con timeout de 10s | — | Ninguna |
| Publicaciones | ✅ | `app/crear/page.tsx`, `app/item/[id]/editar/page.tsx`, `app/lib/compressImage.ts`, `app/components/ImageCropper.tsx` (recorte/rotación, `react-easy-crop`) | Hasta 5 fotos, compresión automática, límites de caracteres, desactivación de publicaciones | Ninguna |
| Ofertas | ✅ | `app/offer/new/page.tsx` — inserta en `offers` + `offer_items`, requiere seleccionar item propio | — | Ninguna |
| Chat | ✅ | `app/mensajes/[userId]/page.tsx` — Realtime, vinculado a `offer_id`, límite 1000 caracteres, reportar usuario | — | Ninguna |
| Intercambio | ✅ | `app/exchange/[id]/ExchangeClient.tsx` — guard de doble submit (`acting`), confirmación antes de rechazar/cancelar, guard de race condition en cancelación; `app/meeting/[offerId]/MeetingClient.tsx` | — | Ninguna |
| Calificaciones | ✅ | `app/rating/[offerId]/RatingClient.tsx` — 1-5 estrellas + comentario, guard que verifica que el usuario sea parte del intercambio | — | Ninguna |
| Cadenas | ✅ | `app/api/chains/create/route.ts`, `app/api/chains/add-step/route.ts`, `app/chain/[id]/ChainClient.tsx` — funcionalmente completas | Funcionan de extremo a extremo; el hueco de autorización en `chains/create` se corrigió el 25 julio 2026 (ver sección 2). El listado público `/cadenas` muestra siempre el username del creador — decisión de producto confirmada (Julio, 25 julio 2026), no un pendiente | Ninguna |
| Perfil | ✅ | `app/perfil/page.tsx`, `app/perfil/[userId]/page.tsx`, `app/perfil/edit/page.tsx` — stats reales (ratings, items), bio, validación de username/nombre | — | Ninguna |
| Notificaciones | ✅ | `app/api/notifications/list`, `app/api/notifications/unread-count`, `app/api/notifications/create` — protegidas con verificación de token, filtradas por `user_id` | `list` y `unread-count` reimplementan la verificación de token en línea en vez de usar `requireUser()` (duplicación, no vulnerabilidad) | Consolidar en `apiAuth.ts` cuando se toque este código de nuevo (no bloqueante) |
| Correos | ✅ | Ver sección 4 | — | Ver sección 4 |
| Compartir historias | ⚠️ | `app/chain/[id]/ChainClient.tsx` — captura con `html2canvas`, modal "Compartir cadena", botón "Compartir en Facebook" (V1 minimalista) | Solo existe la versión V1; V2 (aspiracional) y V3 (story) siguen sin implementar | 🟡 Decidir si V2/V3 son necesarias para el lanzamiento o post-lanzamiento |

---

# 2. Seguridad

| Punto | Estado | Evidencia encontrada | Observaciones | Siguiente acción |
|---|---|---|---|---|
| Autenticación | ✅ | Supabase Auth (email+contraseña, magic link); todas las rutas API sensibles verifican un token Bearer contra Supabase antes de operar | — | Ninguna |
| Autorización | ✅ (corregido) | `app/api/profiles/create/route.ts` y `app/api/chains/create/route.ts` — corregidos el 25 julio 2026 | **Antes:** `profiles/create` no verificaba autenticación (cualquiera podía sobrescribir el perfil de otro usuario conociendo su UUID); `chains/create` no verificaba que el caller fuera `from_user_id`/`to_user_id` de la oferta antes de derivar identidades. **Ahora:** `profiles/create` exige que el `id` coincida con el usuario autenticado cuando hay sesión, o (en el único caso legítimo sin sesión — signup recién hecho, correo sin confirmar) verifica contra la Admin API que el `id` es un usuario real y que su perfil no tiene ya un `username` asignado, para nunca sobrescribir uno reclamado. `chains/create` ahora usa `requireUser()`/`adminClient()` compartidos y devuelve 403 si el caller no es parte de la oferta. Validado con `tsc --noEmit` y `eslint` (0 errores en ambos archivos) | Ninguna |
| RLS | 🟡 | `CONTEXTO.md` afirma que todas las tablas tienen RLS activado; no hay migraciones ni SQL versionado en el repo que lo confirme | No verificable desde el código. La mayoría de rutas API usan el cliente service-role (bypassea RLS por diseño) — RLS solo protege las queries hechas directo desde componentes cliente (mensajes, items, chains, perfiles) | Julio: confirmar en el dashboard de Supabase que las políticas RLS activas coinciden con lo documentado |
| Validaciones | ⚠️ | `notifications/create` valida tipo contra `VALID_TYPES` y longitud máxima; `profiles/create` solo valida que `id`/`username` existan, sin formato ni longitud | Inconsistente entre rutas — no bloqueante, es un tema de calidad, no de seguridad (la autorización de estas rutas ya se corrigió, ver fila "Autorización") | Uniformar validación de formato/longitud entre rutas cuando se retome este código |
| Protección de APIs | ⚠️ | 8 rutas API en total; ninguna funciona como relay abierto hacia terceros | `profiles/create` y `chains/create` ya están protegidas (ver "Autorización"). Queda un hueco menor en `app/api/chains/add-step/route.ts`: autentica al caller pero no verifica que tenga alguna relación previa con la cadena antes de insertarlo como paso — cualquier usuario autenticado puede sumarse a cualquier cadena existente conociendo su `chainId`. No permite suplantar a otro usuario (siempre inserta al propio caller), es un problema de integridad del relato, no de identidad. Detalle completo en `docs/arquitectura/CADENAS_ARQUITECTURA.md` §4/§6 | No bloqueante para el lanzamiento — ver `docs/business/ROADMAP.md` Horizonte 2 |
| Variables de entorno | ✅ | `.env*` en `.gitignore`; ninguna clave commiteada; `app/lib/email.ts` valida con `assertEnv()` y falla explícito si falta `RESEND_API_KEY`/`RESEND_FROM` | — | Ninguna |

---

# 3. Analítica

| Punto | Estado | Evidencia encontrada | Observaciones | Siguiente acción |
|---|---|---|---|---|
| Google Analytics | ❌ | No está en `package.json` ni en `layout.tsx` | — | 🟡 Julio: decidir herramienta |
| PostHog | ❌ | No está en `package.json` | — | 🟡 Julio: decidir herramienta |
| Vercel Analytics | ❌ | No está en `package.json` (`@vercel/analytics` ausente) | — | 🟡 Julio: decidir herramienta |
| Eventos importantes | ❌ | Sin ningún sistema de tracking de eventos de producto (registro, oferta, intercambio completado, cadena creada) | — | Depende de la herramienta que se elija |
| Conversión | ❌ | Sin forma de medir visitante → registro → primer intercambio | — | Depende de la herramienta que se elija |
| Logs | ⚠️ | `app/lib/emailLogger.ts` registra envíos de correo de forma estructurada (con PII enmascarada) | El resto de la app usa `console.log`/`console.error` sueltos, sin agregación ni retención garantizada más allá de los logs de Vercel | Evaluar Sentry o Vercel Log Drains (ya listado como pendiente "V12" en `CONTEXTO.md`) |

---

# 4. Correos

| Punto | Estado | Evidencia encontrada | Observaciones | Siguiente acción |
|---|---|---|---|---|
| Resend | ✅ | `app/lib/email.ts` — única puerta de entrada al SDK, idempotencia, reintentos con backoff | — | Ninguna |
| React Email | ✅ | `app/emails/` — 6 plantillas (5 de notificación + test genérica), `PreviewProps`, `npm run email:dev` | — | Ninguna |
| Gmail | ✅ | Verificado en producción el 8 julio 2026 — 2 correos reales confirmados en bandeja de entrada por Julio (`docs/sesiones/SESION_16_EMAIL_RESEND.md`, sección 11.1) | — | Ninguna |
| Outlook | ❌ | No hay evidencia de ninguna prueba en Outlook (web o desktop) | — | Probar antes de lanzar si se espera una base de usuarios con correo corporativo/Outlook |
| Dominio | ✅ | `trueke.app` verificado (según contexto operativo previo, no verificable desde este repo) | — | Ninguna |
| Remitente | 🟡 Pendiente de decisión | `RESEND_FROM` configurado y usado en producción = `hola@trueke.app` (confirmado funcionando); `CONTEXTO.md` indica que los correos nativos de Supabase Auth salen de `noreply@trueke.app` | No es un error — es una inconsistencia de documentación/configuración entre dos remitentes distintos, ninguno confirmado explícitamente en el dashboard de Resend | Julio: revisar en el dashboard de Resend qué remitente(s) están verificados y unificar criterio |

---

# 5. Contenido

| Punto | Estado | Evidencia encontrada | Observaciones | Siguiente acción |
|---|---|---|---|---|
| Landing | ⚠️ | `app/page.tsx` — banner de propuesta de valor para visitantes anónimos ("Publica lo que tienes. Consigue lo que quieres.") + CTA "Únete gratis" | No es una landing de marketing dedicada (sin testimonios, sin sección "cómo funciona" fuera del onboarding, sin historias reales que mostrar todavía) | 🟡 Julio: decidir si se necesita una landing separada antes de invertir en marketing pago/orgánico |
| Brand Book | ❌ | `docs/branding/PRODUCT_BOOK.md` no existe | — | Crear si se necesita antes de producir material de marketing consistente |
| Historias | ⚠️ | El mecanismo existe (cadenas + tarjetas compartibles V1) | Cero historias reales documentadas — todo lo existente son datos demo | Depende directamente de tener beta testers reales (sección 8) |
| Copy | 🟡 | No verificable objetivamente desde el código | Requiere revisión editorial humana (tono, ortografía, consistencia) antes de exponerlo a usuarios reales/marketing | Julio: revisión de copy end-to-end |
| FAQ | ❌ | No existe ninguna página de preguntas frecuentes | — | 🟡 Julio: decidir si es necesaria antes de lanzar |
| Centro de ayuda | ❌ | "Ayuda y soporte" en `perfil/page.tsx` abre un `mailto:` directo, no un centro de ayuda | Suficiente para un lanzamiento pequeño (50 usuarios), insuficiente si crece | No bloqueante para lanzamiento inicial |

---

# 6. Legal

| Punto | Estado | Evidencia encontrada | Observaciones | Siguiente acción |
|---|---|---|---|---|
| Términos | ✅ | `app/terminos/page.tsx` — 18 secciones | — | Ninguna |
| Privacidad | ✅ | Incluida en la misma página ("Política de Privacidad") | — | Ninguna |
| Cookies | ⚠️ | Sección 16 de `/terminos` cubre el texto legal | No hay banner de consentimiento de cookies en la UI. Hoy no es crítico porque no hay analítica/cookies de terceros activas (sección 3); sí lo sería en cuanto se agregue una herramienta de analítica | Revisar con criterio legal al momento de instalar analítica |
| Contacto | ✅ | Sección 18 de `/terminos`, `truekeapp.com@gmail.com` | — | Ninguna |

---

# 7. Marketing

| Punto | Estado | Evidencia encontrada | Observaciones | Siguiente acción |
|---|---|---|---|---|
| Facebook | 🟡 | No verificable desde el código — activo de negocio externo | — | Julio: definir y ejecutar |
| Instagram | 🟡 | No verificable desde el código | — | Julio: definir y ejecutar |
| TikTok | 🟡 | No verificable desde el código | — | Julio: definir y ejecutar |
| LinkedIn | 🟡 | No verificable desde el código | Cuestionable si aplica a un producto peer-to-peer B2C — vale la pena que Julio confirme si es un canal relevante antes de invertir tiempo ahí | Julio: definir |
| Comunidad inicial | ✅ | `CONTEXTO.md` — ciudad inicial Monterrey, meta 50 usuarios reales, canales: grupos de Facebook de trueque, WhatsApp, contactos personales | Decisión ya tomada; falta ejecución, no definición | Ejecutar el plan ya definido |

---

# 8. Beta

| Punto | Estado | Evidencia encontrada | Observaciones | Siguiente acción |
|---|---|---|---|---|
| Usuarios de prueba | ✅ | 2 cuentas documentadas en `CONTEXTO.md` (Julio, Armajulion) con flujo end-to-end verificado | — | Ninguna |
| Usuarios demo | ✅ | 20 items demo (IDs 78–101), cadenas demo (IDs 19–23) | Mismos datos que "limpieza de datos" abajo | Ver siguiente fila |
| Limpieza de datos | ❌ | No hay evidencia de ningún proceso o script para retirar datos demo antes de invitar usuarios reales; según `CONTEXTO.md` siguen en la misma base de datos | Riesgo de que usuarios reales vean/interactúen con contenido ficticio | Definir y ejecutar limpieza antes de invitar tráfico real |
| Primera historia real | ❌ | No existe ninguna — toda la actividad documentada es de las 2 cuentas de prueba | Este es el producto central según `CONTEXTO.md` ("la app vende historias que la gente quiere presumir") | Depende de tener beta testers reales primero |
| Primer intercambio real | ❌ | El único intercambio end-to-end verificado (`offer id=23`) es entre las 2 cuentas de prueba, no usuarios externos | — | Depende de beta testers reales |
| Retroalimentación | ❌ | No existe ningún mecanismo en el producto para recolectar feedback (encuesta, NPS, formulario in-app) — solo el `mailto` de soporte | — | 🟡 Julio: decidir mecanismo (puede ser tan simple como preguntar directamente a los primeros 50) |

---

# 9. Operación

| Punto | Estado | Evidencia encontrada | Observaciones | Siguiente acción |
|---|---|---|---|---|
| Logs | ⚠️ | Ver sección 3, "Logs" | — | Ver sección 3 |
| Monitoreo | ❌ | Sin Sentry ni ningún servicio de error tracking (ya listado como pendiente "V12" en `CONTEXTO.md`) | — | Instalar antes de invitar tráfico real — sin esto, un error en producción se detecta por queja de usuario, no por datos |
| Recuperación | 🟡 | No verificable desde el repo — depende del plan/tier de Supabase y Vercel de Julio | — | Julio: confirmar política de backups del plan actual de Supabase |
| Backups | 🟡 | Mismo caso que "Recuperación" | — | Julio: confirmar |
| Soporte | ✅ | `mailto:truekeapp.com@gmail.com` funcional, visible en perfil y en términos | — | Ninguna |
| Reportes de errores | ⚠️ | Existe la tabla `reports` y el flujo "reportar usuario" en el chat — es reporte de **conducta entre usuarios**, no de errores técnicos de la plataforma | No hay ningún canal para que un usuario reporte un bug, ni monitoreo automático (ver Monitoreo) | No bloqueante para un lanzamiento de 50 usuarios; sí recomendable antes de escalar |

---

# Riesgos antes del lanzamiento

Solo riesgos reales, verificados en el código — no especulaciones:

1. ~~**`api/profiles/create` no requiere autenticación.**~~ **Corregido el 25 julio 2026.** Cualquiera que conociera el UUID de un usuario podía sobrescribir su perfil sin haber iniciado sesión. Ver detalle en sección 2, "Autorización".
2. ~~**`api/chains/create` no verifica que el caller sea parte de la oferta.**~~ **Corregido el 25 julio 2026.** Permitía atribuir un paso de cadena a la identidad de un tercero. Ver detalle en sección 2, "Autorización".
3. **Contradicción entre la política de confianza declarada y la implementación real.** `CONTEXTO.md` declara como "decisión de diseño inamovible" que la verificación por teléfono y la foto de perfil son obligatorias al registrarse. En el código: no existe ninguna verificación de teléfono (fue eliminada del onboarding), y la foto de perfil es opcional (el botón de registro no la exige). Si esta política se comunica a usuarios reales tal como está escrita hoy, sería falsa.
4. **Datos demo conviven con la base de datos que usarán usuarios reales**, sin proceso de limpieza definido.
5. **Cero visibilidad operativa post-lanzamiento** — sin monitoreo de errores ni analítica de producto, cualquier falla o baja adopción solo se detectará por reporte manual de usuarios, no por datos.
6. **Remitente de correo sin confirmar formalmente en Resend** — riesgo de que los correos empiecen a caer en spam si el remitente en uso no coincide con lo verificado en el dominio.
7. ~~**El listado público de cadenas siempre muestra el nombre de usuario del creador, contradiciendo la política de privacidad declarada.**~~ **Resuelto por decisión de producto el 25 julio 2026:** Julio confirmó que, para el MVP, el nombre del creador siempre se muestra en el listado público — no se implementará el toggle `show_name`. Ver `docs/branding/PRODUCT_BOOK.md` §3.2.

---

# Próximas tres prioridades

Ordenadas por impacto, no por facilidad:

1. **Definir y ejecutar el plan de datos reales:** limpiar/aislar los datos demo, reclutar a los primeros beta testers reales dentro de la meta de 50 usuarios en Monterrey, y documentar la primera historia real. Es el corazón del producto — hoy no existe ni una sola historia real, y sin eso no hay nada que "presumir".
2. **Monitoreo mínimo viable** (Sentry o equivalente) antes de invitar tráfico real. Sin esto, el equipo se entera de los problemas por los propios usuarios en lugar de adelantarse a ellos.
3. **Confirmar el remitente de correo en el dashboard de Resend** (`hola@` vs `noreply@trueke.app`) antes de que el volumen de correos crezca con usuarios reales.

*(Los huecos de autorización en `profiles/create` y `chains/create` que ocupaban el primer lugar de esta lista se corrigieron el 25 julio 2026 — ver sección 2.)*
