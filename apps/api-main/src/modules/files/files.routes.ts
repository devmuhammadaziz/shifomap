import { Elysia } from "elysia"
import { ObjectId } from "mongodb"
import { extname } from "path"
import { getDb, FILES_COLLECTION } from "@/db/mongo"
import { requireAuth } from "@/common/middleware/auth"
import { toObjectId } from "@/common/utils/id"
import { badRequest } from "@/common/errors"
import { mapFileToPublic, type FileDoc } from "./files.model"
import { loadFileBytes, saveFileBytes } from "./files.storage"

const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/heic": ".heic",
  "image/heif": ".heif",
}

/** Mobile clients often send an empty or generic type; trust the file signature instead. */
function sniffImageMime(bytes: Uint8Array): string | null {
  const b = bytes
  if (b.length < 12) return null
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg"
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png"
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif"
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to))
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp"
  if (ascii(4, 8) === "ftyp") {
    const brand = ascii(8, 12)
    if (["heic", "heix", "hevc", "hevx"].includes(brand)) return "image/heic"
    if (["mif1", "msf1", "heim", "heis"].includes(brand)) return "image/heif"
  }
  return null
}

function jsonError(status: number, error: string) {
  return new Response(JSON.stringify({ success: false, error }), {
    status,
    headers: { "content-type": "application/json" },
  })
}

export const filesRoutes = new Elysia({ prefix: "/files" })
  .get("/:id", async ({ params }) => {
    if (!ObjectId.isValid(params.id)) return jsonError(400, "Invalid id")
    const doc = await getDb()
      .collection<FileDoc>(FILES_COLLECTION)
      .findOne({ _id: toObjectId(params.id), deletedAt: null })
    if (!doc) return jsonError(404, "Not found")
    const bytes = await loadFileBytes(doc)
    if (!bytes) return jsonError(404, "File content is missing")
    return new Response(bytes, {
      status: 200,
      headers: {
        "content-type": doc.mimeType,
        "content-length": String(bytes.byteLength),
        // File ids are never reused, so the content behind a URL never changes.
        "cache-control": "public, max-age=31536000, immutable",
        etag: `"${doc._id.toHexString()}"`,
      },
    })
  })
  .use(requireAuth)
  .post("/", async ({ request, auth, set }) => {
    const form = await request.formData().catch(() => {
      throw badRequest("Expected multipart/form-data with a 'file' field")
    })
    const file = form.get("file")
    if (!(file instanceof File)) throw badRequest("file is required")
    if (file.size <= 0) throw badRequest("Empty file")
    if (file.size > 15 * 1024 * 1024) throw badRequest("File too large (max 15MB)")

    const bytes = new Uint8Array(await file.arrayBuffer())
    const declared = (file.type || "").toLowerCase().split(";")[0].trim()
    const mimeType = sniffImageMime(bytes) ?? (declared === "image/jpg" ? "image/jpeg" : declared)
    if (!ALLOWED_MIME.includes(mimeType)) {
      throw badRequest(`Unsupported file type: ${mimeType || "unknown"}`)
    }

    const id = new ObjectId()
    const ext = EXT_BY_MIME[mimeType] ?? (extname(file.name) || ".bin")
    const originalName = file.name || `upload${ext}`
    await saveFileBytes(id, bytes, { filename: originalName, mimeType })

    const doc: FileDoc = {
      _id: id,
      ownerId: auth.sub && ObjectId.isValid(auth.sub) ? toObjectId(auth.sub) : null,
      ownerRole: (auth.role as FileDoc["ownerRole"]) ?? "public",
      originalName,
      mimeType,
      size: bytes.byteLength,
      storagePath: "",
      storage: "gridfs",
      createdAt: new Date(),
      deletedAt: null,
    }
    await getDb().collection<FileDoc>(FILES_COLLECTION).insertOne(doc)
    set.status = 201
    return { success: true, data: mapFileToPublic(doc) }
  })
