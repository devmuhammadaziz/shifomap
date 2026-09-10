'use client'

import { useRef, useState } from 'react'
import { useLanguage } from '@/contexts/language-context'
import { getApiUrl } from '@/lib/api'
import {
  fetchMyClinic,
  getClinicAuthHeaders,
  type ClinicOnboardingData,
  uploadClinicImage,
} from '@/lib/clinic-onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Upload } from 'lucide-react'

type Props = {
  clinic: ClinicOnboardingData
  onDone: (clinic: ClinicOnboardingData) => void
}

export function StepClinicInfo({ clinic, onDone }: Props) {
  const { t } = useLanguage()
  const o = t.onboarding
  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [phone, setPhone] = useState(clinic.contacts?.phone ?? '')
  const [email, setEmail] = useState(clinic.contacts?.email ?? '')
  const [telegram, setTelegram] = useState(clinic.contacts?.telegram ?? '')
  const [shortDesc, setShortDesc] = useState(clinic.description?.short ?? '')
  const [fullDesc, setFullDesc] = useState(clinic.description?.full ?? '')
  const [logoUrl, setLogoUrl] = useState(clinic.branding?.logoUrl ?? '')
  const [coverUrl, setCoverUrl] = useState(clinic.branding?.coverUrl ?? '')
  const [uploading, setUploading] = useState<'logo' | 'cover' | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const onPick = async (kind: 'logo' | 'cover', file: File | undefined) => {
    if (!file) return
    setError('')
    setUploading(kind)
    try {
      const url = await uploadClinicImage(file)
      if (kind === 'logo') setLogoUrl(url)
      else setCoverUrl(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : o.uploadFailed)
    } finally {
      setUploading(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!phone.trim()) {
      setError(o.phoneRequired)
      return
    }
    if (!shortDesc.trim()) {
      setError(o.shortDescRequired)
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`${getApiUrl()}/v1/clinics/my-clinic`, {
        method: 'PATCH',
        headers: getClinicAuthHeaders(),
        body: JSON.stringify({
          branding: {
            logoUrl: logoUrl.trim() || null,
            coverUrl: coverUrl.trim() || null,
          },
          contacts: {
            phone: phone.trim(),
            email: email.trim() || null,
            telegram: telegram.trim() || null,
          },
          description: {
            short: shortDesc.trim(),
            full: fullDesc.trim() || null,
          },
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.success) {
        setError(json.error || o.errorGeneric)
        return
      }
      const next = await fetchMyClinic()
      if (next) onDone(next)
      else onDone({ ...clinic, contacts: { phone: phone.trim(), email: email.trim() || null, telegram: telegram.trim() || null }, description: { short: shortDesc.trim(), full: fullDesc.trim() || null }, branding: { logoUrl: logoUrl.trim() || null, coverUrl: coverUrl.trim() || null } })
    } catch {
      setError(o.errorNetwork)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>{o.clinicName}</Label>
        <Input value={clinic.clinicDisplayName} disabled className="mt-1 bg-gray-50" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>{o.logo}</Label>
          <div className="mt-1 flex items-center gap-3">
            <div className="h-16 w-16 rounded-xl border bg-gray-50 overflow-hidden flex items-center justify-center">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <Upload className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => onPick('logo', e.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!!uploading}
                onClick={() => logoInputRef.current?.click()}
              >
                {uploading === 'logo' ? o.uploading : o.uploadLogo}
              </Button>
              <Input
                placeholder={o.orPasteUrl}
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div>
          <Label>{o.cover}</Label>
          <div className="mt-1 space-y-2">
            <div className="h-16 w-full rounded-xl border bg-gray-50 overflow-hidden flex items-center justify-center">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <Upload className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => onPick('cover', e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!!uploading}
              onClick={() => coverInputRef.current?.click()}
            >
              {uploading === 'cover' ? o.uploading : o.uploadCover}
            </Button>
            <Input
              placeholder={o.orPasteUrl}
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <Label>
          {o.phone} <span className="text-red-500">*</span>
        </Label>
        <Input
          className="mt-1"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+998901234567"
          required
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>{o.email}</Label>
          <Input className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label>{o.telegram}</Label>
          <Input className="mt-1" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="@clinic" />
        </div>
      </div>
      <div>
        <Label>
          {o.shortDescription} <span className="text-red-500">*</span>
        </Label>
        <Input
          className="mt-1"
          value={shortDesc}
          onChange={(e) => setShortDesc(e.target.value)}
          required
        />
      </div>
      <div>
        <Label>{o.fullDescription}</Label>
        <textarea
          className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={fullDesc}
          onChange={(e) => setFullDesc(e.target.value)}
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={saving || !!uploading}>
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
