'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/language-context'
import { getApiUrl } from '@/lib/api'
import {
  fetchMyClinic,
  getClinicAuthHeaders,
  type ClinicOnboardingData,
} from '@/lib/clinic-onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, MapPin } from 'lucide-react'

type Props = {
  clinic: ClinicOnboardingData
  onDone: (clinic: ClinicOnboardingData) => void
}

export function StepBranch({ clinic, onDone }: Props) {
  const { t } = useLanguage()
  const o = t.onboarding

  const [name, setName] = useState(clinic.clinicDisplayName ? `${clinic.clinicDisplayName} — asosiy` : '')
  const [phone, setPhone] = useState(clinic.contacts?.phone ?? '')
  const [city, setCity] = useState('Toshkent')
  const [street, setStreet] = useState('')
  const [lat, setLat] = useState(41.311081)
  const [lng, setLng] = useState(69.240562)
  const [locLoading, setLocLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError(o.errorGeneric)
      return
    }
    setLocLoading(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setLocLoading(false)
      },
      () => {
        setError(o.errorGeneric)
        setLocLoading(false)
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim() || !phone.trim() || !city.trim() || !street.trim()) {
      setError(o.requiredHint)
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`${getApiUrl()}/v1/clinics/my-clinic/branches`, {
        method: 'POST',
        headers: getClinicAuthHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          address: {
            city: city.trim(),
            street: street.trim(),
            geo: { lat, lng },
          },
          workingHours: [1, 2, 3, 4, 5].map((day) => ({ day, from: '09:00', to: '18:00' })),
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.success) {
        setError(json.error || o.errorGeneric)
        return
      }
      const next = await fetchMyClinic()
      if (next) onDone(next)
    } catch {
      setError(o.errorNetwork)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>
          {o.branchName} <span className="text-red-500">*</span>
        </Label>
        <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label>
          {o.branchPhone} <span className="text-red-500">*</span>
        </Label>
        <Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>
            {o.city} <span className="text-red-500">*</span>
          </Label>
          <Input className="mt-1" value={city} onChange={(e) => setCity(e.target.value)} required />
        </div>
        <div>
          <Label>
            {o.street} <span className="text-red-500">*</span>
          </Label>
          <Input className="mt-1" value={street} onChange={(e) => setStreet(e.target.value)} required />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={useMyLocation} disabled={locLoading}>
          {locLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
          {o.useMyLocation}
        </Button>
        <span className="text-xs text-gray-500">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </span>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {o.saving}
          </>
        ) : (
          o.continue
        )}
      </Button>
    </form>
  )
}
