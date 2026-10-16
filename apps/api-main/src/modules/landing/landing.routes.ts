import { Elysia } from "elysia"
import { requireAuth } from "@/common/middleware/auth"
import { landingContactBodySchema, saveLandingClinicsBodySchema } from "./landing.model"
import {
  getAdminLandingClinics,
  getLandingAdminMe,
  getPublicLandingClinics,
  saveAdminLandingClinics,
  sendClinicContactToTelegram,
} from "./landing.service"

/**
 * Landing page routes under /v1/landing
 *
 * Public:
 * - POST /contact — clinic contact form → Telegram
 * - GET  /clinics — featured clinics for the marketing site (logo + name)
 *
 * Admin (platform admin JWT from POST /v1/auth/loginAdmin):
 * - GET  /admin/me — verify token is a real active platform admin
 * - GET  /admin/clinics — all active clinics + selected flags
 * - PUT  /admin/clinics — save which clinics appear on the landing page
 */
export const landingRoutes = new Elysia({ prefix: "/landing" })
  .post("/contact", async ({ body, set }) => {
    try {
      const parsed = landingContactBodySchema.safeParse(body ?? {})
      if (!parsed.success) {
        set.status = 400
        return {
          success: false,
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        }
      }
      await sendClinicContactToTelegram(parsed.data)
      set.status = 200
      return { success: true, data: { message: "Notification sent" } }
    } catch (error: unknown) {
      const err = error as { message?: string }
      set.status = 500
      return { success: false, error: err?.message ?? "Internal server error" }
    }
  })
  .get("/clinics", async ({ set }) => {
    const data = await getPublicLandingClinics()
    set.status = 200
    return { success: true, data }
  })
  .use(requireAuth)
  .get("/admin/me", async ({ auth, set }) => {
    const data = await getLandingAdminMe(auth)
    set.status = 200
    return { success: true, data }
  })
  .get("/admin/clinics", async ({ auth, set }) => {
    const data = await getAdminLandingClinics(auth)
    set.status = 200
    return { success: true, data }
  })
  .put("/admin/clinics", async ({ auth, body, set }) => {
    const parsed = saveLandingClinicsBodySchema.safeParse(body ?? {})
    if (!parsed.success) {
      set.status = 400
      return {
        success: false,
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: parsed.error.flatten().fieldErrors,
      }
    }
    const data = await saveAdminLandingClinics(auth, parsed.data)
    set.status = 200
    return { success: true, data }
  })
