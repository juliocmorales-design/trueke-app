# Arquitectura de Cadenas de Intercambio

> Última actualización: 25 julio 2026
> Documento técnico — cada afirmación aquí está verificada directamente contra el código (rutas API, componentes, esquema de datos tal como se usa realmente). Donde el comportamiento real difiere de lo documentado en `CONTEXTO.md`, se señala explícitamente en la sección "Inconsistencias encontradas".

---

## 1. Qué es una cadena

Una cadena es la funcionalidad central de storytelling de Trueke, inspirada en el caso del "clip rojo": un usuario convierte un objeto en algo mejor a través de una secuencia de intercambios sucesivos. Cada cadena registra el objeto inicial, cada paso intermedio, y permite generar tarjetas compartibles con el resultado.

Es la funcionalidad que sostiene la filosofía de producto declarada en `CONTEXTO.md`: "la app no vende intercambio, vende historias que la gente quiere presumir."

---

## 2. Modelo de datos

### Tabla `chains`

| Columna | Uso real verificado |
|---|---|
| `id` (bigint) | PK |
| `creator_id` (uuid) | Usuario que inició la cadena — se fija en `chains/create`, nunca cambia |
| `initial_item_id` (bigint) | El objeto con el que empezó la cadena |
| `goal_description` (text) | Meta declarada por el usuario. Se inserta siempre como `''` en `chains/create` — **no hay ningún input en la UI que la capture o edite**; se muestra en `chain/[id]` solo si tiene contenido, pero nada la escribe hoy |
| `status` (text) | Se inserta siempre como `'active'`. **Nunca se actualiza a `'completed'` en ningún punto del código** — una cadena permanece `'active'` para siempre, aunque el usuario la abandone o alcance su meta |
| `steps_count` (int) | Se incrementa en `chains/add-step` cada vez que se agrega un paso |
| `show_name` (bool) | Se inserta siempre como `false` en `chains/create`. Ningún componente de lectura (`cadenas/page.tsx`, `chain/[id]`) lo consulta — la columna no tiene efecto en el comportamiento actual. No es un bug: por decisión de producto (Julio, 25 julio 2026) el nombre del creador siempre se muestra en el listado público para el MVP, así que no hay ni se implementará un toggle. La columna queda como candidata a eliminarse en una limpieza futura si se confirma que no se usará |
| `personal_quote` (text) | Se lee en `chain/[id]/page.tsx` y se pasa a la tarjeta compartible V1, pero **no existe ningún input en la UI que la escriba** — siempre llega vacía/null salvo que se haya insertado manualmente en la base de datos |

### Tabla `chain_steps`

| Columna | Uso real verificado |
|---|---|
| `id` (bigint) | PK |
| `chain_id` (bigint) | FK a `chains` |
| `step_number` (int) | Secuencial, calculado en `add-step` como `último paso + 1` |
| `item_id` (bigint) | Objeto recibido en ese paso |
| `from_user_id` (uuid) | Quien ejecuta el paso — siempre el usuario autenticado que llama a la API |
| `to_user_id` (uuid, nullable) | Solo se llena cuando la cadena se crea con un `offerId` (ver sección 4 — camino no usado por la UI actual) |
| `offer_id` (bigint, nullable) | Igual que arriba — solo se llena en el camino no usado por la UI actual |
| `created_at` | Timestamp |

---

## 3. Flujos reales soportados por la UI

Verificado en `app/crear/page.tsx` y `app/rating/[offerId]/RatingClient.tsx` — son los **únicos** puntos de entrada reales:

1. **Iniciar cadena nueva** — al publicar un objeto en `/crear` con la query `?newChain=true` (viene del flujo de calificación, ver punto 3), se llama `POST /api/chains/create` con `{ receivedItemId }`. Crea la fila en `chains` y el primer `chain_step`.
2. **Continuar una cadena existente** — tras calificar un intercambio (`RatingClient.tsx`), si el usuario tiene cadenas activas se le ofrece "Continuar una cadena existente"; se le redirige a `/crear?chainId=X&itemId=Y`, y al publicar se llama `POST /api/chains/add-step` con `{ chainId, newItemId }`.
3. **Ver cadena** — `/chain/[id]` (Server Component que arma `ChainData` con `chains` + `chain_steps` + `items`, y lo pasa a `ChainClient`).
4. **Listado público** — `/cadenas`, filtros Populares (ordenado por `steps_count` desc), Recientes (por `created_at` desc), Épicas (`steps_count >= 4`). Consulta directa desde el cliente con `supabase-js` (RLS aplica aquí, no hay ruta API dedicada).
5. **Mis cadenas** — `/mis-cadenas`, dos queries: cadenas donde el usuario es `creator_id`, y cadenas donde el usuario aparece como `from_user_id` en algún `chain_step`.
6. **Compartir** — modal en `chain/[id]/ChainClient.tsx` con 4 variantes (V1 minimalista 400×600, WhatsApp 600×600, Instagram Feed 600×600, Stories 600×1067) generadas con `html2canvas` sobre nodos renderizados off-screen, más un botón directo a compartir en Facebook (solo abre el diálogo de Facebook, no genera imagen). Ver `CONTEXTO.md` — únicamente la versión V1 del sistema de 3 versiones planeado (V1/V2/V3) está implementada; V2 y V3 siguen pendientes.

### Camino no usado por la UI actual

`POST /api/chains/create` acepta un `offerId` opcional: si se pasa, busca la oferta, verifica que el caller sea `from_user_id` o `to_user_id` de esa oferta, y llena `to_user_id`/`offer_id` en el primer `chain_step`. **Ningún call site actual en la UI envía `offerId`** — `app/crear/page.tsx` solo envía `receivedItemId`. Esta rama del código está viva y protegida (ver sección 4), pero hoy es alcanzable únicamente llamando a la API directamente, no desde ningún flujo visible de la app.

---

## 4. Autorización (estado tras corrección del 25 julio 2026)

- `POST /api/chains/create` y `POST /api/chains/add-step` requieren `Authorization: Bearer <token>` válido (`requireUser()` de `app/lib/apiAuth.ts` en `create`; verificación inline equivalente en `add-step`).
- `chains/create`, si recibe `offerId`, verifica que el caller sea `from_user_id` o `to_user_id` de esa oferta antes de derivar identidades — corregido el 25 julio 2026 (antes no se verificaba, permitiendo atribuir un paso a un tercero).
- `chains/add-step` **no verifica que el usuario tenga alguna relación previa con la cadena** (no es dueño, no es parte de un paso anterior) antes de insertar un nuevo `chain_step` con `chainId` arbitrario — cualquier usuario autenticado puede agregarse a sí mismo como paso de cualquier cadena existente, conociendo su `id`. Esto no fue reportado como uno de los "dos huecos" corregidos porque no permite suplantar la identidad de otro usuario (siempre inserta `from_user_id: user.id`, el propio caller) — es un problema de integridad del relato (cualquiera puede "sumarse" a una cadena ajena), no de suplantación. Queda como hallazgo abierto, ver sección 6.

---

## 5. Privacidad en tarjetas compartibles

`CONTEXTO.md` declara como decisión de diseño inamovible que las tarjetas compartibles y listados públicos de cadenas **nunca** muestran ítems intermedios, otros usuarios, ubicaciones, fotos reales de personas ni valores monetarios.

Verificado en código:
- Las tarjetas compartibles (`ShareCardV1`, `CardContent`) efectivamente solo muestran objeto inicial, objeto final, número de intercambios y días — correcto, coincide con la política.
- El listado público `/cadenas` (`app/cadenas/page.tsx`) muestra siempre el avatar y `@username` del creador, sin condicionarlo a `show_name`. **Esto es intencional**: por decisión de producto (Julio, 25 julio 2026), para el MVP el nombre del creador siempre se muestra en el listado público — no hay toggle de privacidad para ese campo.

---

## 6. Inconsistencias encontradas (resumen)

| Hallazgo | Impacto |
|---|---|
| `status` nunca pasa de `'active'` a `'completed'` | El filtro `.in('status', ['active','completed'])` en `/cadenas` tiene una rama muerta; no hay forma de distinguir cadenas terminadas de abandonadas |
| `goal_description` y `personal_quote` no tienen ningún input en la UI | Estos campos están renderizados en `chain/[id]` pero siempre llegan vacíos en el uso real de la app |
| `chains/add-step` no verifica que el caller tenga relación previa con la cadena | Cualquier usuario autenticado puede agregarse como paso de cualquier cadena existente conociendo su `chainId` |
| Rama `offerId` de `chains/create` inalcanzable desde la UI | No es un bug — está protegida y funcional — pero es código muerto desde la perspectiva del producto actual, salvo que se planee usarla |

---

## 7. Pendientes conocidos (ya documentados en `CONTEXTO.md`)

- Tarjetas compartibles V2 (aspiracional, Instagram Feed/Facebook) y V3 (story, Instagram Stories/TikTok) — solo V1 implementada.
