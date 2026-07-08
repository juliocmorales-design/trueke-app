function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  return `${local.slice(0, 1)}${'*'.repeat(Math.max(local.length - 1, 1))}@${domain}`
}

function maskRecipients(to: string | string[]): string {
  return Array.isArray(to) ? to.map(maskEmail).join(',') : maskEmail(to)
}

export function logEmailEvent(event: {
  type: string
  to: string | string[]
  success: boolean
  messageId?: string | null
  durationMs: number
  attempt: number
  error?: string
}) {
  const payload = {
    scope: 'email',
    type: event.type,
    to: maskRecipients(event.to),
    success: event.success,
    messageId: event.messageId ?? null,
    durationMs: event.durationMs,
    attempt: event.attempt,
    ...(event.error ? { error: event.error } : {}),
  }

  if (event.success) {
    console.log('[email]', JSON.stringify(payload))
  } else {
    console.error('[email]', JSON.stringify(payload))
  }
}
