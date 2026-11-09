import { z } from 'zod'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type SafeErrorClassification =
  | 'DATABASE_UNAVAILABLE'
  | 'DATABASE_QUERY_ERROR'
  | 'PAYMENT_GATEWAY_TIMEOUT'
  | 'PAYMENT_AUTHORIZATION_FAILED'
  | 'LOGISTICS_PROVIDER_ERROR'
  | 'INVALID_SIGNATURE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'CSV_IMPORT_ERROR'
  | 'NOTIFICATION_DELIVERY_FAILED'
  | 'INTERNAL_SERVER_ERROR'

export interface StructuredLogEntry {
  timestamp: string
  severity: LogLevel
  service: string
  environment: string
  correlation_id?: string
  operation: string
  duration_ms?: number
  error_code?: SafeErrorClassification
  message: string
  metadata?: Record<string, unknown>
}

export interface SanitizedErrorResponse {
  success: false
  message: string
  error: string
  code: SafeErrorClassification
  correlation_id?: string
  timestamp: string
}

export interface HealthComponentStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  latency_ms?: number
  message?: string
}

export interface OperationalHealthResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  ready: boolean
  service: string
  environment: string
  timestamp: string
  components: {
    process: HealthComponentStatus
    database?: HealthComponentStatus
    cache?: HealthComponentStatus
    payment_gateway?: HealthComponentStatus
    shipping_provider?: HealthComponentStatus
  }
}

export interface MonitoringAlertThresholds {
  latencyP95Ms: number
  errorRatePercent: number
  paymentFailureThresholdHourly: number
  shipmentFailureThresholdHourly: number
  webhookFailureThresholdHourly: number
  notificationFailureThresholdHourly: number
  checkoutRetryThreshold: number
}

export const correlationIdSchema = z
  .string()
  .min(8)
  .max(64)
  .regex(/^[a-zA-Z0-9_\-]+$/, 'Correlation ID must contain only alphanumeric characters, dashes, or underscores')

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /pass(?:phrase)?$/i,
  /pwd/i,
  /secret/i,
  /token/i,
  /jwt/i,
  /^authorization$/i,
  /cookie/i,
  /api[_-]?key/i,
  /key[_-]?secret/i,
  /webhook[_-]?token/i,
  /webhook[_-]?secret/i,
  /card[_-]?num(?:ber)?/i,
  /cvv/i,
  /cvc/i,
  /pan$/i,
  /account[_-]?number/i,
  /bank[_-]?account/i,
  /signature/i,
]

const ADDRESS_LINE_PATTERNS = [
  /^address_1$/i,
  /^address_2$/i,
  /^street$/i,
  /^billing_address$/i,
  /^billing_address_2$/i,
  /^shipping_address$/i,
  /^shipping_address_2$/i,
]

/**
 * Validates whether a provided correlation ID is trusted, well-formed, and safe.
 */
export function isValidCorrelationId(id: unknown): boolean {
  if (typeof id !== 'string') return false
  const trimmed = id.trim()
  return trimmed.length >= 8 && trimmed.length <= 64 && /^[a-zA-Z0-9_\-]+$/.test(trimmed)
}

/**
 * Generates a trusted, cryptographically unique correlation identifier.
 */
export function generateCorrelationId(prefix: string = 'glr'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`
  }
  const timestamp = Date.now().toString(36)
  const rand = Math.random().toString(36).substring(2, 10)
  return `${prefix}_${timestamp}_${rand}`
}

/**
 * Resolves a trusted correlation ID from incoming request headers or generates a safe new one.
 */
export function extractOrGenerateCorrelationId(headerValue?: unknown, prefix: string = 'glr'): string {
  if (typeof headerValue === 'string' && isValidCorrelationId(headerValue.trim())) {
    return headerValue.trim()
  }
  if (Array.isArray(headerValue) && typeof headerValue[0] === 'string' && isValidCorrelationId(headerValue[0].trim())) {
    return headerValue[0].trim()
  }
  return generateCorrelationId(prefix)
}

/**
 * Masks an email address preserving partial domain structure for operational debugging.
 * Example: 'aarav.patel@glorov.in' -> 'a***l@g***.in'
 */
export function maskEmail(email?: unknown): string {
  if (!email || typeof email !== 'string') return '[NO_EMAIL]'
  const clean = email.trim()
  const parts = clean.split('@')
  if (parts.length !== 2) return '[REDACTED_EMAIL]'

  const [local, domain] = parts
  const maskedLocal =
    local.length <= 2
      ? `${local[0] || '*'}***`
      : `${local[0]}***${local[local.length - 1]}`

  const domainParts = domain.split('.')
  if (domainParts.length >= 2) {
    const mainDomain = domainParts[0]
    const ext = domainParts.slice(1).join('.')
    const maskedDomain =
      mainDomain.length <= 2
        ? `${mainDomain[0] || '*'}***`
        : `${mainDomain[0]}***`
    return `${maskedLocal}@${maskedDomain}.${ext}`
  }

  return `${maskedLocal}@${domain}`
}

/**
 * Masks an Indian mobile phone number preserving the last 4 digits.
 * Example: '9876543210' -> '******3210'
 */
export function maskPhone(phone?: unknown): string {
  if (!phone || typeof phone !== 'string') return '[NO_PHONE]'
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return '******'
  const lastFour = digits.slice(-4)
  return `******${lastFour}`
}

/**
 * Masks a bank account number preserving the last 4 digits.
 * Example: '123456789012' -> 'XXXXXX9012'
 */
export function maskBankAccount(account?: unknown): string {
  if (!account || typeof account !== 'string') return '[NO_ACCOUNT]'
  const clean = account.trim()
  if (clean.length < 4) return 'XXXXXX'
  return `XXXXXX${clean.slice(-4)}`
}

/**
 * Recursively redacts sensitive credentials, passwords, tokens, full addresses,
 * and customer PII from an arbitrary object or primitive for safe logging.
 */
export function redactSensitiveData(value: unknown, depth = 0, seen = new WeakSet()): unknown {
  if (depth > 8) return '[DEPTH_LIMIT]'
  if (value === null || value === undefined) return value

  if (typeof value === 'string') {
    // Check if string looks like a JWT token
    if (/^[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}$/.test(value)) {
      return '[REDACTED_JWT]'
    }
    // Check if string starts with Bearer
    if (/^Bearer\s+[A-Za-z0-9_\-.]+$/i.test(value)) {
      return 'Bearer [REDACTED_TOKEN]'
    }
    return value
  }

  if (typeof value !== 'object') {
    return value
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      // Stack traces must only appear in internal server logs, never serialized to clients
      stack: value.stack,
    }
  }

  if (seen.has(value)) {
    return '[CIRCULAR_REF]'
  }
  seen.add(value)

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveData(item, depth + 1, seen))
  }

  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(value)) {
    // Check sensitive keys (passwords, tokens, API keys, CVV)
    if (SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
      if (/card[_-]?num(?:ber)?/i.test(key) && typeof val === 'string') {
        const digits = val.replace(/\D/g, '')
        result[key] = digits.length >= 4 ? `************${digits.slice(-4)}` : '[REDACTED]'
      } else {
        result[key] = '[REDACTED]'
      }
      continue
    }

    // Check street address fields (protect home addresses while preserving city/state/PIN)
    if (ADDRESS_LINE_PATTERNS.some((pattern) => pattern.test(key))) {
      result[key] = '[REDACTED_ADDRESS_LINE]'
      continue
    }

    // Special field masking for customer PII
    if (/email/i.test(key) && typeof val === 'string') {
      result[key] = maskEmail(val)
      continue
    }

    if (/phone/i.test(key) && typeof val === 'string') {
      result[key] = maskPhone(val)
      continue
    }

    if (/bank_account/i.test(key) && typeof val === 'string') {
      result[key] = maskBankAccount(val)
      continue
    }

    result[key] = redactSensitiveData(val, depth + 1, seen)
  }

  return result
}

/**
 * Classifies an unexpected error into a safe, non-sensitive client error code and status.
 */
export function classifyError(error: unknown): {
  code: SafeErrorClassification
  clientMessage: string
  sanitizedMessage: string
  statusCode: number
} {
  const errMsg = error instanceof Error ? error.message : String(error || '')
  const errName = error instanceof Error ? error.name : ''
  const errCode = (error as { code?: string | number })?.code ? String((error as { code?: string | number }).code) : ''

  // Database connectivity errors
  if (
    errCode === 'ECONNREFUSED' ||
    errCode === '57P01' ||
    errCode === '57P02' ||
    errCode === '57P03' ||
    /econnrefused|connection\s+refused|database\s+connection|connection\s+timeout|timeout\s+acquiring\s+a\s+connection|pool\s+exhausted|knex:\s+timeout/i.test(
      errMsg
    ) ||
    /postgres|mikroorm|drivererror/i.test(errName)
  ) {
    const clientMessage = 'Database service is temporarily unavailable. Please retry your request shortly.'
    return {
      code: 'DATABASE_UNAVAILABLE',
      clientMessage,
      sanitizedMessage: clientMessage,
      statusCode: 503,
    }
  }

  // Database query syntax / relation errors
  if (
    /relation\s+"[^"]+"\s+does\s+not\s+exist|syntax\s+error\s+at\s+or\s+near|violates\s+foreign\s+key|duplicate\s+key\s+value|violates\s+unique\s+constraint/i.test(
      errMsg
    )
  ) {
    const clientMessage = 'A database transaction could not be completed. Please try again.'
    return {
      code: 'DATABASE_QUERY_ERROR',
      clientMessage,
      sanitizedMessage: clientMessage,
      statusCode: 500,
    }
  }

  // Payment gateway timeout
  if (/timeout|timed\s+out|econnreset|etimedout/i.test(errMsg) && /razorpay|gateway|payment/i.test(errMsg)) {
    const clientMessage = 'Payment service took too long to respond. Please verify your payment status before retrying.'
    return {
      code: 'PAYMENT_GATEWAY_TIMEOUT',
      clientMessage,
      sanitizedMessage: clientMessage,
      statusCode: 504,
    }
  }

  // Payment failures
  if (/payment\s+declined|insufficient_funds|card_declined|payment_failed|signature\s+verification\s+failed/i.test(errMsg)) {
    const clientMessage = 'Payment authorization could not be completed. Please check your payment details or try an alternate method.'
    return {
      code: 'PAYMENT_AUTHORIZATION_FAILED',
      clientMessage,
      sanitizedMessage: clientMessage,
      statusCode: 400,
    }
  }

  // Cryptographic signature tampering
  if (/signature|tamper|hmac/i.test(errMsg)) {
    const clientMessage = 'Invalid cryptographic verification signature. Request rejected.'
    return {
      code: 'INVALID_SIGNATURE',
      clientMessage,
      sanitizedMessage: clientMessage,
      statusCode: 401,
    }
  }

  // Logistics / Courier API errors
  if (/shiprocket|courier|awb|dispatch/i.test(errMsg)) {
    const clientMessage = 'Logistics provider service is temporarily unavailable. Your request could not be completed.'
    return {
      code: 'LOGISTICS_PROVIDER_ERROR',
      clientMessage,
      sanitizedMessage: clientMessage,
      statusCode: 502,
    }
  }

  // Rate limiting
  if (/rate\s+limit|too\s+many\s+requests/i.test(errMsg) || errCode === '429') {
    const clientMessage = 'Too many requests. Please wait a moment before trying again.'
    return {
      code: 'RATE_LIMIT_EXCEEDED',
      clientMessage,
      sanitizedMessage: clientMessage,
      statusCode: 429,
    }
  }

  // Validation errors
  if (/zod|validation|invalid\s+(?:pin|pincode|address|input|amount|format|data)/i.test(errMsg)) {
    const clientMessage = errMsg.length < 150 ? errMsg : 'Invalid request payload. Please verify your input.'
    return {
      code: 'VALIDATION_ERROR',
      clientMessage,
      sanitizedMessage: clientMessage,
      statusCode: 400,
    }
  }

  // Unauthorized / Forbidden / Auth failures
  if (/unauthorized|authentication\s+required|invalid\s+credentials|invalid\s+(?:email\s+or\s+password|password)|incorrect\s+password/i.test(errMsg)) {
    const clientMessage = 'Invalid email or password.'
    return {
      code: 'UNAUTHORIZED',
      clientMessage,
      sanitizedMessage: clientMessage,
      statusCode: 401,
    }
  }

  if (/forbidden|permission|unauthorized\s+access|actor_id/i.test(errMsg)) {
    const clientMessage = 'Unauthorized access: you do not have permission to access this resource.'
    return {
      code: 'FORBIDDEN',
      clientMessage,
      sanitizedMessage: clientMessage,
      statusCode: 403,
    }
  }

  // Not found
  if (/not\s+found/i.test(errMsg)) {
    const clientMessage = errMsg.length < 120 ? errMsg : 'The requested resource was not found.'
    return {
      code: 'NOT_FOUND',
      clientMessage,
      sanitizedMessage: clientMessage,
      statusCode: 404,
    }
  }

  // Conflict / Duplicate
  if (/duplicate|already\s+(?:canceled|cancelled|delivered|shipped|restocked|recorded)/i.test(errMsg)) {
    const clientMessage = errMsg.length < 150 ? errMsg : 'The operation conflicts with current resource state.'
    return {
      code: 'CONFLICT',
      clientMessage,
      sanitizedMessage: clientMessage,
      statusCode: 409,
    }
  }

  // CSV Import errors
  if (/csv/i.test(errMsg)) {
    const clientMessage = errMsg.length < 150 ? errMsg : 'Product CSV import failed. Please check CSV format.'
    return {
      code: 'CSV_IMPORT_ERROR',
      clientMessage,
      sanitizedMessage: clientMessage,
      statusCode: 422,
    }
  }

  // Notification delivery errors (strictly delivery failures, not validation of email addresses)
  if (/(?:notification|smtp|nodemailer|mailer|failed\s+to\s+send)/i.test(errMsg)) {
    const clientMessage = 'Unable to deliver message notification at this time.'
    return {
      code: 'NOTIFICATION_DELIVERY_FAILED',
      clientMessage,
      sanitizedMessage: clientMessage,
      statusCode: 502,
    }
  }

  // Fallback internal error
  const fallbackMessage = 'An unexpected internal error occurred. Please try again later.'
  return {
    code: 'INTERNAL_SERVER_ERROR',
    clientMessage: fallbackMessage,
    sanitizedMessage: fallbackMessage,
    statusCode: 500,
  }
}

/**
 * Creates a consistent, non-sensitive client error response object.
 * Guaranteed to NEVER leak stack traces, database schema, passwords, or internal file paths.
 */
export function createSanitizedErrorPayload(
  error: unknown,
  correlationId?: string,
  userMessageOverride?: string
): SanitizedErrorResponse {
  const { code, clientMessage } = classifyError(error)
  const resolvedMessage = userMessageOverride || clientMessage

  return {
    success: false,
    message: resolvedMessage,
    error: resolvedMessage,
    code,
    timestamp: new Date().toISOString(),
    ...(correlationId ? { correlation_id: correlationId } : {}),
  }
}
