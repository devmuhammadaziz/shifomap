'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import {
  fetchMyClinic,
  isClinicOnboardingIncomplete,
  type ClinicOnboardingData,
} from '@/lib/clinic-onboarding'
import { ClinicOnboardingWizard } from './ClinicOnboardingWizard'

export function ClinicOnboardingGate({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const isDoctor = user?.role === 'doctor'
  const [loading, setLoading] = useState(!isDoctor)
  const [clinic, setClinic] = useState<ClinicOnboardingData | null>(null)
  const [showWizard, setShowWizard] = useState(false)

  const refresh = useCallback(async () => {
    if (isDoctor) {
      setLoading(false)
      setShowWizard(false)
      return
    }
    setLoading(true)
    try {
      const data = await fetchMyClinic()
      setClinic(data)
      setShowWizard(isClinicOnboardingIncomplete(data))
    } catch {
      setClinic(null)
      setShowWizard(false)
    } finally {
      setLoading(false)
    }
  }, [isDoctor])

  useEffect(() => {
    void refresh()
  }, [refresh])

  if (isDoctor) return <>{children}</>

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading…</div>
      </div>
    )
  }

  return (
    <>
      <div className={showWizard ? 'pointer-events-none select-none opacity-40' : undefined}>
        {children}
      </div>
      {showWizard && clinic ? (
        <ClinicOnboardingWizard clinic={clinic} onComplete={() => void refresh()} />
      ) : null}
    </>
  )
}
