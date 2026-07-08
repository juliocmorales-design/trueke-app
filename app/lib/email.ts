import { createHash } from 'crypto'
import { Resend } from 'resend'
import type { ReactElement } from 'react'
import { logEmailEvent } from './emailLogger'

let client: Resend | null = null

function assertEnv(name: 'RESEND_API_KEY' | 'RESEND_FROM'): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `[email] Falta la variable de entorno ${name}. Configúrala en Vercel (o .env.local en desarrollo) antes de enviar correos.`,
    )
  }
  return value
}

function resendClient(): Resend {
  if (!client) client = new Resend(assertEnv('RESEND_API_KEY'))
  return client
}

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504])
const MAX_ATTEMPTS = 3
const BASE_DELAY_MS = 300

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Deriva una idempotencyKey estable a partir del destinatario, el asunto y las
 * props del template (que ya contienen la identidad del evento: offerId, tipo, etc.).
 * Así, reintentos de la misma operación (p. ej. Vercel reintentando la función)
 * nunca duplican el envío, sin que cada call site tenga que construir su propia clave.
 */
function deriveIdempotencyKey(input: { to: string | string[]; subject: string; react: ReactElement }): string {
  const to = Array.isArray(input.to) ? [...input.to].sort().join(',') : input.to
  const props = input.react.props as Record<string, unknown>
  const propsKey = JSON.stringify(props, Object.keys(props).sort())
  const raw = `${to}|${input.subject}|${propsKey}`
  return `trueke_${createHash('sha256').update(raw).digest('hex').slice(0, 32)}`
}

export interface SendEmailInput {
  to: string | string[]
  subject: string
  react: ReactElement
  /** Identificador del tipo de correo, solo para logging (ej. "offer_accepted", "test:generic"). */
  type?: string
  /**
   * Clave de idempotencia para Resend. Si se omite, se deriva automáticamente
   * de `to` + `subject` + las props del template — nunca se envía sin una.
   */
  idempotencyKey?: string
}

export interface SendEmailResult {
  success: boolean
  messageId: string | null
  error?: string
}

/** Única puerta de entrada para enviar correos desde la aplicación. */
export async function sendEmail({
  to,
  subject,
  react,
  type = 'generic',
  idempotencyKey,
}: SendEmailInput): Promise<SendEmailResult> {
  const from = assertEnv('RESEND_FROM')
  const key = idempotencyKey ?? deriveIdempotencyKey({ to, subject, react })

  const startedAt = Date.now()
  let lastError = 'unknown_error'

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { data, error } = await resendClient().emails.send(
        { from: `Trueke <${from}>`, to, subject, react },
        { idempotencyKey: key },
      )

      if (!error) {
        logEmailEvent({ type, to, success: true, messageId: data?.id, durationMs: Date.now() - startedAt, attempt })
        return { success: true, messageId: data?.id ?? null }
      }

      lastError = error.message
      const retryable = error.statusCode !== null && RETRYABLE_STATUS_CODES.has(error.statusCode)
      if (!retryable || attempt === MAX_ATTEMPTS) {
        logEmailEvent({ type, to, success: false, durationMs: Date.now() - startedAt, attempt, error: lastError })
        return { success: false, messageId: null, error: lastError }
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'unknown_error'
      if (attempt === MAX_ATTEMPTS) {
        logEmailEvent({ type, to, success: false, durationMs: Date.now() - startedAt, attempt, error: lastError })
        return { success: false, messageId: null, error: lastError }
      }
    }

    const backoff = BASE_DELAY_MS * 2 ** (attempt - 1) + Math.floor(Math.random() * 100)
    await sleep(backoff)
  }

  return { success: false, messageId: null, error: lastError }
}
