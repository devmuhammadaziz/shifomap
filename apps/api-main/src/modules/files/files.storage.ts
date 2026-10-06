import { GridFSBucket, ObjectId } from "mongodb"
import { getDb, FILES_COLLECTION } from "@/db/mongo"
import { logger } from "@/common/logger"
import type { FileDoc } from "./files.model"

// Bytes live in MongoDB (GridFS) so every API instance sharing the database can
// serve every upload. Local disk is only a legacy fallback for older uploads.
const BUCKET_NAME = "uploads"

function bucket(): GridFSBucket {
  return new GridFSBucket(getDb(), { bucketName: BUCKET_NAME })
}

export async function saveFileBytes(
  id: ObjectId,
  bytes: Uint8Array,
  meta: { filename: string; mimeType: string }
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const stream = bucket().openUploadStreamWithId(id, meta.filename, {
      metadata: { mimeType: meta.mimeType },
    })
    stream.once("error", reject)
    stream.once("finish", () => resolve())
    stream.end(Buffer.from(bytes))
  })
}

async function existsInBucket(id: ObjectId): Promise<boolean> {
  const found = await getDb()
    .collection(`${BUCKET_NAME}.files`)
    .findOne({ _id: id }, { projection: { _id: 1 } })
  return !!found
}

async function readFromBucket(id: ObjectId): Promise<Uint8Array<ArrayBuffer>> {
  const chunks: Buffer[] = []
  await new Promise<void>((resolve, reject) => {
    bucket()
      .openDownloadStream(id)
      .on("data", (c: Buffer) => chunks.push(c))
      .once("error", reject)
      .once("end", () => resolve())
  })
  return new Uint8Array(Buffer.concat(chunks))
}

/**
 * Load file bytes: database first, then the legacy disk path. A file found only on
 * disk is copied into the database so other environments can serve it afterwards.
 */
export async function loadFileBytes(doc: FileDoc): Promise<Uint8Array<ArrayBuffer> | null> {
  if (await existsInBucket(doc._id)) {
    return readFromBucket(doc._id)
  }
  if (!doc.storagePath) return null
  const file = Bun.file(doc.storagePath)
  if (!(await file.exists())) return null
  const bytes = new Uint8Array(await file.arrayBuffer())
  try {
    await saveFileBytes(doc._id, bytes, { filename: doc.originalName, mimeType: doc.mimeType })
    await getDb()
      .collection<FileDoc>(FILES_COLLECTION)
      .updateOne({ _id: doc._id }, { $set: { storage: "gridfs" } })
    logger.info("[files] migrated legacy disk file into database", { id: doc._id.toHexString() })
  } catch (err) {
    logger.warn("[files] could not migrate legacy file", {
      id: doc._id.toHexString(),
      err: err instanceof Error ? err.message : String(err),
    })
  }
  return bytes
}
