# Growth Playbook — Trueke

> ⚠️ **DOCUMENTO ESTRATÉGICO SUJETO A VALIDACIÓN DEL FUNDADOR.** Todo lo que no esté marcado explícitamente como "Documentado" es una **propuesta** elaborada con criterio de product manager sobre el contexto conocido de Trueke — no una decisión tomada ni un hecho verificable en el código. Nada de este documento debe ejecutarse sin que Julio lo revise y apruebe punto por punto.
>
> Última actualización: 25 julio 2026

**Leyenda usada en todo el documento:**
- 📄 **Documentado** — ya está decidido y registrado en `CONTEXTO.md` u otro documento del proyecto.
- 💡 **Propuesta** — recomendación de este documento, no una decisión tomada.
- ❓ **Hipótesis** — una suposición sobre el comportamiento de usuarios/canales que no se ha probado; se debería validar antes de invertir esfuerzo serio en ella.
- ⏳ **Pendiente de aprobación** — requiere que Julio decida antes de ejecutarse.

---

## 1. Contexto documentado (📄)

- Ciudad inicial: Monterrey, México. *(`CONTEXTO.md`)*
- Meta: 50 usuarios reales antes del lanzamiento público. *(`CONTEXTO.md`)*
- Canales ya mencionados: grupos de Facebook de trueque, WhatsApp, contactos personales. *(`CONTEXTO.md`)*
- Filosofía de producto declara explícitamente que Trueke **no** usa "publicidad como modelo" — es uno de los principios en la tabla "Lo que NO es" del `PRODUCT_BOOK.md`. *(📄 — esto restringe el tipo de estrategia que tiene sentido proponer aquí: la publicidad pagada como canal principal iría contra la filosofía declarada del producto, no solo contra el presupuesto)*
- El producto ya tiene un mecanismo de crecimiento incorporado: las tarjetas compartibles de cadenas (`ChainClient.tsx`, V1 implementada) generan una imagen descargable con CTA "Crea tu historia en Trueke.app" y comparten directo a WhatsApp/Facebook. *(📄 — el mecanismo existe en el código; su efectividad real como canal de adquisición es una hipótesis, no un hecho, ver sección 3)*
- No hay presupuesto de marketing conocido ni decisiones tomadas sobre inversión pagada — no hay evidencia de esto en ningún documento del proyecto.

---

## 2. Objetivo de esta fase (💡 propuesta de encuadre)

Antes de pensar en crecimiento, Trueke necesita **una** historia real de intercambio documentada — hoy no existe ninguna (`LAUNCH_CHECKLIST.md` §8). Se propone que el objetivo de esta fase no sea "crecer" en el sentido de adquisición masiva, sino **producir evidencia de que el producto genera lo que promete**: una cadena de intercambio real, completada por una persona real, que valga la pena compartir. Todo lo demás en este playbook está subordinado a ese objetivo.

---

## 3. Estrategia propuesta por fases (💡)

### Fase 0 — Círculo cercano (semana 1–2)
- 💡 Invitar directamente (no por publicación pública) a 10–15 personas del círculo personal de Julio en Monterrey que tengan objetos reales para intercambiar.
- 💡 Acompañar manualmente el primer intercambio de cada una — el objetivo no es volumen, es asegurar que al menos 2–3 completen una cadena de 2+ pasos.
- ❓ Hipótesis: las personas más cercanas tolerarán mejor la fricción de una app nueva sin historial social (cero cadenas públicas todavía) que un desconocido de un grupo de Facebook.

### Fase 1 — Comunidades existentes de trueque (semana 2–5)
- 📄 Canal ya identificado: grupos de Facebook de trueque en Monterrey, WhatsApp.
- 💡 Publicar primero la(s) historia(s) reales generadas en la Fase 0 (con la tarjeta compartible V1) antes de invitar a publicar objetos — la app se presenta con evidencia, no con una promesa vacía.
- 💡 Participar como usuario real en 3–5 grupos de Facebook de trueque de Monterrey antes de publicar nada promocional — entender el tono y las reglas de cada grupo (algunos prohíben explícitamente compartir apps/enlaces externos).
- ⏳ Pendiente de aprobación: si Julio quiere que esto lo haga él personalmente (mayor autenticidad, coincide con la filosofía "no publicidad") o se delega.

### Fase 2 — Boca a boca asistido por el producto (semana 5 en adelante, condicionado a que la Fase 1 funcione)
- 💡 El motor de crecimiento principal a mediano plazo debería ser el compartir de tarjetas de cadena, no adquisición pagada — esto es consistente con la filosofía declarada del producto (sección 1).
- ❓ Hipótesis: cada cadena completada y compartida genera en promedio X visitas nuevas. **No hay ninguna forma de medir esto hoy** (`LAUNCH_CHECKLIST.md` §3 — sin analítica instalada). Este playbook no puede proponer una meta numérica responsable sin esa instrumentación primero.

---

## 4. Lo que este playbook NO propone (y por qué)

- **No propone publicidad pagada (Facebook/Instagram Ads, Google Ads)** como parte de esta fase — contradice la filosofía declarada ("Publicidad como modelo" está en la lista de lo que Trueke NO es) y no hay evidencia de presupuesto asignado para esto.
- **No propone metas numéricas de adquisición por canal** (ej. "20 usuarios desde Facebook") — sin analítica instalada (`LAUNCH_CHECKLIST.md` §3), cualquier meta así sería una cifra inventada, no una proyección real.
- **No propone activar TikTok/Instagram/LinkedIn todavía** — son decisiones pendientes de Julio (`LAUNCH_CHECKLIST.md` §7), y sin contenido real (historias reales) que publicar, abrir esos canales antes de tiempo arriesga mostrar perfiles vacíos.

---

## 5. Riesgos de esta estrategia (💡, a validar por Julio)

- ❓ Hipótesis sin validar: que 50 usuarios reales sea alcanzable solo con círculo cercano + grupos de Facebook, sin ningún canal pagado. Si en 4–6 semanas la Fase 0 y 1 no generan tracción, valdría la pena que Julio reconsidere el supuesto de "cero presupuesto de marketing".
- El mecanismo de compartir (tarjetas) depende de que existan cadenas de 2+ pasos para ser interesante — si la Fase 0 no logra ninguna cadena real, no hay nada que compartir en la Fase 1.
- Publicar en grupos de Facebook de trueque sin entender las reglas de cada grupo puede resultar en expulsión o baneo — riesgo reputacional pequeño pero real si se hace apresuradamente.

---

## 6. Qué necesita decidir Julio antes de ejecutar esto (⏳)

- Aprobar o rechazar el encuadre de la sección 2 (priorizar una historia real sobre volumen).
- Confirmar si él mismo participará directamente en los grupos de Facebook o se delega.
- Decidir si en algún momento se considera presupuesto pagado, y si eso se reconcilia con la filosofía "no publicidad" del producto o se trata como una excepción táctica.
- Revisar y ajustar los tiempos de cada fase (son una propuesta de secuenciación, no compromisos).
