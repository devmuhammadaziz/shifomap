import { z } from "zod"

export const landingContactBodySchema = z.object({
  clinicName: z.string().min(1, "clinicName is required").max(500),
  phoneNumber: z.string().min(1, "phoneNumber is required").max(50),
})

export type LandingContactBody = z.infer<typeof landingContactBodySchema>

/** Public landing clinic card (logo + name only). */
export type LandingClinicPublic = {
  id: string
  name: string
  logoUrl: string | null
}

/** Admin picker row — same fields plus whether it is currently featured. */
export type LandingClinicAdmin = LandingClinicPublic & {
  selected: boolean
}

export const saveLandingClinicsBodySchema = z.object({
  clinicIds: z.array(z.string().min(1)).max(200),
})

export type SaveLandingClinicsBody = z.infer<typeof saveLandingClinicsBodySchema>
