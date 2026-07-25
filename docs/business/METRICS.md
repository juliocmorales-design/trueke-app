# Metrics — Trueke

> ⚠️ **DOCUMENTO ESTRATÉGICO SUJETO A VALIDACIÓN DEL FUNDADOR.** Todo lo que no esté marcado explícitamente como "Documentado" es una **propuesta** — no hay ninguna herramienta de analítica instalada hoy (verificado: `package.json` no incluye Google Analytics, PostHog, Vercel Analytics ni ninguna equivalente — ver `LAUNCH_CHECKLIST.md` §3), así que este documento no puede reportar ninguna métrica real todavía. Es un plan de qué medir y por qué, pendiente de que Julio lo apruebe y de que se instale instrumentación.
>
> Última actualización: 25 julio 2026

**Leyenda:** 📄 Documentado · 💡 Propuesta · ❓ Hipótesis · ⏳ Pendiente de aprobación

---

## 1. Estado real de instrumentación (📄)

- Ninguna herramienta de analítica de producto instalada.
- No existe ningún evento de producto trackeado (registro, oferta, intercambio completado, cadena creada, tarjeta compartida).
- La única telemetría existente en todo el proyecto es `app/lib/emailLogger.ts` — logging estructurado de envíos de correo (éxito/error, `messageId`, duración), no analítica de producto.
- Los datos de actividad real sí existen en las tablas de Supabase (`profiles`, `items`, `offers`, `exchanges`, `chains`, `chain_steps`, `ratings`, `reports`) — es decir, hoy se **podría** responder preguntas básicas de negocio con consultas SQL directas al dashboard de Supabase, sin instalar ninguna herramienta, aunque no hay ningún dashboard ni reporte armado para eso todavía.

---

## 2. Métrica Norte propuesta (💡)

**Propuesta: "Cadenas completadas con 2+ pasos por semana."**

Justificación (💡, no un hecho): el producto no vende intercambios individuales, vende historias (`PRODUCT_BOOK.md` §1). Un intercambio único no es evidencia de que el producto cumple su promesa central; una cadena de 2+ pasos sí lo es — significa que alguien avanzó de un objeto a otro mejor a través de la plataforma, que es literalmente la definición del producto.

❓ Hipótesis a validar con Julio: que esta es una mejor métrica norte que, por ejemplo, "usuarios activos semanales" o "intercambios completados" a secas — se propone porque está más alineada a la filosofía del producto, pero es una elección de producto, no un hecho matemático.

---

## 3. Funnel propuesto (💡), mapeado a tablas reales del esquema

| Etapa | Evento propuesto | Tabla/campo real que lo respalda |
|---|---|---|
| Visita | Visitante anónimo ve el home | No hay tracking hoy — requeriría instrumentación nueva |
| Registro | Cuenta creada | `profiles` — fila nueva |
| Primera publicación | Usuario publica un objeto | `items` — fila nueva por `user_id` |
| Primera oferta enviada | Usuario ofrece algo a cambio | `offers` — fila nueva |
| Primer intercambio completado | Oferta llega a `status = 'completed'` | `offers.status` |
| Primera cadena iniciada | Usuario transforma lo recibido en algo nuevo | `chains` — fila nueva |
| Cadena de 2+ pasos (Métrica Norte, sección 2) | Segundo `chain_step` en la misma cadena | `chain_steps.step_number >= 2` |
| Historia compartida | Descarga o compartición de una tarjeta | No hay tracking hoy — el click en "Descargar"/"Compartir" en `ChainClient.tsx` no dispara ningún evento registrado, solo ejecuta la acción local (descarga de imagen / abrir WhatsApp/Facebook) |

Esta tabla es útil incluso sin analítica instalada: cada etapa a partir de "Registro" **ya se puede consultar directamente en Supabase** con SQL, sin instrumentación adicional. Solo "Visita" y "Historia compartida" requieren instrumentación nueva porque no dejan rastro en la base de datos actual.

---

## 4. Métricas de la fase actual (beta / primeros 50 usuarios) — propuesta (💡)

Dado que el objetivo de esta fase (según `docs/business/GROWTH_PLAYBOOK.md`) es producir una historia real antes que crecer en volumen, se propone medir solo lo esencial para no sobre-instrumentar un producto con decenas de usuarios, no miles:

1. Usuarios registrados (consulta directa a `profiles`).
2. Publicaciones activas (`items` donde `active = true`).
3. Ofertas enviadas vs. ofertas aceptadas (tasa de aceptación — `offers.status`).
4. Cadenas creadas y su distribución de `steps_count` (¿hay alguna con 2+?).
5. Calificaciones promedio (`ratings.score`) — proxy de si la experiencia de intercambio es buena.

❓ Hipótesis: estas 5 consultas SQL manuales son suficientes para esta fase y no se necesita instalar una herramienta de analítica todavía. Si el volumen crece más allá de lo que se puede revisar manualmente cada semana, ese es el punto en el que instalar Vercel Analytics/PostHog empieza a justificarse (⏳ pendiente de que Julio decida cuándo).

---

## 5. Qué NO se propone medir todavía (💡)

- **Conversión por canal de marketing** — no tiene sentido sin tráfico ni canales activos aún (ver `GROWTH_PLAYBOOK.md`).
- **Retención a 30/60/90 días** — con una base de usuarios de decenas de personas, cohortes de retención no son estadísticamente significativas todavía.
- **Cualquier métrica de monetización** — Trueke no tiene modelo de precios ni de ingresos declarado en ningún documento del proyecto; no hay nada que medir ahí.

---

## 6. Qué necesita decidir Julio (⏳)

- Aprobar o rechazar la Métrica Norte propuesta (sección 2).
- Decidir si en esta fase basta con consultas manuales a Supabase (sección 4) o si prefiere instalar una herramienta de analítica desde ya.
- Si se instala una herramienta, cuál (`LAUNCH_CHECKLIST.md` §3 deja Google Analytics, PostHog y Vercel Analytics como opciones sin decidir).
- Definir con qué frecuencia se revisan estas métricas (¿semanal? ¿al cierre de cada intercambio real?) — no hay ninguna cadencia propuesta aquí porque depende de cuánto tiempo Julio quiere dedicarle activamente.
