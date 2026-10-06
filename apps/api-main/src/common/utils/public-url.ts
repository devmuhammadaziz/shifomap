import { env } from "@/env"

// Matches uploaded-file URLs however they were stored: relative ("/v1/files/<id>"),
// or absolute with whatever host the uploader used (localhost, LAN IP, old domain).
const FILE_URL_RE = /^(?:https?:\/\/[^/\s]+)?\/v1\/files\/([a-f0-9]{24})(?:[?#].*)?$/i

/** Base URL clients should use to reach this API, e.g. "https://api.shifoyol.uz". */
export function getPublicBaseUrl(request: Request): string {
  if (env.PUBLIC_API_URL) return env.PUBLIC_API_URL.replace(/\/+$/, "")
  const url = new URL(request.url)
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || url.protocol.replace(":", "")
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host") || url.host
  return `${proto}://${host}`
}

export function toPublicFileUrl(value: string, baseUrl: string): string {
  const m = FILE_URL_RE.exec(value)
  return m ? `${baseUrl}/v1/files/${m[1].toLowerCase()}` : value
}

/** Rewrites file URLs in a JSON-like response body in place. */
export function rewriteFileUrls(value: unknown, baseUrl: string, depth = 0): unknown {
  if (depth > 12 || value == null) return value
  if (typeof value === "string") return value.includes("/v1/files/") ? toPublicFileUrl(value, baseUrl) : value
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) value[i] = rewriteFileUrls(value[i], baseUrl, depth + 1)
    return value
  }
  if (typeof value === "object") {
    const proto = Object.getPrototypeOf(value)
    if (proto !== Object.prototype && proto !== null) return value
    const obj = value as Record<string, unknown>
    for (const key of Object.keys(obj)) obj[key] = rewriteFileUrls(obj[key], baseUrl, depth + 1)
  }
  return value
}
