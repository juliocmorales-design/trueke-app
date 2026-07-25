# ROADMAP

> Última actualización: 25 julio 2026

## Objetivo

Este documento organiza en el tiempo lo que ya está identificado como pendiente en `CONTEXTO.md`, `docs/business/LAUNCH_CHECKLIST.md` y `docs/arquitectura/CADENAS_ARQUITECTURA.md`. No introduce funcionalidades nuevas — cada ítem cita su fuente. El **horizonte** en el que cae cada ítem es objetivo (bloquea o no bloquea el lanzamiento); el **orden dentro de cada horizonte** es una propuesta de secuenciación, no una decisión tomada — Julio puede reordenar libremente.

---

## Horizonte 0 — Bloqueante antes de invitar usuarios reales

| Ítem | Fuente |
|---|---|
| Limpiar o aislar los datos demo (20 items, cadenas demo) antes de que usuarios reales vean la app | `LAUNCH_CHECKLIST.md` §8 |
| Monitoreo mínimo viable de errores (Sentry o equivalente) | `LAUNCH_CHECKLIST.md` §3/§9, `CONTEXTO.md` "V12" |
| Confirmar en el dashboard de Resend qué remitente (`hola@` vs `noreply@trueke.app`) está realmente verificado | `LAUNCH_CHECKLIST.md` §4, `docs/sesiones/SESION_16_EMAIL_RESEND.md` |
| Decidir la política real de confianza (verificación por teléfono / foto obligatoria) — hoy `CONTEXTO.md` la declara obligatoria pero el código no la exige | `LAUNCH_CHECKLIST.md` "Riesgos" — esta es una **decisión**, no una tarea de desarrollo hasta que se tome |

---

## Horizonte 1 — Primeras semanas post-lanzamiento (con los primeros 50 usuarios de Monterrey)

| Ítem | Fuente |
|---|---|
| Reclutar a los primeros beta testers reales | `CONTEXTO.md` "Lanzamiento", `LAUNCH_CHECKLIST.md` §8 |
| Documentar la primera historia real de intercambio | `LAUNCH_CHECKLIST.md` §8 |
| Definir un mecanismo simple de retroalimentación (aunque sea preguntar directamente) | `LAUNCH_CHECKLIST.md` §8 |
| Probar el correo transaccional en Outlook y clientes móviles | `CONTEXTO.md` "Pendiente post-lanzamiento", `SESION_16_EMAIL_RESEND.md` §12 |
| Migrar correos de Supabase Auth (confirmación/magic link/reset) a plantillas propias — arquitectura ya lista | `CONTEXTO.md`, `SESION_16_EMAIL_RESEND.md` §14 |

---

## Horizonte 2 — Corto plazo (una vez hay tracción inicial)

| Ítem | Fuente |
|---|---|
| PWA / Push notifications | `CONTEXTO.md` |
| Typing indicator en chat | `CONTEXTO.md` |
| Toast "¡Copiado!" al compartir link de tarjetas | `CONTEXTO.md` |
| OG tags dinámicos por item | `CONTEXTO.md` |
| Schema.org markup | `CONTEXTO.md` |
| Scroll restoration al volver de item | `CONTEXTO.md` |
| V9 — Score de confianza con explicación ("¿Cómo se calcula?") | `CONTEXTO.md` |
| Eliminar código muerto: `app/lib/notifications.ts`, `app/store/useItems.js`, `app/perfil/setup/page.tsx` | `CONTEXTO.md` sesión 16/17 |
| `chains/add-step` no verifica que el usuario tenga relación previa con la cadena antes de sumarlo como paso | `CADENAS_ARQUITECTURA.md` §4/§6 |
| `chains.status` nunca pasa a `'completed'` — no hay forma de distinguir cadenas terminadas de abandonadas | `CADENAS_ARQUITECTURA.md` §6 |

---

## Horizonte 3 — Medio/largo plazo (condicionado a crecimiento real, sin fecha objetivo)

| Ítem | Fuente |
|---|---|
| Tarjetas compartibles V2 (aspiracional) y V3 (story) | `CONTEXTO.md`, `CADENAS_ARQUITECTURA.md` §3/§7 |
| Niveles de usuario / logros | `CONTEXTO.md` |
| Ranking social | `CONTEXTO.md` |
| Centro de ayuda dedicado (hoy es un `mailto` directo) | `LAUNCH_CHECKLIST.md` §5 |
| FAQ | `LAUNCH_CHECKLIST.md` §5 |
| Inputs reales para `goal_description` y `personal_quote` de cadenas, o eliminar los campos si no se van a usar | `CADENAS_ARQUITECTURA.md` §2/§6 |

---

## Decisiones pendientes (no son tareas de desarrollo — requieren definición de Julio)

Estas no avanzan escribiendo código; avanzan cuando Julio decide algo. El detalle completo de cada una vive en el documento fuente citado — esta es solo una lista índice para no tener que buscar en 3 lugares distintos:

- Política real de verificación de confianza (teléfono/foto obligatorios vs. opcionales) — ver Horizonte 0, detalle en `LAUNCH_CHECKLIST.md` "Riesgos".
- Si se necesita una landing de marketing separada del home de la app. (`LAUNCH_CHECKLIST.md` §5)
- Qué redes sociales activar (Facebook, Instagram, TikTok, LinkedIn) y con qué prioridad. (`LAUNCH_CHECKLIST.md` §7)
- Confirmar política de backups del plan actual de Supabase/Vercel. (`LAUNCH_CHECKLIST.md` §9)
- Si vale la pena mantener `docs/branding/PRODUCT_BOOK.md` y `docs/business/GROWTH_PLAYBOOK.md`/`METRICS.md` actualizados como documentos vivos, o son de una sola vez.
