import { ObjectId } from "mongodb"
import { badRequest } from "@/common/errors"

/**
 * Convert string to ObjectId.
 * Throws AppError 400 if invalid (never a bare Error → 500).
 */
export function toObjectId(value: string | undefined | null, field = "id"): ObjectId {
  if (!value || !ObjectId.isValid(value)) {
    throw badRequest(`Invalid ${field}`, "INVALID_OBJECT_ID")
  }
  return new ObjectId(value)
}

/**
 * Convert string to ObjectId or null if invalid/empty
 */
export function toObjectIdOrNull(value: string | undefined | null): ObjectId | null {
  if (value == null || value === "") return null
  if (!ObjectId.isValid(value)) return null
  return new ObjectId(value)
}

/**
 * Convert ObjectId to hex string
 */
export function objectIdToString(id: ObjectId): string {
  return id.toHexString()
}
