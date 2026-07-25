# Trueke

Trueke es una plataforma web de intercambio de objetos: las personas publican lo que tienen y lo cambian directamente por lo que quieren, o participan en **cadenas de intercambio** (inspiradas en el caso del "clip rojo") para transformar un objeto en algo mejor a través de varios intercambios sucesivos.

> El contexto completo del proyecto — filosofía de producto, decisiones de diseño, estado actual, historial de sesiones de desarrollo — vive en [`CONTEXTO.md`](./CONTEXTO.md). Léelo antes de tocar código.

## Documentación

| Documento | Contenido |
|---|---|
| [`CONTEXTO.md`](./CONTEXTO.md) | Estado actual del proyecto, historial de sesiones, stack, esquema de datos |
| [`CLAUDE.md`](./CLAUDE.md) | Cómo debe trabajar Claude Code en este repositorio |
| [`docs/branding/PRODUCT_BOOK.md`](./docs/branding/PRODUCT_BOOK.md) | Identidad de marca: filosofía, colores, tipografía, voz |
| [`docs/business/LAUNCH_CHECKLIST.md`](./docs/business/LAUNCH_CHECKLIST.md) | Definición oficial de "listo para lanzar", verificada contra el código |
| [`docs/business/ROADMAP.md`](./docs/business/ROADMAP.md) | Qué falta, organizado por horizonte de tiempo |
| [`docs/business/GROWTH_PLAYBOOK.md`](./docs/business/GROWTH_PLAYBOOK.md) | Estrategia de crecimiento propuesta (documento estratégico, sujeto a validación) |
| [`docs/business/METRICS.md`](./docs/business/METRICS.md) | Qué medir y por qué (documento estratégico, sujeto a validación) |
| [`docs/arquitectura/CADENAS_ARQUITECTURA.md`](./docs/arquitectura/CADENAS_ARQUITECTURA.md) | Arquitectura técnica de las cadenas de intercambio |
| [`docs/sesiones/`](./docs/sesiones/) | Documentación detallada de sesiones de desarrollo específicas |

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **React 19**
- **Supabase** — PostgreSQL, Auth, Storage, Realtime
- **Resend** + **React Email** — correo transaccional
- CSS Modules por pantalla
- Desplegado en **Vercel** (`trueke.app`), deploy automático desde `main`

La tipografía es la fuente del sistema (`system-ui`) en toda la app — no usa `next/font`/Geist pese a lo que sugería una versión anterior de este archivo.

## Getting Started

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Variables de entorno

Se necesita un archivo `.env.local` (no se commitea, ver `.gitignore`) con:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM=
```

Sin estas variables, `npm run dev` funciona para UI estática pero cualquier pantalla que consulte Supabase o envíe correo fallará. El build de producción (`npm run build`) también las requiere para el paso de prerender.

### Otros scripts

```bash
npm run lint        # ESLint
npx tsc --noEmit    # TypeScript, sin emitir archivos
npm run email:dev   # Previsualiza las plantillas de correo (app/emails/), no requiere credenciales
```
