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
import { Loader2 } from 'lucide-react'

type Props = {
  clinic: ClinicOnboardingData
  onDone: (clinic: ClinicOnboardingData) => void
  onSkip: () => void
}

export function StepDoctor({ clinic, onDone, onSkip }: Props) {
  const { t } = useLanguage()
  const o = t.onboarding
  const branchId = clinic.branches?.[0]?._id ?? ''

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!branchId) {
      setError(o.errorGeneric)
      return
    }
    if (!fullName.trim() || !username.trim() || !specialty.trim() || password.trim().length < 8) {
      setError(o.requiredHint)
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`${getApiUrl()}/v1/clinics/my-clinic/doctors`, {
        method: 'POST',
        headers: getClinicAuthHeaders(),
        body: JSON.stringify({
          fullName: fullName.trim(),
          username: username.trim(),
          specialty: specialty.trim(),
          bio: bio.trim(),
          password: password.trim(),
          branchId,
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
      <p className="text-sm text-gray-600">{o.doctorSkipHint}</p>
      <div>
        <Label>{o.doctorFullName}</Label>
        <Input className="mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>{o.doctorUsername}</Label>
          <Input className="mt-1" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" />
        </div>
        <div>
          <Label>{o.doctorPassword}</Label>
          <Input
            className="mt-1"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
      </div>
      <div>
        <Label>{o.doctorSpecialty}</Label>
        <Input className="mt-1" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
      </div>
      <div>
        <Label>{o.doctorBio}</Label>
        <Input className="mt-1" value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onSkip} disabled={saving}>
          {o.skip}
        </Button>
        <Button type="submit" className="flex-1" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {o.saving}
            </>
          ) : (
            o.continue
          )}
        </Button>
      </div>
    </form>
  )
}
