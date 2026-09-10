'use client'

import { useMemo, useState } from 'react'
import { useLanguage } from '@/contexts/language-context'
import type { ClinicOnboardingData } from '@/lib/clinic-onboarding'
import { StepClinicInfo } from './StepClinicInfo'
import { StepBranch } from './StepBranch'
import { StepDoctor } from './StepDoctor'
import { StepService } from './StepService'

type Props = {
  clinic: ClinicOnboardingData
  onComplete: () => void
}

export function ClinicOnboardingWizard({ clinic: initialClinic, onComplete }: Props) {
  const { t } = useLanguage()
  const o = t.onboarding
  const [clinic, setClinic] = useState(initialClinic)

  const startStep = useMemo(() => {
    const phone = clinic.contacts?.phone?.trim()
    const short = clinic.description?.short?.trim()
    const hasBranch = (clinic.branches?.length ?? 0) > 0
    if (!phone || !short) return 0
    if (!hasBranch) return 1
    return 2
  }, []) // only initial

  const [step, setStep] = useState(startStep)

  const labels = [o.stepInfo, o.stepBranch, o.stepDoctor, o.stepService]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200"
      >
        <div className="bg-gradient-to-r from-[#14228e] to-[#4a5fd4] px-6 py-5 text-white rounded-t-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
            {o.stepOf.replace('{{current}}', String(step + 1)).replace('{{total}}', '4')}
          </p>
          <h2 className="mt-1 text-xl font-bold">{o.welcomeTitle}</h2>
          <p className="mt-1 text-sm text-white/90">{o.welcomeSubtitle}</p>
          <div className="mt-4 flex gap-2">
            {labels.map((label, i) => (
              <div key={label} className="flex-1">
                <div
                  className={`h-1.5 rounded-full ${i <= step ? 'bg-white' : 'bg-white/30'}`}
                />
                <p className={`mt-1 text-[10px] truncate ${i === step ? 'text-white font-semibold' : 'text-white/70'}`}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-5">
          {step === 0 ? (
            <StepClinicInfo
              clinic={clinic}
              onDone={(next) => {
                setClinic(next)
                setStep(1)
              }}
            />
          ) : null}
          {step === 1 ? (
            <StepBranch
              clinic={clinic}
              onDone={(next) => {
                setClinic(next)
                setStep(2)
              }}
            />
          ) : null}
          {step === 2 ? (
            <StepDoctor
              clinic={clinic}
              onDone={(next) => {
                setClinic(next)
                setStep(3)
              }}
              onSkip={() => setStep(3)}
            />
          ) : null}
          {step === 3 ? (
            <StepService
              clinic={clinic}
              onDone={() => onComplete()}
              onSkip={() => onComplete()}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
