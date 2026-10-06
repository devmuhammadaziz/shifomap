import { Elysia } from "elysia"
import { createReviewBodySchema } from "./reviews.model"
import {
  upsertReview,
  listReviewsWithPatientDetails,
  getRatingForTarget,
} from "./reviews.repo"
import { requirePatientAuth } from "@/common/middleware/auth"
import { toObjectId } from "@/common/utils/id"
import { getDb, CLINICS_COLLECTION } from "@/db/mongo"
import type { ClinicDoc } from "@/modules/clinics/clinics.model"
import { getClinicFeatures } from "@/modules/clinics/clinics.model"

export const reviewsRoutes = new Elysia({ prefix: "/reviews" })
  .get("/", async ({ query, set }) => {
    try {
      const clinicId = (query.clinicId as string) ?? ""
      const serviceId = (query.serviceId as string) ?? undefined
      const doctorId = (query.doctorId as string) ?? undefined
      const skip = Math.max(0, parseInt((query.skip as string) || "0", 10))
      const limit = Math.min(50, Math.max(1, parseInt((query.limit as string) || "10", 10)))
      if (!clinicId) {
        set.status = 400
        return { success: false, error: "clinicId is required" }
      }
      // Reviews stay in the database; they're only hidden while the clinic has them turned off.
      const owner = await getDb()
        .collection<ClinicDoc>(CLINICS_COLLECTION)
        .findOne({ _id: toObjectId(clinicId, "clinicId") }, { projection: { settings: 1 } })
      if (!getClinicFeatures(owner).reviewsEnabled) {
        set.status = 200
        return { success: true, data: { reviews: [], total: 0, rating: { avg: 0, count: 0 }, reviewsEnabled: false } }
      }
      const data = await listReviewsWithPatientDetails(
        { clinicId, serviceId, doctorId },
        skip,
        limit,
      )
      const rating = await getRatingForTarget({ clinicId, serviceId, doctorId })
      set.status = 200
      // Strip the private `patient` object (phone/email/city) and only expose
      // `patientName` + `patientAvatar` to the public.
      const reviews = data.reviews.map(({ patient: _p, ...r }) => r)
      return { success: true, data: { reviews, total: data.total, rating, reviewsEnabled: true } }
    } catch (e: unknown) {
      const err = e as { statusCode?: number; message?: string }
      if (err.statusCode) {
        set.status = err.statusCode
        return { success: false, error: err.message }
      }
      set.status = 500
      return { success: false, error: "Internal server error" }
    }
  })
  .use(requirePatientAuth)
  .post("/", async ({ auth, body, set }) => {
    try {
      const parsed = createReviewBodySchema.safeParse(body ?? {})
      if (!parsed.success) {
        set.status = 400
        return {
          success: false,
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        }
      }
      const clinicId = parsed.data.clinicId
      if (!clinicId) {
        set.status = 400
        return { success: false, error: "clinicId is required" }
      }
      const db = getDb()
      const clinic = await db.collection<ClinicDoc>(CLINICS_COLLECTION).findOne({
        _id: toObjectId(clinicId),
        status: "active",
        deletedAt: null,
      })
      if (!clinic) {
        set.status = 404
        return { success: false, error: "Clinic not found" }
      }
      if (!getClinicFeatures(clinic).reviewsEnabled) {
        set.status = 403
        return { success: false, error: "This clinic does not accept reviews", code: "REVIEWS_DISABLED" }
      }

      const sid = parsed.data.serviceId?.trim()
      if (sid) {
        const ok = (clinic.services ?? []).some((s) => s._id.toHexString() === sid)
        if (!ok) {
          set.status = 400
          return { success: false, error: "serviceId does not belong to this clinic" }
        }
      }
      const did = parsed.data.doctorId?.trim()
      if (did) {
        const ok = (clinic.doctors ?? []).some((d) => d._id.toHexString() === did)
        if (!ok) {
          set.status = 400
          return { success: false, error: "doctorId does not belong to this clinic" }
        }
      }

      const doc = await upsertReview({
        clinicId,
        serviceId: parsed.data.serviceId ?? null,
        doctorId: parsed.data.doctorId ?? null,
        patientId: auth.sub,
        stars: parsed.data.stars,
        text: parsed.data.text ?? null,
      })
      set.status = 201
      return {
        success: true,
        data: {
          _id: doc._id.toHexString(),
          clinicId: doc.clinicId.toHexString(),
          serviceId: doc.serviceId?.toHexString() ?? null,
          doctorId: doc.doctorId?.toHexString() ?? null,
          stars: doc.stars,
          text: doc.text,
          createdAt: doc.createdAt.toISOString(),
        },
      }
    } catch (e: unknown) {
      const err = e as { statusCode?: number; message?: string }
      if (err.statusCode) {
        set.status = err.statusCode
        return { success: false, error: err.message }
      }
      set.status = 500
      return { success: false, error: "Internal server error" }
    }
  })
