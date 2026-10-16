import { ObjectId } from "mongodb"
import { env } from "@/env"
import { badRequest, forbidden, unauthorized } from "@/common/errors"
import { toObjectId } from "@/common/utils/id"
import { findAdminById } from "@/modules/auth/auth.repo"
import { mapDocToPublicAdmin } from "@/modules/auth/auth.model"
import type { LandingContactBody, LandingClinicAdmin, LandingClinicPublic, SaveLandingClinicsBody } from "./landing.model"
import {
  findActiveClinicsByIds,
  getFeaturedClinicIds,
  listActiveClinicsForLanding,
  setFeaturedClinicIds,
  type LandingClinicRow,
} from "./landing.repo"

const TELEGRAM_API = "https://api.telegram.org"

function isPlatformAdmin(role?: string) {
  return role === "SUPER_ADMIN_SHIFO" || role === "admin"
}

function mapClinic(row: LandingClinicRow): LandingClinicPublic {
  return {
    id: row._id.toHexString(),
    name: row.clinicDisplayName,
    logoUrl: row.branding?.logoUrl ?? null,
  }
}

/** Preserve the saved clinicIds order; drop missing/inactive clinics. */
function orderByIds(rows: LandingClinicRow[], ids: ObjectId[]): LandingClinicRow[] {
  const byId = new Map(rows.map((r) => [r._id.toHexString(), r]))
  const out: LandingClinicRow[] = []
  for (const id of ids) {
    const row = byId.get(id.toHexString())
    if (row) out.push(row)
  }
  return out
}

/**
 * Public: clinics selected for the marketing landing page (logo + name only).
 * Empty list when nothing is configured — landing should hide the section.
 */
export async function getPublicLandingClinics(): Promise<{ clinics: LandingClinicPublic[] }> {
  const ids = await getFeaturedClinicIds()
  if (ids.length === 0) return { clinics: [] }
  const rows = await findActiveClinicsByIds(ids)
  return { clinics: orderByIds(rows, ids).map(mapClinic) }
}

/**
 * Admin: every active clinic with a selected flag for the checkbox UI.
 */
export async function getAdminLandingClinics(auth: {
  role?: string
  sub: string
}): Promise<{ clinics: LandingClinicAdmin[] }> {
  if (!isPlatformAdmin(auth.role)) {
    throw forbidden("Platform admin access only")
  }
  const [all, selectedIds] = await Promise.all([listActiveClinicsForLanding(), getFeaturedClinicIds()])
  const selected = new Set(selectedIds.map((id) => id.toHexString()))
  return {
    clinics: all.map((row) => ({
      ...mapClinic(row),
      selected: selected.has(row._id.toHexString()),
    })),
  }
}

/**
 * Admin: replace the featured clinic list. Order of clinicIds is preserved on the public page.
 */
export async function saveAdminLandingClinics(
  auth: { role?: string; sub: string },
  body: SaveLandingClinicsBody
): Promise<{ clinics: LandingClinicPublic[] }> {
  if (!isPlatformAdmin(auth.role)) {
    throw forbidden("Platform admin access only")
  }

  const unique: ObjectId[] = []
  const seen = new Set<string>()
  for (const raw of body.clinicIds) {
    if (!ObjectId.isValid(raw)) {
      throw badRequest(`Invalid clinic id: ${raw}`, "INVALID_OBJECT_ID")
    }
    if (seen.has(raw)) continue
    seen.add(raw)
    unique.push(toObjectId(raw, "clinicId"))
  }

  // Keep only ids that still exist and are active (silently drop stale ones).
  const existing = await findActiveClinicsByIds(unique)
  const existingSet = new Set(existing.map((c) => c._id.toHexString()))
  const kept = unique.filter((id) => existingSet.has(id.toHexString()))

  await setFeaturedClinicIds(kept, auth.sub)
  return { clinics: orderByIds(existing, kept).map(mapClinic) }
}

/** Admin: verify the JWT is a real platform admin (blocks fake localStorage tokens). */
export async function getLandingAdminMe(auth: { role?: string; sub: string }) {
  if (!isPlatformAdmin(auth.role)) {
    throw forbidden("Platform admin access only")
  }
  if (!ObjectId.isValid(auth.sub)) {
    throw unauthorized("Invalid token")
  }
  const admin = await findAdminById(toObjectId(auth.sub, "adminId"))
  if (!admin || admin.status !== "active") {
    throw unauthorized("Invalid or inactive admin")
  }
  return { admin: mapDocToPublicAdmin(admin) }
}

function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0")
  const m = (date.getMonth() + 1).toString().padStart(2, "0")
  const y = date.getFullYear()
  const h = date.getHours().toString().padStart(2, "0")
  const min = date.getMinutes().toString().padStart(2, "0")
  return `${d}.${m}.${y} ${h}.${min}`
}

/**
 * Send landing page clinic contact to Telegram group (as bot message).
 */
export async function sendClinicContactToTelegram(data: LandingContactBody): Promise<void> {
  const chatId = env.TELEGRAM_GROUP_CHAT_ID
  const token = env.TELEGRAM_BOT_TOKEN
  const now = formatDate(new Date())

  const text = [
    "🏥 *New Clinic Contacted*",
    "",
    `📌 *Name:* ${escapeMarkdown(data.clinicName)}`,
    `📞 *Phone:* ${escapeMarkdown(data.phoneNumber)}`,
    "",
    `🕐 ${now} da yubordi`,
  ].join("\n")

  const url = `${TELEGRAM_API}/bot${token}/sendMessage`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Telegram API error: ${res.status} ${err}`)
  }
}

function escapeMarkdown(s: string): string {
  return s.replace(/([_*[\]()~`>#+=|{}.!-])/g, "\\$1")
}
