export function getApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (raw) {
    return raw.replace(/\/+$/, "")
  }
  // Dev fallback: api-main default in this monorepo is :8080
  return "http://localhost:8080"
}
