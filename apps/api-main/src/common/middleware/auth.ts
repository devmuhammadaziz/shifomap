import { Elysia } from "elysia"
import { jwtVerify, SignJWT, errors as joseErrors } from "jose"
import { env } from "@/env"
import { unauthorized, type AppError } from "@/common/errors"

const secret = new TextEncoder().encode(env.JWT_SECRET)

export type JwtPayload = {
  sub: string // admin _id, owner _id, or patient _id
  username?: string
  role: string // e.g. "SUPER_ADMIN_SHIFO", "clinic_owner", "patient"
  clinicId?: string // set for clinic owner tokens
}

/**
 * Sign JWT token for admin authentication
 * Token expires in JWT_EXPIRES_IN (default 7d)
 */
export async function signToken(payload: JwtPayload, expiresIn: string = env.JWT_EXPIRES_IN): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(env.JWT_ISSUER)
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret)
}

/** Error codes the mobile app relies on to decide between "refresh token" and "show error". */
export const AUTH_ERROR_CODES = {
  missing: "TOKEN_MISSING",
  expired: "TOKEN_EXPIRED",
  invalid: "TOKEN_INVALID",
} as const

function readBearer(request: Request): string | null {
  const header = request.headers.get("authorization")
  if (!header) return null
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  const token = match?.[1]?.trim()
  return token && token !== "null" && token !== "undefined" ? token : null
}

function tokenError(err: unknown): AppError {
  if (err instanceof joseErrors.JWTExpired) {
    return unauthorized("Token expired", AUTH_ERROR_CODES.expired)
  }
  return unauthorized("Invalid or expired token", AUTH_ERROR_CODES.invalid)
}

/**
 * Verify JWT token
 * Throws if invalid or expired
 */
export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secret, { issuer: env.JWT_ISSUER })
  return payload as unknown as JwtPayload
}

/**
 * Verify a patient token while tolerating expiry up to PATIENT_REFRESH_GRACE.
 * Only used by the refresh endpoint: the signature still proves we issued it.
 */
export async function verifyPatientTokenForRefresh(token: string): Promise<JwtPayload> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: env.JWT_ISSUER,
      clockTolerance: env.PATIENT_REFRESH_GRACE,
    })
    const p = payload as unknown as JwtPayload
    if (p.role !== "patient" || !p.sub) {
      throw unauthorized("Invalid token for patient", AUTH_ERROR_CODES.invalid)
    }
    return p
  } catch (err) {
    if ((err as AppError)?.statusCode) throw err
    throw unauthorized("Session expired, please sign in again", AUTH_ERROR_CODES.invalid)
  }
}

/**
 * Sign JWT token for patient authentication (long-lived; mobile refreshes it silently)
 */
export async function signPatientToken(patientId: string): Promise<string> {
  return signToken(
    {
      sub: patientId,
      role: "patient",
    },
    env.PATIENT_JWT_EXPIRES_IN
  )
}

/**
 * Elysia plugin to require authentication
 * Adds `auth` to context with decoded JWT payload
 * Usage: .use(requireAuth).get("/protected", ({ auth }) => ...)
 */
export const requireAuth = new Elysia({ name: "requireAuth" }).derive(
  { as: "scoped" },
  async ({ request }) => {
    const token = readBearer(request)
    if (!token) {
      throw unauthorized("Missing or invalid Authorization header", AUTH_ERROR_CODES.missing)
    }

    let payload: JwtPayload
    try {
      payload = await verifyToken(token)
    } catch (err) {
      throw tokenError(err)
    }
    if (!payload?.sub) {
      throw unauthorized("Invalid or expired token", AUTH_ERROR_CODES.invalid)
    }
    return { auth: payload }
  }
)

/**
 * Elysia plugin to require patient authentication
 */
export const requirePatientAuth = new Elysia({ name: "requirePatientAuth" }).derive(
  { as: "scoped" },
  async ({ request }) => {
    const token = readBearer(request)
    if (!token) {
      throw unauthorized("Missing or invalid Authorization header", AUTH_ERROR_CODES.missing)
    }

    let payload: JwtPayload
    try {
      payload = await verifyToken(token)
    } catch (err) {
      throw tokenError(err)
    }
    if (payload?.role !== "patient" || !payload.sub) {
      throw unauthorized("Invalid token for patient", AUTH_ERROR_CODES.invalid)
    }
    return { auth: payload }
  }
)
