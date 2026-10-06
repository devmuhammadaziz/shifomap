'use client'

import { useLanguage } from '@/contexts/language-context'
import { useAuthStore } from '@/store/auth-store'
import { DoctorSettingsTabs } from './doctor-settings-tabs'
import { ClinicFeatureSettings } from './clinic-feature-settings'

export default function SettingsPage() {
  const { t } = useLanguage()
  const user = useAuthStore((s) => s.user)
  const isDoctor = (user as { role?: string })?.role === 'doctor'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {isDoctor ? t.doctorSettings?.title ?? t.dashboard.settingsTitle : t.dashboard.settingsTitle}
        </h1>
        <p className="text-gray-600 mt-2">
          {isDoctor ? t.doctorSettings?.subtitle ?? t.dashboard.settingsSubtitle : t.dashboard.settingsSubtitle}
        </p>
      </div>

      {isDoctor ? <DoctorSettingsTabs /> : <ClinicFeatureSettings />}
    </div>
  )
}

