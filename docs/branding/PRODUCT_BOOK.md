# Product Book — Trueke

> Última actualización: 25 julio 2026
> Este documento compila las decisiones de marca y producto que ya existían dispersas en `CONTEXTO.md`, verificadas contra el código donde es posible. No introduce ninguna decisión nueva de marca — donde algo se describe como "patrón observado" en vez de "decisión declarada", significa que no hay una regla escrita en ningún lado, solo consistencia encontrada en el código actual.

---

## 1. Propósito

Trueke es una plataforma donde las personas transforman lo que ya tienen en aquello que desean, mediante intercambios directos o **cadenas de intercambio** (inspiradas en el caso del "clip rojo").

**Insight central del producto:** la app no vende intercambio — vende historias que la gente quiere presumir.

Las personas son las protagonistas. Los objetos son únicamente el medio.

*(Fuente: `CONTEXTO.md`, reforzado en `CLAUDE.md`)*

---

## 2. Filosofía del producto

| ❌ Lo que NO es | ✅ Lo que SÍ es |
|---|---|
| Marketplace tradicional | Motor de historias virales |
| Centrado en precios | Centrado en progreso y logros |
| Transaccional | Aspiracional y social |
| Publicidad como modelo | Confianza como producto |

*(Fuente: `CONTEXTO.md`)*

---

## 3. Principios de diseño inamovibles

Estos son los principios declarados como no-negociables. Se listan tal como están documentados; donde el código verificado no coincide con la declaración, se marca explícitamente (ver también `docs/business/LAUNCH_CHECKLIST.md` y `docs/arquitectura/CADENAS_ARQUITECTURA.md` para el detalle técnico completo).

### 3.1 Sin valores monetarios — en ningún lado
Nunca mostrar precios ni valores estimados: ni en tarjetas, ni en perfiles, ni en cadenas. Convertir el trueque en transacción destruye la magia. — **Verificado: cumplido**, ningún componente de la app muestra precios.

### 3.2 Privacidad en cadenas de intercambio
Las tarjetas compartibles solo deben mostrar objeto inicial, objeto final, número de intercambios y días; nunca ítems intermedios, otros usuarios, ubicaciones, fotos reales ni valores monetarios.

✅ **Verificado: cumplido.** Las tarjetas compartibles cumplen la regla.

**Nombre del creador en el listado público — decisión de producto (Julio, 25 julio 2026):** para el MVP, el listado público `/cadenas` muestra siempre el nombre de usuario del creador. No hay ni se implementará un toggle para ocultarlo. Detalle técnico en `docs/arquitectura/CADENAS_ARQUITECTURA.md` §2/§5.

### 3.3 Confianza como sistema central
Declarado: verificación por teléfono obligatoria al registrarse, foto de perfil obligatoria, calificación obligatoria tras cada intercambio, botón de reportar, score de confianza visible.

⚠️ **Verificado: parcialmente incumplido.** Calificación, reporte y score visible sí están implementados. La verificación por teléfono no existe en el código (fue removida del onboarding). La foto de perfil es opcional en el registro actual, no obligatoria. Esto es una decisión pendiente de Julio, no un bug — ver `docs/business/LAUNCH_CHECKLIST.md` "Riesgos".

### 3.4 Consistencia visual — ver sección 4 de este documento.

### 3.5 Flujo de oferta
El chat siempre está vinculado a una oferta específica (`offer_id`); para iniciar un chat el usuario debe seleccionar qué item ofrece a cambio; no se puede chatear sin una oferta formal. — **Verificado: cumplido**, `app/mensajes/[userId]/page.tsx` y `app/offer/new/page.tsx` implementan esto tal como se declara.

---

## 4. Identidad visual

### Color

| Rol | Valor | Verificación |
|---|---|---|
| Primario (CTA, acciones principales) | `#F97316` (naranja) | Usado en 43 archivos del código; **0 archivos** usan el color legado `#E8642C` — migración completa confirmada |
| Fondo | `#FDF8F3` (beige/crema) | — |
| Texto principal | `#1A2744` (navy) | — |
| Pills de estado | amber = pendiente, verde = aceptado/completado, rojo = rechazado | — |

Reglas: el CTA principal siempre es naranja (nunca navy, nunca gris). `border-radius` de botones CTA unificado a `12px` en toda la app (sesión 15 de `CONTEXTO.md`).

### Tipografía

⚠️ **Corrección respecto al `README.md`:** el `README.md` (boilerplate sin editar de `create-next-app`) menciona la fuente Geist de Vercel vía `next/font`. **Esto no refleja la implementación real** — `app/layout.tsx` no importa `next/font`, y `app/globals.css` define `font-family: system-ui, -apple-system, sans-serif` en toda la app. La tipografía real de Trueke es la fuente del sistema operativo, no Geist.

### Iconografía
SVGs inline consistentes en toda la app — sesión 9 de `CONTEXTO.md` documenta el reemplazo sistemático de emojis por SVGs, con la excepción intencional de los emojis en chips de categoría (búsqueda/crear), que se conservan por decisión de UX.

### Sistema de avatares
15 avatares ilustrados de animales (zorro, búho, mapache, jaguar, armadillo, colibrí, puma, águila, lobo, venado, serpiente, tortuga, nutria, castor, conejo) en `public/images/avatars/`, seleccionables en el onboarding como alternativa a subir una foto real.

---

## 5. Voz y tono (patrón observado, no una guía escrita)

No existe ningún documento previo de voz y tono. Lo siguiente es lo que se observa consistentemente en el copy real de la app (ej. `app/onboarding/page.tsx`):

- Español informal, directo, en segunda persona ("Elige tu avatar", "¡Todo listo!", "¡Casi listo!").
- Uso de exclamaciones para momentos de logro/avance, no en errores.
- Mensajes de error concretos y sin jerga técnica ("La foto debe pesar menos de 5MB", "Ese nombre de usuario ya está tomado. Elige otro.").
- Sin humor forzado ni lenguaje corporativo.

**Pendiente:** esto no es una guía de voz formal — es una observación de patrones. Si se necesita escribir copy nuevo de marketing (landing, redes sociales), vale la pena que Julio confirme si este tono informal aplica igual fuera del producto o si el registro cambia en comunicación externa.

---

## 6. Qué falta en este brand book

Para que sea un brand book completo (no solo una compilación de lo ya documentado), faltaría, y no existe hoy en ningún lugar del proyecto:

- Buyer personas / perfil del usuario objetivo más allá de "Monterrey, personas que quieren intercambiar objetos".
- Guías de fotografía/ilustración para material de marketing (los 15 avatares cubren el producto, no necesariamente marketing externo).
- Guía de tono para comunicación externa (redes sociales, soporte, prensa) — distinta de la voz dentro del producto.
- Naming/glosario oficial de términos del producto (ej. si "cadena" es siempre "cadena" o a veces "cadena de intercambio", "historia", etc. en comunicación externa).

Esto no bloquea el lanzamiento — se lista para que quede claro qué es "ya documentado" vs. "todavía no existe" si en algún momento se necesita para producir material de marketing serio (ver `docs/business/GROWTH_PLAYBOOK.md`).
