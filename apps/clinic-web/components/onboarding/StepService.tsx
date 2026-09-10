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

export function StepService({ clinic, onDone, onSkip }: Props) {
  const { t } = useLanguage()
  const o = t.onboarding
  const branchId = clinic.branches?.[0]?._id ?? ''
  const doctorId = clinic.doctors?.[0]?._id ?? ''
  const canCreate = Boolean(branchId && doctorId)

  const [title, setTitle] = useState('')
  const [categoryName, setCategoryName] = useState(clinic.categories?.[0]?.name ?? '')
  const [price, setPrice] = useState('')
  const [durationMin, setDurationMin] = useState('30')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!canCreate) {
      setError(o.serviceNeedDoctor)
      return
    }
    if (!title.trim() || !categoryName.trim()) {
      setError(o.requiredHint)
      return
    }
    const amount = parseFloat(price)
    const dur = parseInt(durationMin, 10)
    if (isNaN(amount) || amount < 0 || isNaN(dur) || dur < 1) {
      setError(o.requiredHint)
      return
    }
    setSaving(true)
    try {
      let categoryId = clinic.categories?.[0]?._id
      if (!categoryId) {
        const catRes = await fetch(`${getApiUrl()}/v1/clinics/my-clinic/categories`, {
          method: 'POST',
          headers: getClinicAuthHeaders(),
          body: JSON.stringify({ name: categoryName.trim() }),
        })
        const catJson = await catRes.json().catch(() => ({}))
        if (!catRes.ok || !catJson.success) {
          setError(catJson.error || o.errorGeneric)
          return
        }
        categoryId =
          catJson.data?.category?._id ||
          catJson.data?._id ||
          catJson.data?.id
        if (!categoryId) {
          const refreshed = await fetchMyClinic()
          categoryId = refreshed?.categories?.[0]?._id
        }
        if (!categoryId) {
          setError(o.errorGeneric)
          return
        }
      }

      const res = await fetch(`${getApiUrl()}/v1/clinics/my-clinic/services`, {
        method: 'POST',
        headers: getClinicAuthHeaders(),
        body: JSON.stringify({
          title: title.trim(),
          description: '',
          categoryId,
          durationMin: dur,
          price: { amount, currency: 'UZS' },
          branchIds: [branchId],
          doctorIds: [doctorId],
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.success) {
        setError(json.error || o.errorGeneric)
        return
      }
      const next = await fetchMyClinic()
      if (next) onDone(next)
      else onSkip()
    } catch {
      setError(o.errorNetwork)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">{o.serviceSkipHint}</p>

      {!canCreate ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {o.serviceNeedDoctor}
        </div>
      ) : (
        <>
          <div>
            <Label>{o.serviceCategory}</Label>
            <Input
              className="mt-1"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Masalan: Terapevt"
            />
          </div>
          <div>
            <Label>{o.serviceTitle}</Label>
            <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{o.servicePrice}</Label>
              <Input
                className="mt-1"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div>
              <Label>{o.serviceDuration}</Label>
              <Input
                className="mt-1"
                type="number"
                min={1}
                max={480}
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
              />
            </div>
          </div>
        </>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onSkip} disabled={saving}>
          {canCreate ? o.skip : o.finish}
        </Button>
        {canCreate ? (
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {o.saving}
              </>
            ) : (
              o.finish
            )}
          </Button>
        ) : null}
      </div>
    </form>
  )
}
