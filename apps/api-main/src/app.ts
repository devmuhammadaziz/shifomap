import { Elysia } from "elysia"
import { cors } from "@elysiajs/cors"
import { healthRoutes } from "@/modules/health/health.routes"
import { authRoutes } from "@/modules/auth/auth.routes"
import { usersRoutes } from "@/modules/users/users.routes"
import { clinicsRoutes } from "@/modules/clinics/clinics.routes"
import { patientsRoutes } from "@/modules/patients/patients.routes"
import { bookingsRoutes } from "@/modules/bookings/bookings.routes"
import { bookingsManageRoutes } from "@/modules/bookings/bookings.manage.routes"
import { reviewsRoutes } from "@/modules/reviews/reviews.routes"
import { landingRoutes } from "@/modules/landing/landing.routes"
import { prescriptionsRoutes, prescriptionsPatientRoutes } from "@/modules/prescriptions/prescriptions.routes"
import { discountsRoutes } from "@/modules/discounts/discounts.routes"
import { pharmaciesRoutes } from "@/modules/pharmacies/pharmacies.routes"
import { prescriptionsAdminRoutes } from "@/modules/prescriptions/prescriptions.admin.routes"
import { prescriptionsManageRoutes } from "@/modules/prescriptions/prescriptions.manage.routes"
import { filesRoutes } from "@/modules/files/files.routes"
import { medicalHistoryPatientRoutes, medicalHistoryDoctorRoutes } from "@/modules/medical-history/medical-history.routes"
import { assessmentsRoutes } from "@/modules/assessments/assessments.routes"
import { chatPatientRoutes, chatDoctorRoutes } from "@/modules/chat/chat.routes"
import { postsPublicRoutes, postsPatientRoutes, postsAdminRoutes } from "@/modules/posts/posts.routes"
import { aiChatPatientRoutes, aiChatAdminRoutes } from "@/modules/ai-chat/ai-chat.routes"
import { storiesRoutes, storiesAdminRoutes } from "@/modules/stories/stories.routes"
import { homeVisitsPatientRoutes } from "@/modules/home-visits/home-visits.routes"
import { homeVisitsManageRoutes } from "@/modules/home-visits/home-visits.manage.routes"
import { AppError } from "@/common/errors"
import { logger } from "@/common/logger"
import { getPublicBaseUrl, rewriteFileUrls } from "@/common/utils/public-url"

// V1 API routes
const v1 = new Elysia({ prefix: "/v1" })
  .use(authRoutes)
  .use(usersRoutes)
  .use(clinicsRoutes)
  .use(patientsRoutes)
  .use(discountsRoutes)
  .use(pharmaciesRoutes)
.use(bookingsRoutes)
.use(bookingsManageRoutes)
.use(reviewsRoutes)
.use(prescriptionsRoutes)
.use(prescriptionsManageRoutes)
.use(prescriptionsPatientRoutes)
.use(landingRoutes)
.use(filesRoutes)
.use(medicalHistoryPatientRoutes)
.use(medicalHistoryDoctorRoutes)
.use(assessmentsRoutes)
.use(chatPatientRoutes)
.use(chatDoctorRoutes)
.use(postsPublicRoutes)
.use(postsPatientRoutes)
.use(postsAdminRoutes)
.use(aiChatPatientRoutes)
.use(aiChatAdminRoutes)
.use(storiesRoutes)
.use(storiesAdminRoutes)
.use(prescriptionsAdminRoutes)
.use(homeVisitsPatientRoutes)
.use(homeVisitsManageRoutes)

// Main Elysia app
export const app = new Elysia()
  // Must be registered before any route and as "global": Elysia only applies hooks
  // to routes defined after them, otherwise every AppError (401/404/...) leaks out as 500.
  .onError({ as: "global" }, ({ code, error, set, request }) => {
    const err = error as AppError & { statusCode?: number; code?: string }
    if (error instanceof AppError || (typeof err?.statusCode === "number" && err?.message)) {
      set.status = err.statusCode
      return { success: false, error: err.message, code: err.code }
    }
    if (code === "NOT_FOUND") {
      set.status = 404
      return { success: false, error: "Not found", code: "NOT_FOUND" }
    }
    if (code === "VALIDATION" || code === "PARSE") {
      set.status = 400
      return { success: false, error: "Invalid request", code: "VALIDATION_ERROR" }
    }
    if (code === "INVALID_COOKIE_SIGNATURE") {
      set.status = 401
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" }
    }
    logger.error("[app] Unhandled error", {
      method: request.method,
      url: request.url,
      code: String(code),
      err: error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ""}` : String(error),
    })
    set.status = 500
    return { success: false, error: "Internal server error", code: "INTERNAL_ERROR" }
  })
  // Stored upload URLs may be relative or carry the uploader's host (e.g. localhost);
  // always hand clients a URL on the host they actually reached.
  .onAfterHandle({ as: "global" }, (ctx) => {
    const body = (ctx as unknown as { responseValue?: unknown; response?: unknown }).responseValue
      ?? (ctx as unknown as { response?: unknown }).response
    if (body && typeof body === "object" && !(body instanceof Response) && !(body instanceof Blob)) {
      rewriteFileUrls(body, getPublicBaseUrl(ctx.request))
    }
  })
  // CORS plugin - allows requests from any origin in dev
  .use(
    cors({
      origin: [
        "https://clinic.shifoyol.uz",
        "https://console.shifoyol.uz",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:4000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:4000",
      ],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      maxAge: 86400,
    })
  )
  // Root endpoint
  .get("/", () => ({
    name: "api-main",
    version: "1.0.0",
    docs: "Use /v1/* for API endpoints",
  }))
  // Health check
  .use(healthRoutes)
  // V1 API
  .use(v1)

export type App = typeof app
