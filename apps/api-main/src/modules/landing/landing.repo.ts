import { ObjectId } from "mongodb"
import { getDb, CLINICS_COLLECTION, LANDING_SETTINGS_COLLECTION } from "@/db/mongo"
import type { ClinicDoc } from "@/modules/clinics/clinics.model"

/** Fixed document id for the landing featured-clinics settings. */
export const LANDING_FEATURED_DOC_ID = "featured_clinics"

export type LandingFeaturedDoc = {
  _id: string
  clinicIds: ObjectId[]
  updatedAt: Date
  updatedBy: string | null
}

export type LandingClinicRow = {
  _id: ObjectId
  clinicDisplayName: string
  branding: { logoUrl: string | null }
  status: ClinicDoc["status"]
}

export async function getFeaturedClinicIds(): Promise<ObjectId[]> {
  const db = getDb()
  const doc = await db
    .collection<LandingFeaturedDoc>(LANDING_SETTINGS_COLLECTION)
    .findOne({ _id: LANDING_FEATURED_DOC_ID })
  return doc?.clinicIds ?? []
}

export async function setFeaturedClinicIds(clinicIds: ObjectId[], updatedBy: string | null): Promise<ObjectId[]> {
  const db = getDb()
  const now = new Date()
  await db.collection<LandingFeaturedDoc>(LANDING_SETTINGS_COLLECTION).updateOne(
    { _id: LANDING_FEATURED_DOC_ID },
    {
      $set: {
        clinicIds,
        updatedAt: now,
        updatedBy,
      },
    },
    { upsert: true }
  )
  return clinicIds
}

/** Active, non-deleted clinics — name + logo only. */
export async function listActiveClinicsForLanding(): Promise<LandingClinicRow[]> {
  const db = getDb()
  return db
    .collection<ClinicDoc>(CLINICS_COLLECTION)
    .find(
      { status: "active", deletedAt: null },
      {
        projection: {
          clinicDisplayName: 1,
          "branding.logoUrl": 1,
          status: 1,
        },
      }
    )
    .sort({ clinicDisplayName: 1 })
    .toArray() as Promise<LandingClinicRow[]>
}

/** Load specific clinics by id (active + not deleted). Returns only found ones. */
export async function findActiveClinicsByIds(ids: ObjectId[]): Promise<LandingClinicRow[]> {
  if (ids.length === 0) return []
  const db = getDb()
  return db
    .collection<ClinicDoc>(CLINICS_COLLECTION)
    .find(
      { _id: { $in: ids }, status: "active", deletedAt: null },
      {
        projection: {
          clinicDisplayName: 1,
          "branding.logoUrl": 1,
          status: 1,
        },
      }
    )
    .toArray() as Promise<LandingClinicRow[]>
}
