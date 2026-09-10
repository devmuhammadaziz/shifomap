import Cookies from 'js-cookie'
import { getApiUrl } from '@/lib/api'

export function getClinicAuthHeaders(json = true): HeadersInit {
  const token = Cookies.get('clinic_auth_token')
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/** Upload image via api-main files endpoint; returns absolute URL for branding fields. */
export async function uploadClinicImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${getApiUrl()}/v1/files`, {
    method: 'POST',
    headers: getClinicAuthHeaders(false),
    body: form,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json?.success || !json?.data?.url) {
    throw new Error(json?.error || 'Upload failed')
  }
  const path = String(json.data.url)
  if (path.startsWith('http')) return path
  return `${getApiUrl()}${path.startsWith('/') ? path : `/${path}`}`
}

export type ClinicOnboardingData = {
  _id: string
  clinicDisplayName: string
  branding?: { logoUrl: string | null; coverUrl: string | null }
  contacts?: { phone: string | null; email: string | null; telegram: string | null }
  description?: { short: string | null; full: string | null }
  branches?: Array<{
    _id: string
    name: string
    phone?: string
    address?: { city: string; street: string; geo: { lat: number; lng: number } }
  }>
  doctors?: Array<{ _id: string; fullName: string }>
  services?: Array<{ _id: string }>
  categories?: Array<{ _id: string; name: string }>
}

export function isClinicOnboardingIncomplete(clinic: ClinicOnboardingData | null): boolean {
  if (!clinic) return true
  const phone = clinic.contacts?.phone?.trim()
  const short = clinic.description?.short?.trim()
  const branches = clinic.branches?.length ?? 0
  return !phone || !short || branches === 0
}

export async function fetchMyClinic(): Promise<ClinicOnboardingData | null> {
  const res = await fetch(`${getApiUrl()}/v1/clinics/my-clinic`, {
    headers: getClinicAuthHeaders(),
  })
  if (!res.ok) return null
  const json = await res.json()
  if (!json?.success || !json?.data) return null
  return json.data as ClinicOnboardingData
}
